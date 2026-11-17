const Product = require("../db/productdb");
const ProductOrder = require("../db/orderdb");
const path = require("path");
const fs = require("fs");

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

  // Create Product
  async addproduct(req, res) {
    try {
      const pname = req.body.pname ? req.body.pname.trim() : "";
      if (!pname) {
        return res.status(400).json({ error: "Product name is required" });
      }

      let filename = "";
      if (req.files && req.files.pimg) {
        const objimg = req.files.pimg;
        filename = sanitizeFilename(objimg.name);
        await objimg.mv(path.join(imgDir, filename));
      }

      // Safe stock parsing - avoid falsy 0 converting to 10
      const stock = req.body.pstock !== undefined && req.body.pstock !== ""
        ? Math.max(0, parseInt(req.body.pstock, 10) || 0)
        : 10;

      let status = req.body.pstatus || (stock === 0 ? "Out of Stock" : "Available");

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

  // Select / List all products (with optional filter query)
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

  // Get single product for edit/view
  async editproduct(req, res) {
    try {
      const id = req.params.id || req.body.id || req.query.id;
      if (!id) return res.status(400).json({ error: "Product ID required" });

      const data = await Product.findById(id);
      if (!data) return res.status(404).json({ error: "Product not found" });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Update product
  async updproduct(req, res) {
    try {
      const id = req.params.id || req.body.id || req.query.id;
      if (!id) return res.status(400).json({ error: "Product ID required" });

      const existing = await Product.findById(id);
      if (!existing) return res.status(404).json({ error: "Product not found" });

      // Stock handling
      let newStock = existing.pstock;
      if (req.body.pstock !== undefined && req.body.pstock !== "") {
        newStock = Math.max(0, parseInt(req.body.pstock, 10) || 0);
      }

      const upd = {
        pname:          req.body.pname ? req.body.pname.trim() : existing.pname,
        pprice:         req.body.pprice !== undefined ? Math.max(0, Number(req.body.pprice)) : existing.pprice,
        poriginalPrice: req.body.poriginalPrice !== undefined ? Math.max(0, Number(req.body.poriginalPrice)) : existing.poriginalPrice,
        pcategory:      req.body.pcategory || existing.pcategory,
        pstatus:        req.body.pstatus || (newStock === 0 ? "Out of Stock" : existing.pstatus),
        pstock:         newStock,
        pdetails:       req.body.pdetails !== undefined ? req.body.pdetails : existing.pdetails,
      };

      // Handle image update or removal
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

  // Delete product
  async delproduct(req, res) {
    try {
      const id = req.params.id || req.body.id || req.query.id;
      if (!id) return res.status(400).json({ error: "Product ID required" });
      
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

  // Order / Purchase inquiry
  async orderProduct(req, res) {
    try {
      const {
        productId,
        productName,
        productPrice,
        quantity,
        customerName,
        customerEmail,
        customerPhone,
        address,
        notes,
      } = req.body;

      if (!customerName || !customerPhone) {
        return res.status(400).json({ error: "Customer name and phone number are required" });
      }

      const qty = Math.max(1, parseInt(quantity, 10) || 1);
      const price = Math.max(0, Number(productPrice) || 0);
      const total = price * qty;

      // Check stock if product exists
      if (productId) {
        const product = await Product.findById(productId);
        if (product) {
          if (product.pstock > 0) {
            product.pstock = Math.max(0, product.pstock - qty);
            if (product.pstock === 0) product.pstatus = "Out of Stock";
            await product.save();
          }
        }
      }

      const order = await ProductOrder.create({
        productId:     productId || null,
        productName:   productName || "Yoga Product",
        productPrice:  price,
        quantity:      qty,
        totalAmount:   total,
        customerName:  customerName.trim(),
        customerEmail: customerEmail ? customerEmail.trim() : "",
        customerPhone: customerPhone.trim(),
        address:       address ? address.trim() : "",
        notes:         notes ? notes.trim() : "",
        status:        "Pending",
      });

      res.status(201).json({
        msg: "Order placed successfully! Our team will contact you shortly.",
        order,
      });
    } catch (err) {
      console.error("Order product error:", err);
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
