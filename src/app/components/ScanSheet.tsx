import { motion, AnimatePresence } from "motion/react";
import { X, Zap, ImageIcon, Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function ScanSheet({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  const [phase, setPhase] = useState<"scan" | "detect" | "done">("scan");

  useEffect(() => {
    if (!open) return;
    setPhase("scan");
    const t1 = setTimeout(() => setPhase("detect"), 2200);
    const t2 = setTimeout(() => setPhase("done"), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[60] bg-black"
        >
          {/* Fake camera viewfinder */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(600px 400px at 50% 40%, #2a2a2a 0%, #0a0a0a 70%), repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 8px)",
            }}
          />

          {/* Top bar */}
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-5 z-20">
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-white/10 backdrop-blur border-2 border-white/30 flex items-center justify-center"
            >
              <X size={18} className="text-white" />
            </button>
            <div
              className="px-3 h-9 rounded-full bg-[#74FF5A] border-2 border-black flex items-center gap-1.5"
              style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
            >
              <Sparkles size={13} className="text-black" />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em" }}>
                AI OCR
              </span>
            </div>
            <button className="h-10 w-10 rounded-full bg-white/10 backdrop-blur border-2 border-white/30 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </button>
          </div>

          {/* Viewfinder corners */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative" style={{ width: 280, height: 360 }}>
              <Corner pos="tl" />
              <Corner pos="tr" />
              <Corner pos="bl" />
              <Corner pos="br" />

              {/* Mock receipt */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-3 bg-[#FFFBF2] rounded-xl overflow-hidden opacity-80"
              >
                <div className="p-3">
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12 }}>
                    DMART · Koramangala
                  </div>
                  <div className="h-[1px] bg-black/30 my-2" />
                  {["Atta 5kg", "Milk 2L", "Eggs 30pc", "Paneer", "Dal Tadka", "Snacks"].map((x) => (
                    <div key={x} className="flex justify-between text-[10px] py-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <span>{x}</span>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
                        ₹{Math.floor(Math.random() * 400 + 50)}
                      </span>
                    </div>
                  ))}
                  <div className="h-[1px] bg-black/30 my-2" />
                  <div className="flex justify-between" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>
                    <span>TOTAL</span>
                    <span>₹2,620</span>
                  </div>
                </div>
              </motion.div>

              {/* Scan laser */}
              {phase === "scan" && (
                <motion.div
                  initial={{ top: 0 }}
                  animate={{ top: "100%" }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
                  className="absolute left-0 right-0 h-[3px]"
                  style={{ background: "linear-gradient(90deg, transparent, #74FF5A, transparent)", boxShadow: "0 0 20px #74FF5A" }}
                />
              )}

              {/* Detect overlay */}
              {phase !== "scan" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 pointer-events-none"
                >
                  {[30, 60, 90, 120, 150, 180].map((t, i) => (
                    <motion.div
                      key={t}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      className="absolute left-4 h-[14px] rounded bg-[#74FF5A]/30 border border-[#74FF5A] origin-left"
                      style={{ top: `${60 + t}px`, width: `${120 - i * 8}px` }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Status chip */}
          <div className="absolute bottom-44 left-0 right-0 flex justify-center">
            <motion.div
              key={phase}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="px-4 h-10 rounded-full bg-black border-2 border-white/20 flex items-center gap-2 text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12 }}
            >
              {phase === "scan" && <><div className="h-2 w-2 rounded-full bg-[#74FF5A] animate-pulse" /> Scanning receipt...</>}
              {phase === "detect" && <><Sparkles size={14} className="text-[#74FF5A]" /> Detecting items...</>}
              {phase === "done" && <><Check size={14} className="text-[#74FF5A]" /> Found 6 items · ₹2,620</>}
            </motion.div>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-8 z-20">
            <button className="h-12 w-12 rounded-full bg-white/10 backdrop-blur border-2 border-white/30 flex items-center justify-center">
              <ImageIcon size={18} className="text-white" />
            </button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => (phase === "done" ? onConfirm() : null)}
              className="h-[76px] w-[76px] rounded-full flex items-center justify-center"
              style={{
                backgroundColor: phase === "done" ? "#74FF5A" : "#fff",
                border: "4px solid #000",
                boxShadow: "0 0 0 4px rgba(255,255,255,0.2)",
              }}
            >
              {phase === "done" ? <Check size={28} className="text-black" strokeWidth={3} /> : <div className="h-12 w-12 rounded-full bg-black/10 border-2 border-black" />}
            </motion.button>

            <div className="h-12 w-12" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute h-6 w-6 border-[#74FF5A]";
  const map: Record<string, string> = {
    tl: "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl",
    tr: "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl",
    bl: "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl",
    br: "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl",
  };
  return <div className={`${base} ${map[pos]}`} />;
}
