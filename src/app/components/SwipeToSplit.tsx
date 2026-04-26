import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function SwipeToSplit({
  label = "Swipe to Split",
  color = "#74FF5A",
  disabled = false,
  onComplete,
}: {
  label?: string;
  color?: string;
  disabled?: boolean;
  onComplete?: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [phase, setPhase] = useState<"idle" | "done">("idle");
  const [maxX, setMaxX] = useState(0);

  // Measure continuously (handles sheet mount + orientation change)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setMaxX(Math.max(0, el.offsetWidth - 60 - 8));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fillWidth = useTransform(x, (v) => Math.max(60, v + 60));
  const textOpacity = useTransform(x, [0, maxX * 0.4], [1, 0]);
  const arrowOpacity = useTransform(x, [0, maxX * 0.5], [1, 0]);

  const reset = () => {
    animate(x, 0, { type: "spring", stiffness: 520, damping: 38 });
  };

  const finish = () => {
    animate(x, maxX, { type: "spring", stiffness: 380, damping: 30 });
    setPhase("done");
    setTimeout(() => {
      onComplete?.();
      x.set(0);
      setPhase("idle");
    }, 700);
  };

  return (
    <div
      ref={trackRef}
      className="relative h-[60px] w-full rounded-full bg-black overflow-hidden select-none touch-none"
    >
      {/* Fill */}
      <motion.div
        className="absolute top-0 left-0 h-full rounded-full pointer-events-none"
        style={{ width: fillWidth, backgroundColor: disabled ? "#666" : color }}
      />

      {/* Idle label */}
      <motion.div
        style={{ opacity: textOpacity }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <span
          className="text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.16em" }}
        >
          {label.toUpperCase()}
        </span>
      </motion.div>

      {/* Animated arrows */}
      <motion.div
        style={{ opacity: arrowOpacity }}
        className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="text-white"
          >
            ›
          </motion.span>
        ))}
      </motion.div>

      {/* Done overlay */}
      {phase === "done" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span
            className="text-black"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "0.16em" }}
          >
            SPLIT DONE ✓
          </span>
        </motion.div>
      )}

      {/* Thumb */}
      <motion.div
        drag={disabled ? false : "x"}
        dragConstraints={{ left: 0, right: maxX }}
        dragElastic={0}
        dragMomentum={false}
        className={`absolute top-1 left-1 h-[52px] w-[52px] rounded-full bg-white flex items-center justify-center cursor-grab active:cursor-grabbing z-10 ${phase === "done" || disabled ? "pointer-events-none" : ""}`}
        style={{ x, opacity: disabled ? 0.4 : 1 }}
        onDragEnd={() => {
          if (phase === "done") return;
          if (maxX <= 0) return reset();
          const v = x.get();
          if (v >= maxX * 0.82) finish();
          else reset();
        }}
      >
        {phase === "done" ? <Check size={22} className="text-black" /> : <ArrowRight size={22} className="text-black" />}
      </motion.div>
    </div>
  );
}
