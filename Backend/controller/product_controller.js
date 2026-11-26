// Server/controller/product_controller.js
const mongoose = require("mongoose");
const Product = require("../db/productdb");
const ProductOrder = require("../db/orderdb");
const path = require("path");
const fs = require("fs");
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
} = require("../services/razorpay_service");

// Ensure upload directory exists
const imgDir = path.join(__dirname, "../public/product_img");
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

function deleteImageFile(filename) {
  if (!filename) return;
  const filePath = path.join(imgDir, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error("Error removing image file:", e);
    }
  }
}

function sanitizeFilename(name) {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}_${base}`;
}

module.exports = {

  // Create Product (Admin)
  async addproduct(req, res) {
    try {
      const pname = req.body.pname ? String(req.body.pname).trim() : "";
      if (!pname) {
        return res.status(400).json({ error: "Product name is required" });
      }

      let filename = "";
      if (req.files && req.files.pimg) {
        const objimg = req.files.pimg;
        filename = sanitizeFilename(objimg.name);
        await objimg.mv(path.join(imgDir, filename));
      }

      const stock = req.body.pstock !== undefined && req.body.pstock !== ""
        ? Math.max(0, parseInt(req.body.pstock, 10) || 0)
        : 10;

      const status = req.body.pstatus || (stock === 0 ? "Out of Stock" : "Available");

      const product = await Product.create({
        pname,
        pprice:         Math.max(0, Number(req.body.pprice) || 0),
        poriginalPrice: Math.max(0, Number(req.body.poriginalPrice) || 0),
        pcategory:      req.body.pcategory || "General",
        pstatus:        status,
        pstock:         stock,
        pimg:           filename,
        pdetails:       req.body.pdetails || "",
      });

      res.status(201).json({ msg: "Product Added", product });
    } catch (err) {
      console.error("Add product error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Select / List all products
  async selproduct(req, res) {
    try {
      const query = {};
      if (req.query.category && req.query.category !== "All") {
        query.pcategory = req.query.category;
      }
      if (req.query.status && req.query.status !== "All") {
        query.pstatus = req.query.status;
      }
      if (req.query.search) {
        const regex = new RegExp(req.query.search, "i");
        query.$or = [{ pname: regex }, { pdetails: regex }];
      }

      const data = await Product.find(query).sort({ createdAt: -1 });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get single product
  async editproduct(req, res) {
    try {
      const id = req.params.id || req.body.id || req.query.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Valid Product ID required" });
      }

      const data = await Product.findById(id);
      if (!data) return res.status(404).json({ error: "Product not found" });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Update product (Admin)
  async updproduct(req, res) {
    try {
      const id = req.params.id || req.body.id || req.query.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Valid Product ID required" });
      }

      const existing = await Product.findById(id);
      if (!existing) return res.status(404).json({ error: "Product not found" });

      let newStock = existing.pstock;
      if (req.body.pstock !== undefined && req.body.pstock !== "") {
        newStock = Math.max(0, parseInt(req.body.pstock, 10) || 0);
      }

      const upd = {
        pname:          req.body.pname ? String(req.body.pname).trim() : existing.pname,
        pprice:         req.body.pprice !== undefined ? Math.max(0, Number(req.body.pprice) || 0) : existing.pprice,
        poriginalPrice: req.body.poriginalPrice !== undefined ? Math.max(0, Number(req.body.poriginalPrice) || 0) : existing.poriginalPrice,
        pcategory:      req.body.pcategory || existing.pcategory,
        pstatus:        req.body.pstatus || (newStock === 0 ? "Out of Stock" : "Available"),
        pstock:         newStock,
        pdetails:       req.body.pdetails !== undefined ? req.body.pdetails : existing.pdetails,
      };

      if (req.files && req.files.pimg) {
        const objimg   = req.files.pimg;
        const filename = sanitizeFilename(objimg.name);
        await objimg.mv(path.join(imgDir, filename));
        if (existing.pimg) deleteImageFile(existing.pimg);
        upd.pimg = filename;
      } else if (req.body.removeImg === "true" || req.body.removeImg === true) {
        if (existing.pimg) deleteImageFile(existing.pimg);
        upd.pimg = "";
      }

      const updatedProduct = await Product.findByIdAndUpdate(id, upd, { new: true });
      res.json({ msg: "Product Updated", product: updatedProduct });
    } catch (err) {
      console.error("Update product error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Delete product (Admin)
  async delproduct(req, res) {
    try {
      const id = req.params.id || req.body.id || req.query.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Valid Product ID required" });
      }

      const product = await Product.findById(id);
      if (product && product.pimg) {
        deleteImageFile(product.pimg);
      }

      await Product.findByIdAndDelete(id);
      res.json({ msg: "Product Deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Place COD / Studio Pickup Order (server-verified price & stock)
  async orderProduct(req, res) {
    try {
      const {
        productId,
        quantity,
        customerName,
        customerEmail,
        customerPhone,
        address,
        notes,
      } = req.body;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: "Valid productId is required" });
      }
      if (!customerName || !String(customerName).trim() || !customerPhone || !String(customerPhone).trim()) {
        return res.status(400).json({ error: "Customer name and phone number are required" });
      }

      const qty = Math.max(1, parseInt(quantity, 10) || 1);
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      if (product.pstatus === "Out of Stock" || (product.pstock ?? 0) < qty) {
        return res.status(400).json({ error: `Insufficient stock available (${product.pstock ?? 0} remaining)` });
      }

      // Compute price strictly from authoritative DB record
      const price = Math.max(0, Number(product.pprice) || 0);
      const total = price * qty;

      product.pstock = Math.max(0, (product.pstock ?? 0) - qty);
      if (product.pstock === 0) product.pstatus = "Out of Stock";
      await product.save();

      const order = await ProductOrder.create({
        userId:        req.user?.id ? String(req.user.id) : null,
        productId:     product._id,
        productName:   product.pname,
        productPrice:  price,
        quantity:      qty,
        totalAmount:   total,
        currency:      "INR",
        customerName:  String(customerName).trim(),
        customerEmail: customerEmail ? String(customerEmail).trim() : (req.user?.email || ""),
        customerPhone: String(customerPhone).trim(),
        address:       address ? String(address).trim() : "",
        notes:         notes ? String(notes).trim() : "",
        status:        "Pending",
        paymentMethod: "COD / Direct Inquiry",
        isPaid:        false,
      });

      res.status(201).json({
        msg: "Order inquiry placed! Our studio team will contact you shortly.",
        order,
      });
    } catch (err) {
      console.error("Order product error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // POST /product/create-payment-order (Razorpay Online Store Order)
  async createProductPaymentOrder(req, res) {
    try {
      const {
        productId,
        quantity,
        customerName,
        customerEmail,
        customerPhone,
        address,
        notes,
      } = req.body;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: "Valid productId is required" });
      }
      if (!customerName || !String(customerName).trim() || !customerPhone || !String(customerPhone).trim()) {
        return res.status(400).json({ error: "Customer name and phone number are required" });
      }

      const qty = Math.max(1, parseInt(quantity, 10) || 1);
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      if (product.pstatus === "Out of Stock" || (product.pstock ?? 0) < qty) {
        return res.status(400).json({ error: `Insufficient stock available (${product.pstock ?? 0} remaining)` });
      }

      const price = Math.max(0, Number(product.pprice) || 0);
      const total = price * qty;
      if (total <= 0) {
        return res.status(400).json({ error: "Free items can use Direct Inquiry instead of Razorpay." });
      }

      const orderInfo = await createRazorpayOrder({
        amountInINR: total,
        currency: "INR",
        receiptPrefix: `prd_${String(product._id).slice(-6)}`,
        notes: {
          type: "product_order",
          productId: String(product._id),
          qty: String(qty),
          userId: req.user?.id ? String(req.user.id) : "guest",
        },
      });

      const order = await ProductOrder.create({
        userId:        req.user?.id ? String(req.user.id) : null,
        productId:     product._id,
        productName:   product.pname,
        productPrice:  price,
        quantity:      qty,
        totalAmount:   total,
        currency:      orderInfo.currency,
        customerName:  String(customerName).trim(),
        customerEmail: customerEmail ? String(customerEmail).trim() : (req.user?.email || ""),
        customerPhone: String(customerPhone).trim(),
        address:       address ? String(address).trim() : "",
        notes:         notes ? String(notes).trim() : "",
        status:        "Awaiting Payment",
        paymentMethod: "Razorpay Online",
        orderId:       orderInfo.orderId,
        isPaid:        false,
      });

      res.json({
        ...orderInfo,
        dbOrderId: order._id,
        productName: product.pname,
      });
    } catch (err) {
      console.error("Create product payment order error:", err);
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  },

  // POST /product/verify-payment (Razorpay HMAC Verification + Atomic Stock Decrement)
  async verifyProductPayment(req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        dbOrderId,
      } = req.body;

      const valid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (!valid) {
        return res.status(400).json({ error: "Payment verification failed - invalid signature." });
      }

      const query = { orderId: razorpay_order_id };
      if (dbOrderId && mongoose.Types.ObjectId.isValid(dbOrderId)) {
        query._id = dbOrderId;
      }

      const order = await ProductOrder.findOne(query);
      if (!order) {
        return res.status(404).json({ error: "Matching pending product order not found." });
      }

      if (!order.isPaid) {
        order.isPaid = true;
        order.paymentId = razorpay_payment_id;
        order.status = "Confirmed";
        order.paidAt = new Date();
        await order.save();

        if (order.productId) {
          const product = await Product.findById(order.productId);
          if (product) {
            product.pstock = Math.max(0, (product.pstock ?? 0) - order.quantity);
            if (product.pstock === 0) product.pstatus = "Out of Stock";
            await product.save();
          }
        }
      }

      res.json({ msg: "Payment verified and order confirmed!", order });
    } catch (err) {
      console.error("Verify product payment error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Admin list orders
  async listOrders(req, res) {
    try {
      const orders = await ProductOrder.find().sort({ createdAt: -1 });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Admin update order status
  async updateOrderStatus(req, res) {
    try {
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: "Order ID and status are required" });
      }

      const updated = await ProductOrder.findByIdAndUpdate(id, { status }, { new: true });
      if (!updated) return res.status(404).json({ error: "Order not found" });

      res.json({ msg: "Order status updated", order: updated });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Product stats for admin dashboard
  async productStats(req, res) {
    try {
      const totalProducts    = await Product.countDocuments();
      const outOfStockCount  = await Product.countDocuments({ $or: [{ pstock: { $lte: 0 } }, { pstatus: "Out of Stock" }] });
      const totalOrders      = await ProductOrder.countDocuments();
      const pendingOrders    = await ProductOrder.countDocuments({ status: "Pending" });

      res.json({
        totalProducts,
        outOfStockCount,
        totalOrders,
        pendingOrders,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
