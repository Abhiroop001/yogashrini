// Frontend/src/components/PageLoader.tsx
// Lightweight animated Suspense fallback for lazy-loaded routes
import React from "react";
import { motion } from "framer-motion";
import { GiLotus } from "react-icons/gi";

interface PageLoaderProps {
  label?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ label = "Loading module..." }) => {
  return (
    <div
      className="yoga-container d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: "48vh", padding: "40px 16px" }}
    >
      <motion.div
        animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--brand-primary-subtle)",
          border: "1px solid rgba(255, 45, 111, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--brand-primary)",
          marginBottom: 12,
        }}
      >
        <GiLotus size={28} />
      </motion.div>
      <div className="small fw-semibold text-muted">{label}</div>
    </div>
  );
};

export default PageLoader;
