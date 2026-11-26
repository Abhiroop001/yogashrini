// Frontend/src/pages/Types.tsx
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import posesData from "../data/Poses.json";
import "./Types.css";
import { GiLotus } from "react-icons/gi";
import {
  MdSearch,
  MdSelfImprovement,
  MdSearchOff,
  MdContentCopy,
  MdExpandMore,
  MdExpandLess,
  MdDone,
} from "react-icons/md";
import { PoseItem } from "../types";

const ALL_POSES: PoseItem[] = (posesData as { Poses?: PoseItem[] })?.Poses || [];

const PoseThumbnail: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="types-img-wrap" title={alt}>
        <MdSelfImprovement size={30} style={{ color: "var(--brand-primary)" }} />
      </div>
    );
  }

  return (
    <div className="types-img-wrap">
      <img
        src={src}
        alt={alt}
        className="types-pose-img"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export const Types: React.FC = () => {
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
    <div className="types-page">
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
              <GiLotus size={24} />
            </div>
            <div>
              <h1 className="m-0 fs-3 fw-bold">Classical Asana Compendium</h1>
              <p className="text-secondary small m-0 mt-1">
                Explore {ALL_POSES.length} canonical yoga postures with Sanskrit nomenclature and alignment cues recognized by our AI vision model.
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="yoga-container">
        {/* Search Bar */}
        <div className="card p-3 mb-4">
          <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <div className="input-group input-group-sm flex-grow-1" style={{ maxWidth: 540 }}>
              <label htmlFor="asanas-search" className="visually-hidden">Search yoga poses</label>
              <span className="input-group-text" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-prominent)" }}>
                <MdSearch style={{ color: "var(--text-muted)" }} size={18} />
              </span>
              <input
                id="asanas-search"
                name="query"
                type="text"
                className="form-control"
                placeholder="Search by English or Sanskrit name (e.g. Vrikshasana, Tree)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <span className="badge-pill badge-primary">
              Showing {filtered.length} of {ALL_POSES.length} Postures
            </span>
          </div>
        </div>

        {/* Pose Cards Grid */}
        {filtered.length === 0 ? (
          <div className="card text-center p-5">
            <MdSearchOff size={40} className="text-muted mx-auto mb-2 opacity-50" />
            <h5 className="fw-bold mb-1">No Postures Found</h5>
            <p className="text-muted small mb-3">No poses match "{query}". Try checking the spelling.</p>
            <div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setQuery("")}>
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          <div className="types-pose-grid">
            {filtered.map((pose) => {
              const isExpanded = selectedId === pose.id;
              const hasBenefits = Boolean(pose.pose_benefits);

              return (
                <motion.article
                  key={pose.id}
                  className="types-pose-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div>
                    <div className="d-flex gap-3 align-items-start mb-2">
                      <PoseThumbnail src={pose.img_url || pose.url_png} alt={pose.english_name} />

                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <h4
                          className="fw-bold mb-1 fs-6 text-truncate"
                          title={pose.english_name}
                        >
                          {pose.english_name}
                        </h4>
                        <div className="badge-pill badge-primary mb-1 text-truncate" style={{ maxWidth: "100%" }}>
                          {pose.sanskrit_name}
                        </div>
                      </div>
                    </div>

                    {pose.pose_description && (
                      <p
                        className="text-secondary small mb-2"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: isExpanded ? "unset" : 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {pose.pose_description}
                      </p>
                    )}

                    {hasBenefits && isExpanded && (
                      <div
                        className="p-2 rounded-3 small mb-2"
                        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
                      >
                        <strong className="d-block mb-1 text-primary">Key Benefits:</strong>
                        <span className="text-secondary">{pose.pose_benefits}</span>
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    {hasBenefits ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm p-0 d-flex align-items-center gap-1"
                        style={{ color: "var(--brand-primary)" }}
                        onClick={() => setSelectedId(isExpanded ? null : pose.id)}
                      >
                        {isExpanded ? (
                          <>
                            <MdExpandLess size={16} /> Less
                          </>
                        ) : (
                          <>
                            <MdExpandMore size={16} /> Details
                          </>
                        )}
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm p-1 text-muted flex-shrink-0"
                      title="Copy Sanskrit Name"
                      aria-label={`Copy Sanskrit name ${pose.sanskrit_name}`}
                      onClick={() => handleCopy(pose.id, pose.sanskrit_name)}
                    >
                      {copiedId === pose.id ? (
                        <MdDone size={16} className="text-success" />
                      ) : (
                        <MdContentCopy size={16} />
                      )}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Types;
