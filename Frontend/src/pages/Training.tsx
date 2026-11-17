import React, { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../inc/Navbar";
import Footer from "../inc/Footer";
import "./Training.css";
import { GiLotus } from "react-icons/gi";
import {
  MdSearch,
  MdShoppingBag,
  MdCheckCircle,
  MdClose,
  MdFilterList,
  MdInfo,
  MdOutlineShoppingCart,
  MdErrorOutline,
} from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";

const API = "http://localhost:2000";

interface Product {
  _id: string;
  pname: string;
  pprice: number;
  pcategory?: string;
  pdetails?: string;
  pimage?: string;
  pstock?: number;
}

const PLACEHOLDER_SVG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' fill='%239ca3af' font-family='sans-serif' font-size='18' text-anchor='middle' dy='.3em'%3EYoga Product%3C/text%3E%3C/svg%3E";

export const Training: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
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
      setError("Unable to load products. Please check if the server is running.");
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

  const handleCloseOrder = () => {
    setOrderProduct(null);
    setOrderSuccess(null);
    setOrderError(null);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !orderProduct) {
      setOrderError("Please provide your name and phone number.");
      return;
    }

    setOrderSubmitting(true);
    setOrderError(null);

    try {
      const payload = {
        productId: orderProduct._id,
        productName: orderProduct.pname,
        productPrice: orderProduct.pprice,
        quantity: orderQty,
        customerName,
        customerPhone,
        customerEmail,
        address,
        notes: orderNotes,
      };

      const resp = await fetch(`${API}/product/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (resp.ok) {
        setOrderSuccess(data.msg || "Order placed successfully!");
        getProducts();
      } else {
        setOrderError(data.error || "Failed to place order.");
      }
    } catch {
      setOrderError("Network error. Please try again or order via WhatsApp.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const whatsappMessage = orderProduct
    ? encodeURIComponent(
        `Hello Yogashrini! I am interested in ordering: ${orderProduct.pname} (INR ${orderProduct.pprice}). My name is ${
          customerName || "[Name]"
        }. Please let me know the ordering process.`
      )
    : "";

  return (
    <>
      <Navbar />

      <motion.header
        className="ud-hero mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="ud-hero-inner container">
          <div className="ud-hero-left">
            <GiLotus size={72} className="posture-hero-icon" style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
            <div className="ud-hero-title-wrap">
              <h1 className="ud-title">Yoga Equipment & Training Offerings</h1>
              <p className="ud-subtitle">
                Explore handcrafted organic mats, supportive props, workshop passes, and wellness apparel designed to
                enrich your practice.
              </p>
              <div className="posture-hero-badges">
                <span className="posture-badge">Eco-friendly Mats</span>
                <span className="posture-badge">Certified Studio Props</span>
                <span className="posture-badge">Express Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container pb-5">
        {/* Controls Bar */}
        <div className="card border-0 rounded-4 shadow-sm p-3 mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-light border-0">
                  <MdSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-0"
                  placeholder="Search products, gear, passes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-7">
              <div className="d-flex align-items-center justify-content-md-end gap-2 overflow-auto">
                <span className="text-muted small fw-bold d-flex align-items-center gap-1 text-nowrap">
                  <MdFilterList /> Category:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`btn btn-sm rounded-pill px-3 text-nowrap ${
                      categoryFilter === cat ? "btn-primary shadow-sm" : "btn-light"
                    }`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2 small">Loading gear catalog...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger rounded-4 p-4 text-center">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="card border-0 rounded-4 shadow-sm p-5 text-center bg-white">
            <h5 className="fw-bold mb-2">No products match your criteria</h5>
            <p className="text-muted small mb-4">Try clearing your search query or choosing another category.</p>
            <div>
              <button
                className="btn btn-primary rounded-pill px-4"
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
          <div className="row g-4">
            <AnimatePresence>
              {filteredProducts.map((p, idx) => (
                <motion.div
                  key={p._id}
                  className="col-12 col-sm-6 col-lg-4"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                >
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column hover-lift">
                    <div
                      className="position-relative bg-light"
                      style={{ height: "200px", cursor: "pointer" }}
                      onClick={() => setActiveProduct(p)}
                    >
                      <img
                        src={p.pimage ? `${API}/uploads/${p.pimage}` : PLACEHOLDER_SVG}
                        alt={p.pname}
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => {
                          e.currentTarget.src = PLACEHOLDER_SVG;
                        }}
                      />
                      {p.pcategory && (
                        <span className="position-absolute top-0 start-0 m-3 badge bg-dark bg-opacity-75 rounded-pill px-3 py-1 small">
                          {p.pcategory}
                        </span>
                      )}
                    </div>

                    <div className="card-body p-4 d-flex flex-column flex-grow-1">
                      <h5
                        className="fw-bold text-dark mb-1"
                        style={{ cursor: "pointer" }}
                        onClick={() => setActiveProduct(p)}
                      >
                        {p.pname}
                      </h5>
                      <p
                        className="text-muted small mb-3 flex-grow-1"
                        style={{
                          lineClamp: 2,
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {p.pdetails || "Authentic yoga merchandise and classical training supplies."}
                      </p>

                      <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                        <div>
                          <span className="text-muted small d-block">Price</span>
                          <span className="fw-bold fs-5 text-dark">INR {p.pprice}</span>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                            onClick={() => setActiveProduct(p)}
                            title="Product Details"
                          >
                            <MdInfo /> Details
                          </button>
                          <button
                            className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"
                            onClick={() => handleOpenOrder(p)}
                          >
                            <MdShoppingBag /> Order
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Product Details Modal */}
        <AnimatePresence>
          {activeProduct && (
            <motion.div
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
              style={{ zIndex: 1050 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-4 shadow-lg p-4 m-3"
                style={{ maxWidth: 540, width: "100%" }}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0 text-dark">{activeProduct.pname}</h5>
                  <button
                    className="btn btn-sm btn-light rounded-circle"
                    onClick={() => setActiveProduct(null)}
                  >
                    <MdClose />
                  </button>
                </div>

                <div className="rounded-3 overflow-hidden mb-3 bg-light" style={{ height: "240px" }}>
                  <img
                    src={activeProduct.pimage ? `${API}/uploads/${activeProduct.pimage}` : PLACEHOLDER_SVG}
                    alt={activeProduct.pname}
                    className="w-100 h-100 object-fit-cover"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_SVG;
                    }}
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fs-4 fw-bold text-dark">INR {activeProduct.pprice}</span>
                  {activeProduct.pcategory && (
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1">
                      {activeProduct.pcategory}
                    </span>
                  )}
                </div>

                <p className="text-muted small mb-4">{activeProduct.pdetails}</p>

                <div className="d-flex gap-2 justify-content-end">
                  <button
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => setActiveProduct(null)}
                  >
                    Close
                  </button>
                  <button
                    className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-1"
                    onClick={() => {
                      const p = activeProduct;
                      setActiveProduct(null);
                      handleOpenOrder(p);
                    }}
                  >
                    <MdShoppingBag /> Order Now
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Modal */}
        <AnimatePresence>
          {orderProduct && (
            <motion.div
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
              style={{ zIndex: 1060 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-4 shadow-lg p-4 m-3"
                style={{ maxWidth: 500, width: "100%" }}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                    <MdOutlineShoppingCart className="text-primary" /> Complete Purchase
                  </h5>
                  <button className="btn btn-sm btn-light rounded-circle" onClick={handleCloseOrder}>
                    <MdClose />
                  </button>
                </div>

                {orderSuccess ? (
                  <div className="text-center py-4">
                    <MdCheckCircle className="text-success mb-2" size={48} />
                    <h5 className="fw-bold text-success">Order Received</h5>
                    <p className="text-muted small">{orderSuccess}</p>
                    <button className="btn btn-primary rounded-pill px-4 mt-3" onClick={handleCloseOrder}>
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitOrder}>
                    <div className="p-3 bg-light rounded-3 mb-3 small d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold text-dark">{orderProduct.pname}</div>
                        <div className="text-muted">INR {orderProduct.pprice} per unit</div>
                      </div>
                      <div className="fw-bold fs-5 text-primary">INR {orderProduct.pprice * orderQty}</div>
                    </div>

                    {orderError && (
                      <div className="alert alert-danger py-2 px-3 rounded-3 small mb-3 d-flex align-items-center gap-2">
                        <MdErrorOutline /> {orderError}
                      </div>
                    )}

                    <div className="row g-2 mb-3">
                      <div className="col-8">
                        <label className="form-label small fw-bold">Full Name</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          placeholder="Your name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div className="col-4">
                        <label className="form-label small fw-bold">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          className="form-control"
                          value={orderQty}
                          onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-bold">Phone Number</label>
                        <input
                          type="tel"
                          required
                          className="form-control"
                          placeholder="+91..."
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-bold">Email Address</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Optional"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-bold">Delivery Address</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Street, City, Pin Code"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>

                    <div className="d-flex flex-column gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={orderSubmitting}
                        className="btn btn-primary rounded-pill py-2 fw-bold"
                      >
                        {orderSubmitting ? "Placing Order..." : "Confirm & Place Order"}
                      </button>

                      {whatsappMessage && (
                        <a
                          href={`https://wa.me/919830000000?text=${whatsappMessage}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-success rounded-pill py-2 small fw-bold d-flex align-items-center justify-content-center gap-2"
                        >
                          <FaWhatsapp size={16} /> Order Directly via WhatsApp
                        </a>
                      )}
                    </div>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
};

export default Training;
