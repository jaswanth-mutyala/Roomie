import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2 } from "lucide-react";
// @ts-ignore
import confetti from "canvas-confetti";
import { Avatar } from "./Avatar";
import { actions } from "../store";

type SettleAllModalProps = {
  open: boolean;
  onClose: () => void;
  youOwe: { groupId: string; groupName: string; to: string; toName: string; toColor: string; amount: number }[];
  oweTotal: number;
};

export function SettleAllModal({ open, onClose, youOwe, oweTotal }: SettleAllModalProps) {
  const [settled, setSettled] = useState(false);

  const handleConfirm = () => {
    // Settle all
    youOwe.forEach((e) => actions.settle(e.groupId, "me", e.to, e.amount));
    setSettled(true);

    // Fire dopamine confetti
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#74FF5A", "#FFD84D", "#B5A8FF", "#FF5C39"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#74FF5A", "#FFD84D", "#B5A8FF", "#FF5C39"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    setTimeout(() => {
      setSettled(false);
      onClose();
    }, 2500);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm rounded-[32px] border-4 border-black bg-[#FFFBF2] overflow-hidden"
            style={{ boxShadow: "8px 8px 0 0 rgba(0,0,0,1)" }}
          >
            {settled ? (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="mb-4 text-[#74FF5A]"
                >
                  <CheckCircle2 size={80} strokeWidth={2.5} />
                </motion.div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 32, lineHeight: 1 }}>
                  All Settled!
                </h2>
                <p className="mt-2 text-black/60" style={{ fontFamily: "'Inter', sans-serif", fontSize: 15 }}>
                  You paid ₹{oweTotal.toLocaleString("en-IN")} to {youOwe.length} {youOwe.length === 1 ? "person" : "people"}.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between p-5 pb-2">
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em" }}>
                    Settle All
                  </h2>
                  <button onClick={onClose} className="h-8 w-8 rounded-full border-2 border-black flex items-center justify-center bg-white" style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}>
                    <X size={16} />
                  </button>
                </div>
                
                <div className="px-5 pb-5">
                  <p className="text-black/70 mb-4" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
                    Did you actually transfer the money via UPI to everyone?
                  </p>
                  
                  <div className="bg-black/[0.03] rounded-2xl p-4 border-2 border-black/10 max-h-[160px] overflow-y-auto mb-5 space-y-2">
                    {youOwe.map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={p.toName} color={p.toColor} size={28} />
                          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14 }}>{p.toName}</span>
                        </div>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15 }}>₹{p.amount}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleConfirm}
                      className="w-full h-14 rounded-full border-2 border-black bg-[#74FF5A] text-black text-center flex items-center justify-center gap-2"
                      style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}
                    >
                      Yes, mark ₹{oweTotal.toLocaleString("en-IN")} settled ✓
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={onClose}
                      className="w-full h-14 rounded-full border-2 border-black bg-white text-black text-center flex items-center justify-center"
                      style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}
                    >
                      Wait, not yet
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
