// Frontend/src/pages/Posture.tsx
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import "./Posture.css";
import { GiMeditation } from "react-icons/gi";
import {
  MdCloudUpload,
  MdAutoAwesome,
  MdBarChart,
  MdRefresh,
  MdErrorOutline,
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
              <GiMeditation size={24} />
            </div>
            <div>
              <h1 className="m-0 fs-3 fw-bold">AI Asana Posture Classifier</h1>
              <p className="text-secondary small m-0 mt-1">
                Fine-tuned EfficientNetB0 neural network trained on 47 classical postures with 84.96% validation accuracy.
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="yoga-container">
        <div className="row g-4 align-items-stretch">
          {/* Upload / Image Feed Column */}
          <div className="col-12 col-lg-6 d-flex flex-column">
            <label htmlFor="posture-file-upload" className="visually-hidden">Upload pose photo</label>
            <input
              id="posture-file-upload"
              name="poseImage"
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
                role="button"
                tabIndex={0}
                className={`posture-dropzone flex-grow-1 ${dragOver ? "dz-over" : ""}`}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
              >
                <div>
                  <MdCloudUpload size={48} style={{ color: "var(--brand-primary)" }} className="mb-2" />
                  <h5 className="fw-bold mb-1 fs-6">Drag & Drop Your Pose Photo</h5>
                  <p className="text-muted small mb-3">or select a JPEG, PNG, or WebP frame from your device</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                  >
                    Select Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="card overflow-hidden flex-grow-1 d-flex flex-column">
                <div className="position-relative flex-grow-1 d-flex align-items-center justify-content-center" style={{ minHeight: 260, backgroundColor: "var(--bg-secondary)" }}>
                  <img
                    src={annotatedImage || filePreview}
                    alt="Pose capture"
                    className="w-100 object-fit-contain"
                    style={{ maxHeight: 380 }}
                  />
                  {sending && (
                    <div
                      className="position-absolute d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-75 text-white"
                      style={{ inset: 0 }}
                    >
                      <div className="spinner-border text-light mb-2" role="status" />
                      <div className="small fw-bold">Analyzing joint kinematics with CNN...</div>
                    </div>
                  )}
                </div>
                <div className="p-3 d-flex justify-content-between align-items-center border-top">
                  <span className="small text-muted">Input Resolution Processed (224x224)</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={resetAll}>
                    <MdRefresh size={16} /> Upload Another
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger mt-3 py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-0">
                <MdErrorOutline size={18} /> {error}
              </div>
            )}
          </div>

          {/* Results Analysis Column */}
          <div className="col-12 col-lg-6">
            <div className="posture-result-card h-100 d-flex flex-column justify-content-center">
              <h4 className="fw-bold fs-5 mb-3 d-flex align-items-center gap-2">
                <MdBarChart style={{ color: "var(--brand-accent)" }} /> Classification Diagnostics
              </h4>

              {prediction ? (
                <div>
                  <div
                    className="p-3 rounded-3 mb-4"
                    style={{ backgroundColor: "var(--brand-primary-subtle)", border: "1px solid rgba(255, 45, 111, 0.2)" }}
                  >
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
                          <motion.div
                            className="probability-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(3, item.score * 100))}%` }}
                            transition={{ duration: 0.45, delay: idx * 0.06 }}
                            style={{ opacity: idx === 0 ? 1 : 0.65 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-4 posture-empty-state">
                  <MdAutoAwesome size={44} className="mb-2 posture-empty-icon" />
                  <p className="small m-0 posture-empty-text">
                    Upload a yoga pose photo to view real-time CNN predictions and Top-5 probability rankings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Posture;
