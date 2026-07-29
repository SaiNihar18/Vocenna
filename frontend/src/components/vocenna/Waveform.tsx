import { useState } from "react";
import { motion } from "framer-motion";

// Signature element — not a Lucide icon. Used for speaking indicators
// and the "no active rooms" empty state.
export function Waveform({
  active = false,
  bars = 5,
  className = "",
  color = "currentColor",
}: {
  active?: boolean;
  bars?: number;
  className?: string;
  color?: string;
}) {
  return (
    <div className={`inline-flex items-end gap-[2px] h-4 ${className}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full origin-bottom"
          style={{ backgroundColor: color, height: "100%" }}
          animate={
            active
              ? { scaleY: [0.3, 1, 0.5, 0.9, 0.35] }
              : { scaleY: 0.35 }
          }
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.09,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Dashboard empty-state wave — interactive,
   animated, hover-aware
   ───────────────────────────────────────────── */
const EMPTY_PATH_TOP =
  "M4 30 Q 24 4 44 30 T 84 30 T 124 30 T 164 30 T 204 30 T 236 30";
const EMPTY_PATH_BOT =
  "M4 30 Q 24 56 44 30 T 84 30 T 124 30 T 164 30 T 204 30 T 236 30";

export function WaveformEmpty({ className = "" }: { className?: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.svg
      viewBox="0 0 240 60"
      className={`cursor-pointer ${className}`}
      fill="none"
      strokeLinecap="round"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ scale: hovered ? 1.06 : 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      aria-hidden
    >
      <defs>
        <filter id="empty-wave-glow" x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur stdDeviation={hovered ? "4" : "2"} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow halo */}
      <motion.path
        d={EMPTY_PATH_TOP}
        stroke="currentColor"
        strokeWidth={hovered ? "5" : "3"}
        filter="url(#empty-wave-glow)"
        animate={{ opacity: hovered ? [0.4, 0.65, 0.4] : [0.2, 0.35, 0.2] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Top wave — marching dash */}
      <motion.path
        d={EMPTY_PATH_TOP}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="30 200"
        animate={{ strokeDashoffset: [230, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        opacity={hovered ? 0.6 : 0}
      />

      {/* Main top line */}
      <motion.path
        d={EMPTY_PATH_TOP}
        stroke="currentColor"
        strokeWidth={hovered ? "2" : "1.5"}
        animate={{ opacity: hovered ? 0.9 : 0.7 }}
        transition={{ duration: 0.3 }}
      />

      {/* Bottom reflection */}
      <motion.path
        d={EMPTY_PATH_BOT}
        stroke="currentColor"
        strokeWidth="1"
        animate={{ opacity: hovered ? 0.55 : 0.3 }}
        transition={{ duration: 0.3 }}
      />

      {/* Hover dot travelling along top wave */}
      {hovered && (
        <motion.circle
          r="3.5"
          fill="currentColor"
          filter="url(#empty-wave-glow)"
          animate={{
            cx: [4, 44, 84, 124, 164, 204, 236],
            cy: [30, 4, 30, 30, 30, 30, 30],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.svg>
  );
}
