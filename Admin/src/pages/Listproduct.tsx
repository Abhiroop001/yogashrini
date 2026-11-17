import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../inc/Sidebar";
import Top from "../inc/Top";
import Footer from "../inc/Footer";
import { MdAdd, MdEdit, MdDelete, MdSpa, MdSearch, MdShoppingBag, MdRefresh } from "react-icons/md";
import { Product } from "../types";

const API = "http://localhost:2000";

interface OrderItem {
  _id: string;
  productName: string;
  productPrice: number;
  quantity: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address?: string;
  status?: string;
  createdAt?: string;
}

export const Listproduct: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab] = useState<"catalog" | "orders">("catalog");
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  const getdata = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${API}/product/sel`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setMsg({ type: "danger", text: "Failed to load products from server" });
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const resp = await fetch(`${API}/product/orders`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      // Order endpoint may have no orders yet
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    getdata();
    getOrders();
  }, [getdata, getOrders]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this product/service?")) return;
    const fd = new FormData();
    fd.append("id", id);
    try {
      const resp = await fetch(`${API}/product/del`, { method: "POST", body: fd });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete product");
      }
      setMsg({ type: "success", text: "Product deleted successfully" });
      getdata();
      setTimeout(() => setMsg(null), 2500);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Delete failed";
      setMsg({ type: "danger", text: errorMsg });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const resp = await fetch(`${API}/product/order-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (resp.ok) {
        setMsg({ type: "success", text: "Order status updated" });
        getOrders();
        setTimeout(() => setMsg(null), 2000);
      }
    } catch {
      setMsg({ type: "danger", text: "Failed to update order status" });
    }
  };

  const inStockCount = products.filter((p) => (p.pstock || 0) > 0).length;
  const outOfStockCount = products.length - inStockCount;

  const filtered = products.filter((p) => {
    const matchSearch =
      (p.pname || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.pdetails || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || p.pcategory === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <Top title="Products & Services" />
        <div className="page-container">
          <AnimatePresence>
            {msg && (
              <motion.div
                className={`ys-alert ys-alert-${msg.type}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {msg.text}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="page-header">
            <div>
              <div className="page-title">Store & Equipment Inventory</div>
              <div className="page-subtitle">
                {products.length} product{products.length !== 1 ? "s" : ""} cataloged - {inStockCount} in stock - {outOfStockCount} out of stock
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  getdata();
                  getOrders();
                }}
                className="btn-secondary-ys d-inline-flex align-items-center gap-1"
                title="Refresh"
              >
                <MdRefresh /> Refresh
              </button>
              <Link to="/addproduct" className="btn-primary-ys d-inline-flex align-items-center gap-1">
                <MdAdd /> Add Product
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <button
              onClick={() => setActiveTab("catalog")}
              className={`btn-${activeTab === "catalog" ? "primary" : "secondary"}-ys`}
            >
              <MdSpa /> Catalog ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`btn-${activeTab === "orders" ? "primary" : "secondary"}-ys`}
            >
              <MdShoppingBag /> Customer Orders ({orders.length})
            </button>
          </div>

          {activeTab === "catalog" ? (
            <div className="ys-card">
              <div className="ys-card-header">
                <div className="ys-card-title">
                  <MdSpa /> Active Inventory
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#f4f5fa",
                      borderRadius: 8,
                      padding: "6px 12px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <MdSearch style={{ color: "#9ca3af" }} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search gear..."
                      style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, width: 140 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="ys-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "40px 0" }}>
                          <div className="spinner-border text-primary" />
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>
                          No products found in inventory.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              {p.pimage ? (
                                <img
                                  src={`${API}/uploads/${p.pimage}`}
                                  alt={p.pname}
                                  className="thumb-preview"
                                />
                              ) : (
                                <div
                                  className="thumb-preview"
                                  style={{
                                    background: "#f3f4f6",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#9ca3af",
                                  }}
                                >
                                  <MdSpa size={24} />
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 600 }}>{p.pname}</div>
                                <div style={{ fontSize: 12, color: "#9ca3af" }}>{p.pdetails?.slice(0, 50)}...</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge-ys badge-gray">{p.pcategory || "Equipment"}</span>
                          </td>
                          <td>
                            <strong>INR {p.pprice}</strong>
                          </td>
                          <td>
                            <span className={`badge-ys ${(p.pstock || 0) > 0 ? "badge-success" : "badge-danger"}`}>
                              {(p.pstock || 0) > 0 ? `${p.pstock} Units` : "Out of Stock"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 8 }}>
                              <Link to={`/editproduct/${p._id}`} className="btn-edit-ys" title="Edit">
                                <MdEdit />
                              </Link>
                              <button onClick={() => handleDelete(p._id)} className="btn-danger-ys" title="Delete">
                                <MdDelete />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="ys-card">
              <div className="ys-card-header">
                <div className="ys-card-title">
                  <MdShoppingBag /> Client Orders & Inquiries
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="ys-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Customer Details</th>
                      <th>Address</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersLoading ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "40px 0" }}>
                          <div className="spinner-border text-primary" />
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>
                          No orders logged yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o._id}>
                          <td>
                            <strong>{o.productName}</strong>
                            <div style={{ fontSize: 12, color: "#9ca3af" }}>INR {o.productPrice}</div>
                          </td>
                          <td>{o.quantity}</td>
                          <td>
                            <div>{o.customerName}</div>
                            <div style={{ fontSize: 12, color: "#9ca3af" }}>{o.customerPhone}</div>
                            {o.customerEmail && (
                              <div style={{ fontSize: 11, color: "#9ca3af" }}>{o.customerEmail}</div>
                            )}
                          </td>
                          <td style={{ fontSize: 12, maxWidth: 200 }}>{o.address || "Direct In-Studio"}</td>
                          <td>
                            <select
                              value={o.status || "Pending"}
                              onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                              className="ys-input"
                              style={{ padding: "4px 8px", fontSize: 12, width: 120 }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Listproduct;
