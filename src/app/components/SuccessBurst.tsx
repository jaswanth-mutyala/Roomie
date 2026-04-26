import { AnimatePresence, motion } from "motion/react";
import { Check, Send, Inbox, Scissors } from "lucide-react";
import { useEffect } from "react";

export type BurstKind = "split" | "paid" | "received";

const CONFIG: Record<BurstKind, { color: string; title: string; sub: string; icon: React.ReactNode }> = {
  split: {
    color: "#74FF5A",
    title: "Split done",
    sub: "Bill added to your ledger",
    icon: <Scissors size={28} className="text-black" />,
  },
  paid: {
    color: "#FFD84D",
    title: "Paid ✓",
    sub: "UPI payment sent",
    icon: <Send size={28} className="text-black" />,
  },
  received: {
    color: "#B5A8FF",
    title: "Received ✓",
    sub: "Marked as settled",
    icon: <Inbox size={28} className="text-black" />,
  },
};

const CONFETTI = ["#FFD84D", "#74FF5A", "#FF5C39", "#B5A8FF", "#FF9FB8", "#6EE7C7"];

export function SuccessBurst({
  kind,
  onDone,
}: {
  kind: BurstKind | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!kind) return;
    const t = setTimeout(onDone, 1700);
    return () => clearTimeout(t);
  }, [kind, onDone]);

  return (
    <AnimatePresence>
      {kind && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
          />

          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 28 }).map((_, i) => {
              const angle = (i / 28) * Math.PI * 2;
              const dist = 120 + Math.random() * 140;
              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist + 80,
                    opacity: 0,
                    rotate: 360 + Math.random() * 360,
                    scale: 1,
                  }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: 0.05 + (i % 6) * 0.02 }}
                  className="absolute top-1/2 left-1/2 border-2 border-black"
                  style={{
                    width: 10 + (i % 3) * 4,
                    height: 10 + (i % 2) * 6,
                    backgroundColor: CONFETTI[i % CONFETTI.length],
                    borderRadius: i % 3 === 0 ? 999 : 4,
                  }}
                />
              );
            })}
          </div>

          {/* Pulsing ring */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0.9 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="absolute h-40 w-40 rounded-full border-4 border-black"
            style={{ backgroundColor: CONFIG[kind].color }}
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.6, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="relative rounded-[28px] border-2 border-black bg-[#FFFBF2] px-7 py-6 flex flex-col items-center"
            style={{ boxShadow: "6px 6px 0 0 rgba(0,0,0,1)" }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 480, damping: 14 }}
              className="h-20 w-20 rounded-full border-2 border-black flex items-center justify-center relative"
              style={{ backgroundColor: CONFIG[kind].color, boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
            >
              {CONFIG[kind].icon}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.45, type: "spring", stiffness: 600, damping: 12 }}
                className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-black border-2 border-black flex items-center justify-center"
              >
                <Check size={16} className="text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-4 text-center"
            >
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {CONFIG[kind].title}
              </div>
              <div className="mt-1 text-black/60" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                {CONFIG[kind].sub}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
