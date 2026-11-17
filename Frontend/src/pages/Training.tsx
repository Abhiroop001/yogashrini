// src/pages/Training.tsx
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Training.css";
import { GiLotus } from "react-icons/gi";
import {
  MdSearch,
  MdShoppingBag,
  MdCheckCircle,
  MdClose,
  MdFilterList,
  MdOutlineShoppingCart,
  MdErrorOutline,
} from "react-icons/md";
import { Product } from "../types";

const API = "http://localhost:2000";

const PLACEHOLDER_SVG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' fill='%239ca3af' font-family='sans-serif' font-size='18' text-anchor='middle' dy='.3em'%3EYoga Product%3C/text%3E%3C/svg%3E";

export const Training: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Order form state
  const [orderQty, setOrderQty] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [orderSubmitting, setOrderSubmitting] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const getProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch(`${API}/product/sel`);
      if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
      const data = await resp.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to load store products. Please check if the server is running.");
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
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !orderProduct) {
      setOrderError("Please enter your name and phone number.");
      return;
    }

    setOrderSubmitting(true);
    setOrderError(null);

    try {
      const resp = await fetch(`${API}/product/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: orderProduct._id,
          productName: orderProduct.pname,
          productPrice: orderProduct.pprice,
          quantity: orderQty,
          customerName,
          customerPhone,
          customerEmail,
          address,
          notes: orderNotes,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Order placement failed");

      setOrderSuccess(data.msg || "Order placed successfully! Our team will contact you shortly.");
      setTimeout(() => {
        setOrderProduct(null);
        setOrderSuccess(null);
      }, 2500);
    } catch (err: any) {
      setOrderError(err.message || "Failed to submit inquiry. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  return (
    <div className="training-page">
      {/* Hero Header */}
      <motion.div
        className="ud-hero-section mb-4"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="yoga-container">
          <div className="d-flex align-items-center gap-3">
            <div className="ud-ai-badge-icon">
              <MdShoppingBag size={28} />
            </div>
            <div>
              <h1 className="m-0 fs-3 fw-bold">Yogashrini Wellness Store & Materials</h1>
              <p className="text-secondary small m-0 mt-1">
                Authentic props, cork mats, meditation cushions, and comprehensive training materials.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <main className="yoga-container">
        {/* Search & Category Filter */}
        <div className="card p-3 mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-prominent)" }}>
                  <MdSearch style={{ color: "var(--text-muted)" }} size={18} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search products or props..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="d-flex align-items-center justify-content-md-end gap-2 overflow-auto pb-1">
                <span className="small fw-bold text-muted d-flex align-items-center gap-1 text-nowrap">
                  <MdFilterList /> Filter:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`btn btn-sm text-nowrap ${
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
              <button className="btn btn-secondary btn-sm" onClick={getProducts}>
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
            {filteredProducts.map((p, idx) => (
              <motion.div
                key={p._id || idx}
                className="product-store-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
              >
                <div className="product-store-card-img-wrap">
                  <img
                    src={p.pimage ? `${API}/product_img/${p.pimage}` : PLACEHOLDER_SVG}
                    alt={p.pname}
                    className="product-store-card-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_SVG;
                    }}
                  />
                  {p.pcategory && (
                    <span className="position-absolute top-0 start-0 m-2 badge-pill badge-primary">
                      {p.pcategory}
                    </span>
                  )}
                </div>

                <div className="product-store-body">
                  <h4 className="product-store-title">{p.pname}</h4>
                  {p.pdetails && (
                    <p className="text-secondary small mb-3" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.pdetails}
                    </p>
                  )}

                  <div className="product-store-price">
                    <span>₹{p.pprice}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenOrder(p)}
                    >
                      <MdOutlineShoppingCart size={15} /> Order Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Order Inquiry Modal / Drawer */}
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
                    <MdShoppingBag style={{ color: "var(--brand-primary)" }} /> Place Order Inquiry
                  </h5>
                  <button
                    className="ud-modal-close-btn"
                    onClick={() => setOrderProduct(null)}
                    aria-label="Close"
                  >
                    <MdClose size={20} />
                  </button>
                </div>

                <div className="ud-modal-body">
                  {orderSuccess ? (
                    <div className="text-center py-4">
                      <MdCheckCircle className="text-success mb-2" size={48} />
                      <h5 className="fw-bold text-success mb-1">Inquiry Placed</h5>
                      <p className="text-muted small m-0">{orderSuccess}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitOrder}>
                      <div className="p-3 rounded-3 mb-3 small" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                        <div className="fw-bold">{orderProduct.pname}</div>
                        <div className="fs-5 fw-bold mt-1" style={{ color: "var(--brand-primary)" }}>
                          ₹{orderProduct.pprice} {orderQty > 1 ? `× ${orderQty} = ₹${Number(orderProduct.pprice || 0) * orderQty}` : ""}
                        </div>
                      </div>

                      {orderError && (
                        <div className="alert alert-danger py-2 small mb-3">{orderError}</div>
                      )}

                      <div className="row g-2 mb-3">
                        <div className="col-8">
                          <label className="form-label small fw-bold">Full Name *</label>
                          <input
                            type="text"
                            required
                            className="form-control form-control-sm"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                          />
                        </div>
                        <div className="col-4">
                          <label className="form-label small fw-bold">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            className="form-control form-control-sm"
                            value={orderQty}
                            onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                          />
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="form-label small fw-bold">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            className="form-control form-control-sm"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-bold">Email Address</label>
                          <input
                            type="email"
                            className="form-control form-control-sm"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-bold">Delivery Address</label>
                        <textarea
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
                          {orderSubmitting ? "Submitting..." : "Confirm Inquiry"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Training;
