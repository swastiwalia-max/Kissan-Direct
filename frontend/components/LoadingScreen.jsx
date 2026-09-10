import { Sprout } from "lucide-react";

/**
 * Full-screen branded loading transition. Shows a small chibi scene:
 * farmer + produce crate --- truck (driving) --- buyer with phone.
 */
export default function LoadingScreen({ label = "Getting things ready…" }) {
  return (
    <div className="kd-loading">
      <div className="kd-loading__scene">
        <svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg">
          {/* ground line */}
          <line x1="10" y1="190" x2="510" y2="190" stroke="var(--earth-brown, #6b4a34)" strokeOpacity="0.25" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />

          {/* ---- Farmer (left) ---- */}
          <g transform="translate(30,80)">
            <circle cx="30" cy="18" r="16" fill="#e7b98a" />
            <path d="M14 12a16 12 0 0 1 32 0c-6-4-26-4-32 0Z" fill="var(--forest-green-dark, #163a21)" />
            <rect x="12" y="34" width="36" height="46" rx="10" fill="var(--leaf-green, #4a7c3f)" />
            <rect x="4" y="42" width="14" height="30" rx="6" fill="#e7b98a" />
            <rect x="42" y="42" width="14" height="30" rx="6" fill="#e7b98a" />
            <rect x="14" y="78" width="14" height="24" rx="5" fill="var(--soil-brown, #3c2a1f)" />
            <rect x="32" y="78" width="14" height="24" rx="5" fill="var(--soil-brown, #3c2a1f)" />
          </g>

          {/* crate with produce */}
          <g transform="translate(90,120)">
            <rect x="0" y="14" width="64" height="40" rx="4" fill="var(--bark-brown, #8a6a4e)" />
            <rect x="4" y="18" width="56" height="32" rx="2" fill="var(--earth-brown, #6b4a34)" />
            <circle cx="18" cy="12" r="9" fill="#c8452f" />
            <circle cx="34" cy="8" r="8" fill="#e2a33b" />
            <circle cx="49" cy="13" r="9" fill="#e7c069" />
            <path d="M40 6c4-6 10-6 14-2" stroke="var(--leaf-green, #4a7c3f)" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>

          {/* ---- Truck (middle, animated) ---- */}
          <g className="kd-loading__truck" transform="translate(190,110)">
            <rect x="0" y="8" width="86" height="42" rx="6" fill="var(--warm-white, #fffcf6)" stroke="var(--forest-green, #1f4d2c)" strokeWidth="2" />
            <rect x="86" y="20" width="38" height="30" rx="5" fill="var(--forest-green, #1f4d2c)" />
            <rect x="96" y="26" width="16" height="12" rx="2" fill="var(--sprout-green, #a9c98f)" />
            <g transform="translate(20,50)">
              <circle r="10" fill="var(--soil-brown, #3c2a1f)" className="kd-loading__wheel" />
              <circle r="4" fill="var(--warm-white, #fffcf6)" />
            </g>
            <g transform="translate(100,50)">
              <circle r="10" fill="var(--soil-brown, #3c2a1f)" className="kd-loading__wheel" />
              <circle r="4" fill="var(--warm-white, #fffcf6)" />
            </g>
            <rect x="8" y="16" width="20" height="14" rx="2" fill="var(--mustard, #d6a13d)" />
            <rect x="32" y="16" width="20" height="14" rx="2" fill="var(--leaf-green, #4a7c3f)" />
            <rect x="56" y="16" width="20" height="14" rx="2" fill="#e2a33b" />
          </g>

          {/* ---- Buyer (right) ---- */}
          <g transform="translate(430,80)">
            <circle cx="30" cy="18" r="16" fill="#deae7e" />
            <path d="M14 10c4-8 32-8 32 4-10-6-24-6-32-4Z" fill="var(--soil-brown, #3c2a1f)" />
            <rect x="12" y="34" width="36" height="46" rx="10" fill="var(--mustard, #d6a13d)" />
            <rect x="4" y="42" width="14" height="26" rx="6" fill="#deae7e" />
            <rect x="42" y="42" width="14" height="26" rx="6" fill="#deae7e" />
            <rect x="14" y="78" width="14" height="24" rx="5" fill="var(--soil-brown, #3c2a1f)" />
            <rect x="32" y="78" width="14" height="24" rx="5" fill="var(--soil-brown, #3c2a1f)" />
            {/* phone */}
            <rect x="0" y="46" width="12" height="20" rx="2" fill="var(--forest-green-dark, #163a21)" />
          </g>
        </svg>
      </div>

      <div className="kd-flex kd-flex--gap-sm">
        <Sprout size={18} color="var(--leaf-green)" />
        <span className="kd-loading__title">Kissan-Direct</span>
      </div>
      <p className="kd-body-muted">{label}</p>
      <div className="kd-loading__bar">
        <div className="kd-loading__bar-fill" />
      </div>
    </div>
  );
}
