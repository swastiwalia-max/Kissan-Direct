// ============================================================================
// Lush SVG foliage & Indian crops background decoration
// ============================================================================

export function WheatIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 118V30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {[14, 26, 38, 50, 62, 74].map((y, i) => (
        <g key={y}>
          <ellipse cx={30 - 10 - (i % 2)} cy={y} rx="8" ry="4.5" transform={`rotate(-30 ${30 - 10} ${y})`} fill="currentColor" opacity="0.85" />
          <ellipse cx={30 + 10 + (i % 2)} cy={y + 6} rx="8" ry="4.5" transform={`rotate(30 ${30 + 10} ${y + 6})`} fill="currentColor" opacity="0.85" />
        </g>
      ))}
      <ellipse cx="30" cy="10" rx="7" ry="10" fill="currentColor" />
    </svg>
  );
}

export function LeafIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 70 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M35 88C15 70 8 46 20 20C30 0 55 4 62 22C70 42 60 66 35 88Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M35 84C33 60 33 34 40 12" stroke="var(--warm-white, #fff)" strokeWidth="2" strokeOpacity="0.5" strokeLinecap="round" />
    </svg>
  );
}

export function LeafBranch({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 135 Q45 70 50 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      {[20, 45, 70, 95].map((y, i) => (
        <g key={y}>
          <path
            d={`M50 ${y} C20 ${y - 20} 10 ${y - 5} 20 ${y + 12} C32 ${y + 20} 50 ${y} 50 ${y}Z`}
            fill="currentColor"
            opacity={0.75 + (i % 3) * 0.1}
          />
          <path
            d={`M50 ${y + 10} C80 ${y - 10} 90 ${y + 5} 80 ${y + 22} C68 ${y + 30} 50 ${y + 10} 50 ${y + 10}Z`}
            fill="currentColor"
            opacity={0.85 - (i % 2) * 0.15}
          />
        </g>
      ))}
      <circle cx="50" cy="10" r="7" fill="currentColor" />
    </svg>
  );
}

export function MustardIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 108V40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 70C18 66 10 70 6 78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M30 82C42 78 50 82 54 90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {[8, 22, 36].map((offset, i) => (
        <circle key={i} cx={30 + (i % 2 === 0 ? -offset * 0.4 : offset * 0.4)} cy={30 - offset} r="7" fill="var(--mustard, #d6a13d)" opacity="0.95" />
      ))}
      <circle cx="30" cy="10" r="8" fill="var(--mustard, #d6a13d)" />
    </svg>
  );
}

export function SugarcaneIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 128V15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {[30, 50, 70, 90, 108].map((y) => (
        <line key={y} x1="12" y1={y} x2="28" y2={y} stroke="var(--warm-white, #fff)" strokeOpacity="0.4" strokeWidth="2" />
      ))}
      <path d="M20 15C10 5 6 -2 8 -8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 15C28 6 34 0 34 -8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function MaizeIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 50 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 108V50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <rect x="10" y="10" width="30" height="46" rx="15" fill="var(--mustard-light, #f0d190)" />
      {[16, 24, 32, 40].map((y) => (
        <circle key={y} cx="18" cy={y} r="3" fill="var(--mustard, #d6a13d)" />
      ))}
      {[16, 24, 32, 40].map((y) => (
        <circle key={`b${y}`} cx="32" cy={y + 4} r="3" fill="var(--mustard, #d6a13d)" />
      ))}
      <path d="M25 10C20 0 14 -4 6 -2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M25 10C30 0 36 -4 44 -2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function SmallLeafCluster({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 46C2 36 2 22 12 12C18 24 18 36 10 46Z" fill="currentColor" opacity="0.85" />
      <path d="M28 46C20 34 22 18 34 6C42 20 40 36 28 46Z" fill="currentColor" opacity="0.95" />
      <path d="M48 46C42 38 42 26 50 18C56 28 54 38 48 46Z" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

const FOLIAGE_ITEMS = [
  // Left flank
  { Icon: LeafBranch, top: "2vh", left: "1vw", w: 100, rot: "-12deg", color: "var(--leaf-green)", sway: "slow" },
  { Icon: LeafIcon, top: "8vh", left: "14vw", w: 55, rot: "24deg", color: "var(--sprout-green)", sway: "med" },
  { Icon: SmallLeafCluster, top: "16vh", left: "4vw", w: 65, rot: "-15deg", color: "var(--leaf-green-soft)", sway: "drift" },
  { Icon: LeafIcon, top: "24vh", left: "18vw", w: 46, rot: "-35deg", color: "var(--forest-green)", sway: "fast" },
  { Icon: WheatIcon, top: "30vh", left: "2vw", w: 80, rot: "10deg", color: "var(--leaf-green)", sway: "med" },
  { Icon: LeafBranch, top: "40vh", left: "10vw", w: 90, rot: "18deg", color: "var(--sprout-green)", sway: "slow" },
  { Icon: SmallLeafCluster, top: "48vh", left: "1vw", w: 75, rot: "-8deg", color: "var(--leaf-green-soft)", sway: "drift" },
  { Icon: LeafIcon, top: "56vh", left: "16vw", w: 60, rot: "40deg", color: "var(--forest-green)", sway: "med" },
  { Icon: MustardIcon, top: "64vh", left: "3vw", w: 75, rot: "-5deg", color: "var(--mustard)", sway: "fast" },
  { Icon: LeafBranch, top: "72vh", left: "11vw", w: 95, rot: "-20deg", color: "var(--leaf-green)", sway: "slow" },
  { Icon: SmallLeafCluster, top: "82vh", left: "2vw", w: 70, rot: "15deg", color: "var(--sprout-green)", sway: "drift" },
  { Icon: LeafIcon, top: "88vh", left: "15vw", w: 52, rot: "-18deg", color: "var(--leaf-green-soft)", sway: "fast" },
  { Icon: LeafBranch, top: "94vh", left: "5vw", w: 85, rot: "30deg", color: "var(--forest-green)", sway: "med" },

  // Right flank
  { Icon: LeafBranch, top: "1vh", right: "2vw", w: 105, rot: "15deg", color: "var(--forest-green)", sway: "slow" },
  { Icon: LeafIcon, top: "7vh", right: "13vw", w: 58, rot: "-28deg", color: "var(--sprout-green)", sway: "fast" },
  { Icon: SmallLeafCluster, top: "15vh", right: "5vw", w: 70, rot: "20deg", color: "var(--leaf-green)", sway: "drift" },
  { Icon: WheatIcon, top: "22vh", right: "16vw", w: 75, rot: "-12deg", color: "var(--leaf-green-soft)", sway: "med" },
  { Icon: SugarcaneIcon, top: "32vh", right: "2vw", w: 55, rot: "8deg", color: "var(--leaf-green)", sway: "slow" },
  { Icon: LeafBranch, top: "42vh", right: "12vw", w: 92, rot: "-15deg", color: "var(--sprout-green)", sway: "med" },
  { Icon: LeafIcon, top: "50vh", right: "4vw", w: 62, rot: "32deg", color: "var(--forest-green)", sway: "fast" },
  { Icon: SmallLeafCluster, top: "58vh", right: "17vw", w: 65, rot: "-10deg", color: "var(--leaf-green-soft)", sway: "drift" },
  { Icon: LeafBranch, top: "66vh", right: "3vw", w: 98, rot: "22deg", color: "var(--leaf-green)", sway: "slow" },
  { Icon: LeafIcon, top: "76vh", right: "14vw", w: 56, rot: "-40deg", color: "var(--sprout-green)", sway: "med" },
  { Icon: MustardIcon, top: "83vh", right: "4vw", w: 70, rot: "10deg", color: "var(--mustard)", sway: "fast" },
  { Icon: SmallLeafCluster, top: "90vh", right: "12vw", w: 75, rot: "25deg", color: "var(--forest-green)", sway: "drift" },
  { Icon: LeafBranch, top: "95vh", right: "2vw", w: 85, rot: "-18deg", color: "var(--leaf-green-soft)", sway: "slow" },
];

export default function CropField() {
  return (
    <div
      className="kd-crop-layer"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 1,
      }}
      aria-hidden="true"
    >
      {FOLIAGE_ITEMS.map((item, i) => {
        const { Icon, w, rot, sway, color, ...pos } = item;
        return (
          <div
            key={i}
            className={`kd-crop kd-crop--sway-${sway}`}
            style={{
              position: "absolute",
              ...pos,
              width: w,
              color,
              transform: `rotate(${rot})`,
            }}
          >
            <Icon style={{ width: "100%", height: "auto" }} />
          </div>
        );
      })}
    </div>
  );
}