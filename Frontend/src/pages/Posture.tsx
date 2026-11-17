import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../inc/Navbar";
import Footer from "../inc/Footer";
import "./Posture.css";
import { GiMeditation } from "react-icons/gi";
import {
  MdCloudUpload,
  MdAutoAwesome,
  MdTipsAndUpdates,
  MdBarChart,
  MdRefresh,
  MdSelfImprovement,
  MdArrowForward,
  MdPhotoCamera,
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
  const [status, setStatus] = useState<string>("idle");
  const [sending, setSending] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fileToDataURL = (file: File, maxW = 900, q = 0.85): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const rd = new FileReader();
      rd.onload = (e) => {
        img.onload = () => {
          const s = Math.min(1, maxW / img.width);
          const w = Math.round(img.width * s);
          const h = Math.round(img.height * s);
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          const ctx = c.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            resolve({ dataUrl: c.toDataURL("image/jpeg", q), width: w, height: h });
          } else {
            reject(new Error("Unable to obtain 2D canvas context"));
          }
        };
        img.onerror = () => reject(new Error("Failed to load image file"));
        img.src = e.target?.result as string;
      };
      rd.onerror = () => reject(new Error("Failed to read image buffer"));
      rd.readAsDataURL(file);
    });
  };

  const handleFile = async (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) {
      setStatus("Please select a valid image file.");
      return;
    }
    setStatus("Preparing image...");
    setPrediction(null);
    setAnnotatedImage(null);
    try {
      const { dataUrl } = await fileToDataURL(file);
      setFilePreview(dataUrl);
      await sendToServer(dataUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus("Error: " + msg);
    }
  };

  const sendToServer = async (dataUrl: string) => {
    setSending(true);
    setStatus("Analysing pose...");
    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!resp.ok) {
        throw new Error((await resp.text()) || `HTTP ${resp.status}`);
      }
      const json = await resp.json();
      setPrediction({
        label: json.label,
        score: json.score,
        top5: json.top5 || [],
      });
      if (json.annotated_image) {
        setAnnotatedImage(
          json.annotated_image.startsWith("data:")
            ? json.annotated_image
            : `data:image/jpeg;base64,${json.annotated_image}`
        );
      }
      setStatus("Done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus("Error: " + msg);
    } finally {
      setSending(false);
    }
  };

  const confColor = (s: number) => (s >= 0.7 ? "#10b981" : s >= 0.45 ? "#f59e0b" : "#ef4444");
  const confLabel = (s: number) => (s >= 0.7 ? "High" : s >= 0.45 ? "Medium" : "Low");

  const reset = () => {
    setFilePreview(null);
    setPrediction(null);
    setAnnotatedImage(null);
    setStatus("idle");
  };

  return (
    <>
      <Navbar />

      {/* Hero */}
      <motion.header
        className="ud-hero posture-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="ud-hero-inner container">
          <div className="ud-hero-left">
            <GiMeditation size={72} className="posture-hero-icon" style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
            <div className="ud-hero-title-wrap">
              <h1 className="ud-title">AI Yoga Pose Detector</h1>
              <p className="ud-subtitle">
                Upload a photo and let our deep neural network classify your yoga asana across 47 classical postures
                instantly.
              </p>
              <div className="posture-hero-badges">
                <span className="posture-badge">47 Poses Recognised</span>
                <span className="posture-badge">Top-5 Predictions</span>
                <span className="posture-badge">Sub-second Inference</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="ud-main container">
        {/* Real-time video banner */}
        <motion.div
          className="alert alert-success d-flex align-items-center justify-content-between flex-wrap gap-3 p-3 mb-4 rounded-4 shadow-sm"
          style={{ border: "1px solid #10B981" }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: "2rem", color: "#10B981" }}>
              <MdSelfImprovement />
            </span>
            <div>
              <h5 className="mb-1 fw-bold text-success">Real-Time Video Posture Coaching Available</h5>
              <p className="mb-0 text-muted small">
                Turn on your camera for live MediaPipe skeleton tracking, GPU alignment against verified datasets, and
                instant voice coaching for Vrikshasana.
              </p>
            </div>
          </div>
          <a
            href="/live-trainer"
            className="btn btn-success fw-bold px-4 py-2 rounded-pill shadow-sm text-nowrap d-flex align-items-center gap-2"
          >
            Launch Live AI Trainer <MdArrowForward />
          </a>
        </motion.div>

        {/* Upload Card */}
        <motion.section
          className="ud-card mb-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="ud-card-header">
            <div className="ud-card-icon">
              <MdCloudUpload size={24} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
            </div>
            <h3>Upload Your Yoga Image</h3>
          </div>
          <div className="ud-card-body">
            <div
              className={`posture-dropzone${dragOver ? " dz-over" : ""}${sending ? " dz-loading" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => !sending && inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              aria-label="Upload yoga image"
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                style={{ display: "none" }}
              />

              {filePreview ? (
                <div className="dz-preview-wrap">
                  <img src={filePreview} alt="Your upload" className="dz-preview-img" />
                  {sending && (
                    <div className="dz-sending-overlay">
                      <div className="posture-spinner" />
                      <span>Analysing posture...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="dz-placeholder">
                  <div className="dz-icon" style={{ fontSize: "2.5rem", color: "var(--yoga-primary, #FF2D6F)" }}>
                    <MdPhotoCamera />
                  </div>
                  <div className="dz-text">
                    Drop your yoga image here or <span className="dz-link">browse files</span>
                  </div>
                  <div className="muted" style={{ fontSize: "0.85rem", marginTop: 6 }}>
                    JPG - PNG - WEBP - max 10 MB
                  </div>
                </div>
              )}
            </div>

            {/* Status bar */}
            {status !== "idle" && (
              <div
                className={`posture-status${
                  status === "Done" ? " ps-ok" : status.startsWith("Error") ? " ps-err" : " ps-loading"
                }`}
              >
                {status !== "Done" && !status.startsWith("Error") && <span className="posture-spinner-sm" />}
                {status.startsWith("Error") && <MdErrorOutline className="me-1" />}
                {status === "Done" && <MdCheckCircle className="me-1" />}
                {status}
              </div>
            )}
          </div>
        </motion.section>

        {/* Prediction Results */}
        <AnimatePresence>
          {prediction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <section className="ud-card mb-4">
                <div className="ud-card-header">
                  <div className="ud-card-icon">
                    <MdAutoAwesome size={24} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
                  </div>
                  <h3>Prediction Result</h3>
                </div>
                <div className="ud-card-body posture-result-body">
                  {annotatedImage && (
                    <div className="posture-annotated-wrap">
                      <div
                        className="muted"
                        style={{
                          fontSize: "0.8rem",
                          marginBottom: 6,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Annotated Output
                      </div>
                      <img src={annotatedImage} alt="Annotated pose" className="posture-annotated-img" />
                    </div>
                  )}

                  <div className="posture-pred-detail">
                    <div className="posture-pred-label">{prediction.label}</div>
                    <div className="posture-pred-score" style={{ color: confColor(prediction.score) }}>
                      {(prediction.score * 100).toFixed(1)}% confidence
                      <span className="posture-conf-badge" style={{ background: confColor(prediction.score) }}>
                        {confLabel(prediction.score)}
                      </span>
                    </div>

                    <div className="posture-conf-track">
                      <motion.div
                        className="posture-conf-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${prediction.score * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ background: confColor(prediction.score) }}
                      />
                    </div>

                    {prediction.top5.length > 0 && (
                      <div className="posture-top5">
                        <div className="posture-top5-title">Top 5 Predictions</div>
                        {prediction.top5.map((item, i) => (
                          <div key={i} className={`posture-top5-row${i === 0 ? " pt5-winner" : ""}`}>
                            <span className="pt5-rank">{i + 1}</span>
                            <span className="pt5-name">{item.label}</span>
                            <div className="pt5-bar-wrap">
                              <motion.div
                                className="pt5-bar"
                                initial={{ width: 0 }}
                                animate={{ width: `${item.score * 100}%` }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                style={{
                                  background: confColor(item.score),
                                  opacity: i === 0 ? 1 : 0.55,
                                }}
                              />
                            </div>
                            <span className="pt5-pct" style={{ color: confColor(item.score) }}>
                              {(item.score * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <div className="grid-3 mb-4">
                <section className="ud-card">
                  <div className="ud-card-header">
                    <div className="ud-card-icon">
                      <MdTipsAndUpdates size={24} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
                    </div>
                    <h3>Tips for Better Results</h3>
                  </div>
                  <div className="ud-card-body">
                    <ul className="offerings-list">
                      <li>Keep your full body visible in the frame.</li>
                      <li>Use a plain, uncluttered background.</li>
                      <li>Ensure good, even lighting without harsh shadows.</li>
                      <li>Hold the pose clearly without motion blur.</li>
                      <li>Portrait orientation works best for standing poses.</li>
                    </ul>
                  </div>
                </section>

                <section className="ud-card">
                  <div className="ud-card-header">
                    <div className="ud-card-icon">
                      <MdBarChart size={24} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
                    </div>
                    <h3>About This Pose Detector</h3>
                  </div>
                  <div className="ud-card-body">
                    <table className="values-table" style={{ fontSize: "0.88rem" }}>
                      <tbody>
                        <tr>
                          <td>
                            <strong>Pose Classes</strong>
                          </td>
                          <td>47 Classical Asanas</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Training Images</strong>
                          </td>
                          <td>2,756 Samples</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Input Size</strong>
                          </td>
                          <td>224 x 224 px</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Output</strong>
                          </td>
                          <td>Top-5 ranked predictions</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="ud-card">
                  <div className="ud-card-header">
                    <div className="ud-card-icon">
                      <MdRefresh size={24} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
                    </div>
                    <h3>Try Another</h3>
                  </div>
                  <div className="ud-card-body d-flex flex-column gap-3">
                    <p className="muted">Upload a different yoga photo to test more poses.</p>
                    <button
                      className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                      onClick={reset}
                    >
                      <MdRefresh /> Upload New Image
                    </button>
                    <a className="btn btn-outline-secondary" href="/types">
                      Browse All 47 Poses
                    </a>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How It Works */}
        {!prediction && (
          <div className="grid-3 mb-4">
            {[
              {
                icon: <MdCloudUpload size={36} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />,
                title: "1. Upload",
                desc: "Drop or browse any clear yoga photo (JPG, PNG, or WEBP).",
              },
              {
                icon: <GiMeditation size={36} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />,
                title: "2. Analyse",
                desc: "Our neural network processes your image across 47 pose classifiers.",
              },
              {
                icon: <MdAutoAwesome size={36} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />,
                title: "3. Result",
                desc: "Receive the predicted pose name, confidence score, and top-5 alternatives.",
              },
            ].map(({ icon, title, desc }) => (
              <section key={title} className="ud-card text-center">
                <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>{icon}</div>
                <h3 style={{ color: "var(--accent)" }}>{title}</h3>
                <p className="muted">{desc}</p>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Posture;
