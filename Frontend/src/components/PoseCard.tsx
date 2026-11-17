import React from "react";
import { motion } from "framer-motion";
import { MdVisibility } from "react-icons/md";

interface PoseCardProps {
  id: number | string;
  sanskritName: string;
  englishName: string;
  imgUrl: string;
  onSelect?: () => void;
}

const fallbackSvg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-size='16'>Image not available</text></svg>`
  );

export const PoseCard: React.FC<PoseCardProps> = ({
  id,
  sanskritName,
  englishName,
  imgUrl,
  onSelect,
}) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = fallbackSvg;
  };

  return (
    <motion.div
      className="card h-100 shadow-sm pose-card border-0 rounded-4 overflow-hidden"
      whileHover={{ y: -6, boxShadow: "0 14px 28px rgba(0,0,0,0.12)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="card-img-wrapper position-relative overflow-hidden bg-light" style={{ height: "220px" }}>
        <img
          src={imgUrl}
          alt={`${englishName} (${sanskritName})`}
          className="card-img-top w-100 h-100 object-fit-contain p-3"
          onError={handleImgError}
          loading="lazy"
        />
        <div className="position-absolute top-0 end-0 m-2 badge bg-dark bg-opacity-75 rounded-pill px-2 py-1 small">
          #{id}
        </div>
      </div>

      <div className="card-body d-flex flex-column p-4">
        <h5 className="card-title fw-bold mb-1 text-dark">{englishName}</h5>
        <p className="card-subtitle text-muted mb-3 fst-italic" style={{ fontSize: "0.88rem" }}>
          {sanskritName}
        </p>
        <div className="mt-auto pt-2">
          <button
            type="button"
            className="btn btn-outline-primary w-100 rounded-pill d-flex align-items-center justify-content-center gap-2"
            onClick={onSelect || (() => alert(`${englishName} (${sanskritName})`))}
          >
            <MdVisibility /> View Asana
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PoseCard;
