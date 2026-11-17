import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../inc/Navbar";
import Footer from "../inc/Footer";
import posesData from "../data/Poses.json";
import "./Types.css";
import { GiLotus } from "react-icons/gi";
import {
  MdSearch,
  MdSelfImprovement,
  MdSearchOff,
  MdContentCopy,
  MdCheckCircle,
  MdOpenInNew,
  MdExpandMore,
  MdExpandLess,
  MdDone
} from "react-icons/md";
import { PoseItem } from "../types";

const ALL_POSES: PoseItem[] = (posesData as { Poses?: PoseItem[] })?.Poses || [];

export const Types: React.FC = () => {
  const poses = ALL_POSES;
  const [query, setQuery] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_POSES;
    return ALL_POSES.filter(
      (p) =>
        (p.english_name || "").toLowerCase().includes(q) ||
        (p.sanskrit_name || "").toLowerCase().includes(q)
    );
  }, [query]);

  const handleCopy = (id: number | string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <Navbar />

      {/* Hero */}
      <motion.header
        className="ud-hero types-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="ud-hero-inner container">
          <div className="ud-hero-left">
            <div
              className="posture-hero-icon"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                color: "var(--yoga-primary, #FF2D6F)",
              }}
            >
              <MdSelfImprovement />
            </div>
            <div className="ud-hero-title-wrap">
              <h1 className="ud-title">Yoga Pose Library</h1>
              <p className="ud-subtitle">
                Explore all {poses.length} yoga poses. Browse by English or Sanskrit name, view previews, and discover
                the asanas recognised by our AI model.
              </p>
            </div>
          </div>

          <div className="ud-hero-right">
            <div className="ud-hero-card">
              <div className="ud-hero-card-top">
                <GiLotus size={40} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
                <div>
                  <strong>Pose Library</strong>
                  <div className="muted">Sanskrit & English</div>
                </div>
              </div>
              <div className="ud-stats">
                <div className="stat">
                  <div className="stat-num">{poses.length}</div>
                  <div className="stat-label">Total Poses</div>
                </div>
                <div className="stat">
                  <div className="stat-num">47</div>
                  <div className="stat-label">AI Classes</div>
                </div>
                <div className="stat">
                  <div className="stat-num">SVG</div>
                  <div className="stat-label">Vector Cards</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="ud-main container">
        {/* Search */}
        <section className="ud-card mb-4">
          <div className="ud-card-header">
            <div className="ud-card-icon">
              <MdSearch size={24} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
            </div>
            <h3>Search Poses</h3>
          </div>
          <div className="ud-card-body">
            <div className="types-search-row">
              <input
                id="pose-search"
                type="search"
                placeholder="Search by English or Sanskrit name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="types-search-input"
                aria-label="Search poses by name"
              />
              <span className="types-result-count muted">
                {filtered.length} of {poses.length} poses
              </span>
            </div>
          </div>
        </section>

        {/* Pose Grid */}
        {filtered.length === 0 ? (
          <section className="ud-card text-center py-5">
            <div style={{ fontSize: "3rem", marginBottom: 12, color: "#9ca3af" }}>
              <MdSearchOff />
            </div>
            <h3>
              No poses found for "<strong>{query}</strong>"
            </h3>
            <p className="muted">Try a different spelling or search term.</p>
            <button className="btn btn-primary rounded-pill px-4" onClick={() => setQuery("")}>
              Clear Search
            </button>
          </section>
        ) : (
          <motion.div className="types-pose-grid" role="list" layout>
            <AnimatePresence>
              {filtered.map((p) => (
                <motion.article
                  key={p.id}
                  className="ud-card types-pose-card"
                  role="listitem"
                  tabIndex={0}
                  aria-labelledby={`pose-${p.id}-title`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="types-card-top">
                    <div className="types-img-wrap">
                      <img
                        src={p.img_url}
                        alt={`${p.english_name} - ${p.sanskrit_name}`}
                        className="types-pose-img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='%23f2f4f7'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23aaa' font-size='10'>No image</text></svg>";
                        }}
                      />
                    </div>

                    <div className="types-names">
                      <h3 id={`pose-${p.id}-title`} className="types-english-name">
                        {p.english_name}
                      </h3>
                      <span className="types-sanskrit-pill">{p.sanskrit_name}</span>
                    </div>
                  </div>

                  <div className="types-card-footer">
                    <button
                      className="btn btn-primary types-detail-btn"
                      aria-expanded={selectedId === p.id}
                      onClick={() => setSelectedId((cur) => (cur === p.id ? null : p.id))}
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      {selectedId === p.id ? (
                        <>
                          <MdExpandLess /> Close
                        </>
                      ) : (
                        <>
                          <MdExpandMore /> Details
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline-secondary types-copy-btn"
                      onClick={() => handleCopy(p.id, p.english_name)}
                      title="Copy pose name"
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      {copiedId === p.id ? (
                        <>
                          <MdDone /> Copied
                        </>
                      ) : (
                        <>
                          <MdContentCopy /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  {selectedId === p.id && (
                    <motion.div
                      className="types-details-panel"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <table className="values-table" style={{ fontSize: "0.86rem" }}>
                        <tbody>
                          <tr>
                            <td>
                              <strong>English</strong>
                            </td>
                            <td>{p.english_name || "-"}</td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Sanskrit</strong>
                            </td>
                            <td>{p.sanskrit_name || "-"}</td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Pose ID</strong>
                            </td>
                            <td>{p.id}</td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Preview</strong>
                            </td>
                            <td>
                              <img
                                src={p.img_url}
                                alt={p.english_name}
                                style={{ maxWidth: 180, height: "auto", borderRadius: 8, marginTop: 6 }}
                                loading="lazy"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>AI Model</strong>
                            </td>
                            <td>
                              <span
                                style={{
                                  color: "#10b981",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <MdCheckCircle /> Recognised by EfficientNetB0
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div style={{ marginTop: 10 }}>
                        <a
                          className="btn btn-primary d-inline-flex align-items-center gap-1"
                          href={p.img_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Full Image <MdOpenInNew />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Types;
