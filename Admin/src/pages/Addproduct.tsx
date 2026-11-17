import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../inc/Sidebar";
import Top from "../inc/Top";
import Footer from "../inc/Footer";
import { MdSave, MdArrowBack, MdSpa, MdCloudUpload } from "react-icons/md";

const API = "http://localhost:2000";

export const Addproduct: React.FC = () => {
  const nav = useNavigate();
  const imgRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    pname: "",
    pprice: "",
    poriginalPrice: "",
    pcategory: "Equipment",
    pstatus: "Available",
    pstock: "10",
    pdetails: "",
  });
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pname.trim()) return setMsg({ type: "danger", text: "Product name is required" });

    setLoading(true);
    const fd = new FormData();
    fd.append("pname", form.pname);
    fd.append("pprice", form.pprice);
    fd.append("poriginalPrice", form.poriginalPrice);
    fd.append("pcategory", form.pcategory);
    fd.append("pstatus", form.pstatus);
    fd.append("pstock", form.pstock);
    fd.append("pdetails", form.pdetails);
    if (imgFile) fd.append("pimg", imgFile);

    try {
      const r = await fetch(`${API}/product/add`, { method: "POST", body: fd });
      const data = await r.json();
      if (r.ok) {
        setMsg({ type: "success", text: "Product added successfully!" });
        setTimeout(() => nav("/listproduct"), 1200);
      } else {
        setMsg({ type: "danger", text: data.error || "Failed to add product" });
      }
    } catch {
      setMsg({ type: "danger", text: "Network error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <Top title="Add Product" />
        <div className="page-container">
          <div className="page-header">
            <div>
              <div className="page-title">Catalog New Product</div>
              <div className="page-subtitle">Configure pricing, category, stock inventory, and gear photos</div>
            </div>
            <button onClick={() => nav("/listproduct")} className="btn-secondary-ys d-inline-flex align-items-center gap-1">
              <MdArrowBack /> Back to Catalog
            </button>
          </div>

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

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
              <div>
                <div className="ys-card" style={{ marginBottom: 20 }}>
                  <div className="ys-card-header">
                    <div className="ys-card-title">
                      <MdSpa /> Product Specifications
                    </div>
                  </div>
                  <div className="ys-card-body">
                    <div className="ys-form-group">
                      <label className="ys-label">Product Name *</label>
                      <input
                        className="ys-input"
                        name="pname"
                        required
                        value={form.pname}
                        onChange={handleChange}
                        placeholder="e.g. Natural Cork Yoga Mat (6mm)"
                      />
                    </div>

                    <div className="ys-form-grid">
                      <div className="ys-form-group">
                        <label className="ys-label">Category</label>
                        <select
                          className="ys-input"
                          name="pcategory"
                          value={form.pcategory}
                          onChange={handleChange}
                        >
                          <option value="Equipment">Equipment</option>
                          <option value="Workshops">Workshops</option>
                          <option value="Passes">Passes</option>
                          <option value="Attire">Attire</option>
                          <option value="Digital">Digital</option>
                          <option value="General">General</option>
                        </select>
                      </div>

                      <div className="ys-form-group">
                        <label className="ys-label">Price (INR) *</label>
                        <input
                          type="number"
                          className="ys-input"
                          name="pprice"
                          required
                          value={form.pprice}
                          onChange={handleChange}
                          placeholder="1200"
                        />
                      </div>
                    </div>

                    <div className="ys-form-grid">
                      <div className="ys-form-group">
                        <label className="ys-label">Initial Stock Count</label>
                        <input
                          type="number"
                          className="ys-input"
                          name="pstock"
                          value={form.pstock}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="ys-form-group">
                        <label className="ys-label">Original Price (For discounts)</label>
                        <input
                          type="number"
                          className="ys-input"
                          name="poriginalPrice"
                          value={form.poriginalPrice}
                          onChange={handleChange}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="ys-form-group">
                      <label className="ys-label">Description & Materials</label>
                      <textarea
                        className="ys-input ys-textarea"
                        name="pdetails"
                        rows={4}
                        value={form.pdetails}
                        onChange={handleChange}
                        placeholder="Eco-friendly composition, grip details, sizing..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="ys-card" style={{ marginBottom: 20 }}>
                  <div className="ys-card-header">
                    <div className="ys-card-title">Product Image</div>
                  </div>
                  <div className="ys-card-body">
                    <div
                      className="dropzone-ys"
                      onClick={() => imgRef.current?.click()}
                      style={{ cursor: "pointer", textAlign: "center", padding: "20px" }}
                    >
                      <input
                        ref={imgRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImg}
                        style={{ display: "none" }}
                      />
                      {imgPreview ? (
                        <img
                          src={imgPreview}
                          alt="Product preview"
                          style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: 8 }}
                        />
                      ) : (
                        <div style={{ color: "#9ca3af" }}>
                          <MdCloudUpload size={36} />
                          <div style={{ fontSize: 13, marginTop: 8 }}>Click to upload product image</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-ys"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <MdSave /> {loading ? "Cataloging..." : "Save Product"}
                </button>
              </div>
            </div>
          </form>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Addproduct;
