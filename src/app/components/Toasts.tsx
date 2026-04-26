import { AnimatePresence, motion } from "motion/react";
import { useStore } from "../store";

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[96px] z-[80] flex flex-col items-center gap-2 px-5">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="rounded-full border-2 border-black px-4 h-11 flex items-center gap-2"
            style={{ backgroundColor: t.tint, boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
          >
            <span
              className="text-black"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}
            >
              {t.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
