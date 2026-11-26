import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../inc/Sidebar";
import Top from "../inc/Top";
import Footer from "../inc/Footer";
import { MdSave, MdArrowBack, MdSpa, MdCloudUpload } from "react-icons/md";
import { adminFetch, API_BASE as API } from "../utils/api";

interface ProductFormData {
  pname: string;
  pprice: string | number;
  poriginalPrice: string | number;
  pcategory: string;
  pstatus: string;
  pstock: string | number;
  pdetails: string;
}

export const Editproduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const imgRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductFormData | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [currentImg, setCurrentImg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    const fd = new FormData();
    fd.append("id", id);
    adminFetch("/product/edit", { method: "POST", body: fd })
      .then((r) => r.json())
      .then((data) => {
        setForm({
          pname: data.pname || "",
          pprice: data.pprice ?? "",
          poriginalPrice: data.poriginalPrice ?? "",
          pcategory: data.pcategory || "Equipment",
          pstatus: data.pstatus || "Available",
          pstock: data.pstock ?? "10",
          pdetails: data.pdetails || "",
        });
        setCurrentImg(data.pimg || "");
      })
      .catch(() => setMsg({ type: "danger", text: "Failed to load product details" }));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => (f ? { ...f, [name]: value } : f));
  };

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !id) return;
    setLoading(true);

    const fd = new FormData();
    fd.append("id", id);
    fd.append("pname", form.pname);
    fd.append("pprice", String(form.pprice));
    fd.append("poriginalPrice", String(form.poriginalPrice));
    fd.append("pcategory", form.pcategory);
    fd.append("pstatus", form.pstatus);
    fd.append("pstock", String(form.pstock));
    fd.append("pdetails", form.pdetails);
    if (imgFile) fd.append("pimg", imgFile);

    try {
      const r = await adminFetch("/product/upd", { method: "POST", body: fd });
      if (r.ok) {
        setMsg({ type: "success", text: "Product updated successfully" });
        setTimeout(() => nav("/listproduct"), 1200);
      } else {
        setMsg({ type: "danger", text: "Update failed" });
      }
    } catch {
      setMsg({ type: "danger", text: "Network error occurred" });
    } finally {
      setLoading(false);
    }
  };

  if (!form) {
    return (
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-content">
          <Top title="Edit Product" />
          <div className="page-container" style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="spinner-border text-primary" />
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <Top title="Edit Product" />
        <div className="page-container">
          <div className="page-header">
            <div>
              <div className="page-title">Edit Product / Service</div>
              <div className="page-subtitle">Update pricing, description, stock, and media</div>
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
            <div className="admin-form-split">
              <div>
                <div className="ys-card" style={{ marginBottom: 20 }}>
                  <div className="ys-card-header">
                    <div className="ys-card-title">
                      <MdSpa /> Product Specifications
                    </div>
                  </div>
                  <div className="ys-card-body">
                    <div className="ys-form-group">
                      <label className="ys-label">Product Name</label>
                      <input
                        className="ys-input"
                        name="pname"
                        required
                        value={form.pname}
                        onChange={handleChange}
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
                        <label className="ys-label">Price (INR)</label>
                        <input
                          type="number"
                          className="ys-input"
                          name="pprice"
                          required
                          value={form.pprice}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="ys-form-grid">
                      <div className="ys-form-group">
                        <label className="ys-label">Stock Units</label>
                        <input
                          type="number"
                          className="ys-input"
                          name="pstock"
                          value={form.pstock}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="ys-form-group">
                        <label className="ys-label">Status</label>
                        <select
                          className="ys-input"
                          name="pstatus"
                          value={form.pstatus}
                          onChange={handleChange}
                        >
                          <option value="Available">Available</option>
                          <option value="Out of Stock">Out of Stock</option>
                          <option value="Pre-order">Pre-order</option>
                        </select>
                      </div>
                    </div>

                    <div className="ys-form-group">
                      <label className="ys-label">Details</label>
                      <textarea
                        className="ys-input ys-textarea"
                        name="pdetails"
                        rows={4}
                        value={form.pdetails}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="ys-card" style={{ marginBottom: 20 }}>
                  <div className="ys-card-header">
                    <div className="ys-card-title">Image</div>
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
                      {imgPreview || currentImg ? (
                        <img
                          src={imgPreview || `${API}/product_img/${currentImg}`}
                          alt="Preview"
                          style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: 8 }}
                        />
                      ) : (
                        <div style={{ color: "#9ca3af" }}>
                          <MdCloudUpload size={36} />
                          <div style={{ fontSize: 13, marginTop: 8 }}>Select photo</div>
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
                  <MdSave /> {loading ? "Updating..." : "Save Product Changes"}
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

export default Editproduct;
