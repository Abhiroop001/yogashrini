// Frontend/src/pages/Training.tsx
// Compact Wellness Store with Razorpay Online Checkout + Studio Pickup Support
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Training.css";
import {
  MdSearch,
  MdShoppingBag,
  MdCheckCircle,
  MdClose,
  MdFilterList,
  MdOutlineShoppingCart,
  MdErrorOutline,
  MdPayment,
  MdLocalShipping,
} from "react-icons/md";
import { Product } from "../types";
import { useAuth } from "../AuthContext";
import { API_BASE, authFetch, loadRazorpayScript } from "../utils/api";

const PRODUCT_PLACEHOLDER_SVG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'%3E%3Cdefs%3E%3ClinearGradient id='pg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23FF2D6F' stop-opacity='0.2'/%3E%3Cstop offset='100%25' stop-color='%237C3AED' stop-opacity='0.3'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23pg)'/%3E%3Ccircle cx='200' cy='115' r='44' fill='%23FF2D6F' fill-opacity='0.2'/%3E%3Cpath d='M188 100 L212 100 L218 132 L182 132 Z' fill='%23FF2D6F'/%3E%3Ccircle cx='200' cy='100' r='8' fill='none' stroke='%23FF2D6F' stroke-width='3'/%3E%3Ctext x='50%25' y='68%25' fill='%23E2E8F0' font-family='sans-serif' font-weight='600' font-size='14' text-anchor='middle'%3EYogashrini Wellness Gear%3C/text%3E%3C/svg%3E";

const getProductImage = (p: Product) => {
  const img = p.pimg || p.pimage || p.image;
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) {
    return img;
  }
  return `${API_BASE}/product_img/${img}`;
};

export const Training: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Order form state
  const [orderQty, setOrderQty] = useState<number>(1);
  const [paymentMode, setPaymentMode] = useState<"razorpay" | "cod">("razorpay");
  const [customerName, setCustomerName] = useState<string>(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || "");
  const [address, setAddress] = useState<string>("");
  const [orderSubmitting, setOrderSubmitting] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name && !customerName) setCustomerName(user.name);
    if (user?.email && !customerEmail) setCustomerEmail(user.email);
  }, [user?.name, user?.email]);

  const getProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch(`${API_BASE}/product/sel`);
      if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
      const data = await resp.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to load store products. Please verify the Express backend is running.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  const categories = ["All", "Equipment", "Workshops", "Passes", "Attire", "Digital", "General"];

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      (p.pname || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.pdetails || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || p.pcategory === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleOpenOrder = (product: Product) => {
    setOrderProduct(product);
    setOrderQty(1);
    setOrderSuccess(null);
    setOrderError(null);
    if (user?.name && !customerName) setCustomerName(user.name);
    if (user?.email && !customerEmail) setCustomerEmail(user.email);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !orderProduct?._id) {
      setOrderError("Please enter your name and phone number.");
      return;
    }

    setOrderSubmitting(true);
    setOrderError(null);

    try {
      if (paymentMode === "razorpay" && Number(orderProduct.pprice || 0) > 0) {
        const createResp = await authFetch("/product/create-payment-order", {
          method: "POST",
          body: JSON.stringify({
            productId: orderProduct._id,
            quantity: orderQty,
            customerName,
            customerPhone,
            customerEmail,
            address,
          }),
        });
        const orderData = await createResp.json();
        if (!createResp.ok) throw new Error(orderData.error || "Failed to initialize Razorpay order.");

        const sdkReady = await loadRazorpayScript();
        if (!sdkReady || !(window as any).Razorpay) {
          throw new Error("Could not load Razorpay checkout SDK.");
        }

        const rz = new (window as any).Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Yogashrini Store",
          description: `${orderProduct.pname} (x${orderQty})`,
          order_id: orderData.orderId,
          handler: async (rzResp: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyResp = await authFetch("/product/verify-payment", {
                method: "POST",
                body: JSON.stringify({
                  ...rzResp,
                  dbOrderId: orderData.dbOrderId,
                }),
              });
              const vData = await verifyResp.json();
              if (!verifyResp.ok) throw new Error(vData.error || "Payment verification failed");
              setOrderSuccess(vData.msg || "Payment verified and order confirmed!");
              getProducts();
              setTimeout(() => {
                setOrderProduct(null);
                setOrderSuccess(null);
              }, 2400);
            } catch (err: any) {
              setOrderError(err.message || "Payment verification failed");
            } finally {
              setOrderSubmitting(false);
            }
          },
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone,
          },
          theme: { color: "#FF2D6F" },
          modal: { ondismiss: () => setOrderSubmitting(false) },
        });
        rz.on("payment.failed", (evt: any) => {
          setOrderError(evt?.error?.description || "Payment declined by gateway.");
          setOrderSubmitting(false);
        });
        rz.open();
        return;
      }

      // Direct / COD Inquiry Flow
      const resp = await authFetch("/product/order", {
        method: "POST",
        body: JSON.stringify({
          productId: orderProduct._id,
          quantity: orderQty,
          customerName,
          customerPhone,
          customerEmail,
          address,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Order placement failed");

      setOrderSuccess(data.msg || "Order placed! Our studio team will contact you shortly.");
      getProducts();
      setTimeout(() => {
        setOrderProduct(null);
        setOrderSuccess(null);
      }, 2400);
    } catch (err: any) {
      setOrderError(err.message || "Failed to submit order. Please try again.");
    } finally {
      if (paymentMode === "cod") setOrderSubmitting(false);
    }
  };

  return (
    <div className="training-page">
      {/* Compact Hero Header */}
      <motion.header
        className="ud-hero-section mb-3"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="yoga-container">
          <div className="d-flex align-items-center gap-3">
            <div className="ud-ai-badge-icon">
              <MdShoppingBag size={24} />
            </div>
            <div>
              <h1 className="m-0 fs-3 fw-bold">Yogashrini Wellness Store & Materials</h1>
              <p className="text-secondary small m-0 mt-1">
                Authentic props, cork mats, meditation cushions, and training materials with instant Razorpay checkout.
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="yoga-container">
        {/* Clean Non-Overlapping Search & Wrapped Filter Strip */}
        <div className="card p-3 mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-lg-5">
              <div className="input-group input-group-sm">
                <label htmlFor="store-search-input" className="visually-hidden">Search store products</label>
                <span className="input-group-text" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-prominent)" }}>
                  <MdSearch style={{ color: "var(--text-muted)" }} size={18} />
                </span>
                <input
                  id="store-search-input"
                  name="search"
                  type="text"
                  className="form-control"
                  placeholder="Search products or props..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="compact-filter-bar justify-content-lg-end">
                <span className="small fw-bold text-muted d-flex align-items-center gap-1 me-1">
                  <MdFilterList /> Filter:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`btn btn-sm ${
                      categoryFilter === cat ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2 small">Loading products...</p>
          </div>
        ) : error ? (
          <div className="card text-center p-5">
            <MdErrorOutline size={40} className="text-danger mx-auto mb-2" />
            <h5 className="fw-bold mb-1">Store Unavailable</h5>
            <p className="text-muted small mb-3">{error}</p>
            <div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={getProducts}>
                Retry
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card text-center p-5">
            <h5 className="fw-bold mb-1">No products found</h5>
            <p className="text-muted small mb-3">Try modifying your search query or category.</p>
            <div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("All");
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="product-store-grid">
            {filteredProducts.map((p, idx) => {
              const isOut = (p.pstock ?? 1) <= 0 || p.pstatus === "Out of Stock";
              const rawImg = getProductImage(p);
              const isBrandFallback = (p.pimg || "").toLowerCase().includes("yogashrini");

              return (
                <motion.div
                  key={p._id || idx}
                  className="product-store-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: idx * 0.03 }}
                >
                  <div className="product-store-card-img-wrap">
                    <img
                      src={rawImg || PRODUCT_PLACEHOLDER_SVG}
                      alt={p.pname}
                      loading="lazy"
                      className="product-store-card-img"
                      style={isBrandFallback ? { objectFit: "contain", padding: 12, background: "#0f172a" } : undefined}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PRODUCT_PLACEHOLDER_SVG;
                      }}
                    />
                    {p.pcategory && (
                      <span className="position-absolute top-0 start-0 m-2 badge-pill badge-overlay-surface">
                        {p.pcategory}
                      </span>
                    )}
                    {isOut && (
                      <span className="position-absolute top-0 end-0 m-2 badge bg-danger">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="product-store-body">
                    <h4 className="product-store-title">{p.pname}</h4>
                    {p.pdetails && (
                      <p
                        className="text-secondary small mb-3"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {p.pdetails}
                      </p>
                    )}

                    <div className="product-store-price">
                      <span>₹{p.pprice}</span>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={isOut}
                        onClick={() => handleOpenOrder(p)}
                      >
                        <MdOutlineShoppingCart size={15} /> {isOut ? "Sold Out" : "Order Now"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Order Checkout Modal / Drawer */}
        <AnimatePresence>
          {orderProduct && (
            <div className="ud-modal-backdrop">
              <motion.div
                className="ud-modal-content"
                style={{ maxWidth: 520 }}
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
              >
                <div className="ud-modal-header">
                  <h5 className="fw-bold mb-0 fs-6 d-flex align-items-center gap-2">
                    <MdShoppingBag style={{ color: "var(--brand-primary)" }} /> Store Checkout & Order
                  </h5>
                  <button
                    type="button"
                    className="ud-modal-close-btn"
                    onClick={() => setOrderProduct(null)}
                    aria-label="Close checkout dialog"
                  >
                    <MdClose size={20} />
                  </button>
                </div>

                <div className="ud-modal-body">
                  {orderSuccess ? (
                    <div className="text-center py-4">
                      <MdCheckCircle className="text-success mb-2" size={48} />
                      <h5 className="fw-bold text-success mb-1">Order Confirmed</h5>
                      <p className="text-muted small m-0">{orderSuccess}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitOrder}>
                      <div
                        className="p-3 rounded-3 mb-3 small"
                        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
                      >
                        <div className="fw-bold">{orderProduct.pname}</div>
                        <div className="fs-5 fw-bold mt-1" style={{ color: "var(--brand-primary)" }}>
                          ₹{orderProduct.pprice}
                          {orderQty > 1 ? ` × ${orderQty} = ₹${Number(orderProduct.pprice || 0) * orderQty}` : ""}
                        </div>
                      </div>

                      {orderError && (
                        <div className="alert alert-danger py-2 small mb-3">{orderError}</div>
                      )}

                      {/* Payment Mode Toggle */}
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMode("razorpay")}
                          className={`btn btn-sm flex-grow-1 ${paymentMode === "razorpay" ? "btn-primary" : "btn-secondary"}`}
                        >
                          <MdPayment size={16} /> Pay Online (Razorpay)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMode("cod")}
                          className={`btn btn-sm flex-grow-1 ${paymentMode === "cod" ? "btn-primary" : "btn-secondary"}`}
                        >
                          <MdLocalShipping size={16} /> Studio Pickup / COD
                        </button>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-8">
                          <label htmlFor="ord-name" className="form-label small fw-bold">Full Name *</label>
                          <input
                            id="ord-name"
                            name="customerName"
                            type="text"
                            required
                            className="form-control form-control-sm"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                          />
                        </div>
                        <div className="col-4">
                          <label htmlFor="ord-qty" className="form-label small fw-bold">Quantity</label>
                          <input
                            id="ord-qty"
                            name="quantity"
                            type="number"
                            min="1"
                            max={Math.max(1, orderProduct.pstock || 20)}
                            className="form-control form-control-sm"
                            value={orderQty}
                            onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          />
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label htmlFor="ord-phone" className="form-label small fw-bold">Phone Number *</label>
                          <input
                            id="ord-phone"
                            name="customerPhone"
                            type="tel"
                            required
                            className="form-control form-control-sm"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <label htmlFor="ord-email" className="form-label small fw-bold">Email Address</label>
                          <input
                            id="ord-email"
                            name="customerEmail"
                            type="email"
                            className="form-control form-control-sm"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="ord-addr" className="form-label small fw-bold">Delivery Address</label>
                        <textarea
                          id="ord-addr"
                          name="address"
                          rows={2}
                          className="form-control form-control-sm"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>

                      <div className="d-flex gap-2 justify-content-end pt-2">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setOrderProduct(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={orderSubmitting}
                        >
                          {orderSubmitting
                            ? "Processing..."
                            : paymentMode === "razorpay"
                            ? `Pay ₹${Number(orderProduct.pprice || 0) * orderQty}`
                            : "Confirm Pickup / COD"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Training;
