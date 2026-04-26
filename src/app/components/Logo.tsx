import { motion } from "motion/react";

export function Logo({ size = 64, animated = true }: { size?: number; animated?: boolean }) {
  const r = size / 2;
  return (
    <motion.div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      initial={animated ? { scale: 0.6, rotate: -12, opacity: 0 } : false}
      animate={animated ? { scale: 1, rotate: 0, opacity: 1 } : {}}
      transition={{ type: "spring", stiffness: 220, damping: 14 }}
    >
      {/* Black coin disk */}
      <div
        className="absolute inset-0 rounded-full bg-black border-2 border-black"
        style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,0.85)" }}
      />
      {/* Yellow inner */}
      <motion.div
        animate={animated ? { rotate: 360 } : {}}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        className="absolute rounded-full"
        style={{
          inset: size * 0.12,
          background: "conic-gradient(from 0deg, #FFD84D, #74FF5A, #B5A8FF, #FF9FB8, #FFD84D)",
        }}
      />
      {/* Center coin face */}
      <div
        className="absolute rounded-full bg-[#FFFBF2] border-2 border-black flex items-center justify-center"
        style={{ inset: size * 0.22 }}
      >
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: size * 0.42,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          ₹
        </span>
      </div>
      {/* Orbit dot */}
      {animated && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div
            className="absolute h-2.5 w-2.5 rounded-full bg-[#74FF5A] border-2 border-black"
            style={{ top: -2, left: r - 5 }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
