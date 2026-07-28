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

export function WaveformEmpty({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 60"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M4 30 Q 24 4 44 30 T 84 30 T 124 30 T 164 30 T 204 30 T 236 30" opacity="0.7" />
      <path d="M4 30 Q 24 56 44 30 T 84 30 T 124 30 T 164 30 T 204 30 T 236 30" opacity="0.35" />
    </svg>
  );
}
