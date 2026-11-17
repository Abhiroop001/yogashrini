// src/pages/Posture.tsx
import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Posture.css";
import { GiMeditation } from "react-icons/gi";
import {
  MdCloudUpload,
  MdAutoAwesome,
  MdBarChart,
  MdRefresh,
  MdCheckCircle,
  MdErrorOutline
} from "react-icons/md";

interface TopPrediction {
  label: string;
  score: number;
}

interface PredictionResult {
  label: string;
  score: number;
  top5: TopPrediction[];
}

const API_URL = "http://localhost:5000/predict";

export const Posture: React.FC = () => {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [sending, setSending] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPEG, PNG, WebP).");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setFilePreview(dataUrl);
      classifyImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const classifyImage = async (dataUrl: string) => {
    setSending(true);
    setError(null);
    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Inference server error");

      setPrediction({
        label: data.label,
        score: data.score,
        top5: data.top5 || [],
      });
      if (data.annotated_image) {
        setAnnotatedImage(data.annotated_image);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to Python CV backend (port 5000). Ensure the backend is running.");
    } finally {
      setSending(false);
    }
  };

  const resetAll = () => {
    setFilePreview(null);
    setPrediction(null);
    setAnnotatedImage(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="posture-page">
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
              <GiMeditation size={28} />
            </div>
            <div>
              <h1 className="m-0 fs-3 fw-bold">AI Asana Posture Classifier</h1>
              <p className="text-secondary small m-0 mt-1">
                Fine-tuned EfficientNetB0 neural network trained on 47 classical postures with 84.96% validation accuracy.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <main className="yoga-container">
        <div className="row g-4">
          {/* Upload / Image Feed Column */}
          <div className="col-12 col-lg-6">
            <input
              type="file"
              ref={inputRef}
              accept="image/*"
              className="d-none"
              onChange={(e) => {
                if (e.target.files?.[0]) processFile(e.target.files[0]);
              }}
            />

            {!filePreview ? (
              <div
                className={`posture-dropzone ${dragOver ? "dz-over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
                }}
                onClick={() => inputRef.current?.click()}
              >
                <div>
                  <MdCloudUpload size={48} style={{ color: "var(--brand-primary)" }} className="mb-2" />
                  <h5 className="fw-bold mb-1 fs-6">Drag & Drop Your Pose Photo</h5>
                  <p className="text-muted small mb-3">or click to browse from device</p>
                  <span className="btn btn-primary btn-sm">Select Image</span>
                </div>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="position-relative" style={{ minHeight: 280, backgroundColor: "var(--bg-secondary)" }}>
                  <img
                    src={annotatedImage || filePreview}
                    alt="Pose capture"
                    className="w-100 object-fit-contain"
                    style={{ maxHeight: 420 }}
                  />
                  {sending && (
                    <div className="position-absolute inset-0 d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-75 text-white" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                      <div className="spinner-border text-light mb-2" role="status" />
                      <div className="small fw-bold">Analyzing joint kinematics with CNN...</div>
                    </div>
                  )}
                </div>
                <div className="p-3 d-flex justify-content-between align-items-center border-top">
                  <span className="small text-muted">Input Resolution Processed (224×224)</span>
                  <button className="btn btn-secondary btn-sm" onClick={resetAll}>
                    <MdRefresh size={16} /> Upload Another
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger mt-3 py-2 px-3 small rounded-3 d-flex align-items-center gap-2">
                <MdErrorOutline size={18} /> {error}
              </div>
            )}
          </div>

          {/* Results Analysis Column */}
          <div className="col-12 col-lg-6">
            <div className="posture-result-card h-100">
              <h4 className="fw-bold fs-5 mb-3 d-flex align-items-center gap-2">
                <MdBarChart style={{ color: "var(--brand-accent)" }} /> Classification Diagnostics
              </h4>

              {prediction ? (
                <div>
                  <div className="p-3 rounded-3 mb-4" style={{ backgroundColor: "var(--brand-primary-subtle)", border: "1px solid rgba(255, 45, 111, 0.2)" }}>
                    <div className="small text-uppercase fw-bold" style={{ color: "var(--brand-primary)" }}>
                      Top Detected Asana
                    </div>
                    <div className="fs-4 fw-bold mt-1">{prediction.label}</div>
                    <div className="small text-secondary mt-1">
                      Model Confidence: <strong>{(prediction.score * 100).toFixed(1)}%</strong>
                    </div>
                  </div>

                  <h5 className="fs-6 fw-bold mb-3 text-muted text-uppercase">Top-5 Prediction Distribution</h5>
                  <div className="d-flex flex-column gap-3">
                    {prediction.top5.map((item, idx) => (
                      <div key={idx}>
                        <div className="d-flex justify-content-between align-items-center small">
                          <span className={idx === 0 ? "fw-bold" : "text-secondary"}>
                            {idx + 1}. {item.label}
                          </span>
                          <span className="fw-bold">{(item.score * 100).toFixed(1)}%</span>
                        </div>
                        <div className="probability-bar-track">
                          <div
                            className="probability-bar-fill"
                            style={{
                              width: `${Math.min(100, Math.max(3, item.score * 100))}%`,
                              opacity: idx === 0 ? 1 : 0.65,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <MdAutoAwesome size={48} className="mb-2 opacity-50" />
                  <p className="small m-0">Upload a yoga pose photo to view real-time CNN predictions and probability rankings.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Posture;
