import { AnimatePresence, motion } from "motion/react";
import { X, Send, Inbox, Shield } from "lucide-react";
import { Avatar } from "./Avatar";

export type ConfirmKind = "pay" | "receive";

export type ConfirmPayload = {
  kind: ConfirmKind;
  amount: number;
  groupName: string;
  memberName: string;
  memberColor: string;
  upi?: string;
  onConfirm: () => void;
};

export function ConfirmDialog({
  payload,
  onClose,
}: {
  payload: ConfirmPayload | null;
  onClose: () => void;
}) {
  const open = !!payload;
  const isPay = payload?.kind === "pay";
  const accent = isPay ? "#FFD84D" : "#74FF5A";
  const Icon = isPay ? Send : Inbox;

  return (
    <AnimatePresence>
      {open && payload && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px] z-[70]"
          />
          <div className="absolute inset-0 z-[71] flex items-center justify-center px-6 pointer-events-none">
            <motion.div
              initial={{ y: 30, scale: 0.92, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="pointer-events-auto w-full rounded-[28px] border-2 border-black bg-[#FFFBF2] overflow-hidden relative"
              style={{ boxShadow: "6px 6px 0 0 rgba(0,0,0,1)", maxWidth: 380 }}
            >
              {/* Hero ribbon */}
              <div className="relative px-5 pt-5 pb-4 border-b-2 border-black" style={{ backgroundColor: accent }}>
                <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-black/10" />
                <div className="absolute top-3 right-3">
                  <button
                    onClick={onClose}
                    className="h-8 w-8 rounded-full bg-black flex items-center justify-center border-2 border-black"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
                <div className="relative flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.05 }}
                    className="h-12 w-12 rounded-2xl bg-black border-2 border-black flex items-center justify-center"
                  >
                    <Icon size={22} className="text-white" />
                  </motion.div>
                  <div>
                    <div className="text-black/60" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.16em" }}>
                      {isPay ? "PAYMENT REQUEST" : "MARK SETTLED"}
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                      {isPay ? "Pay via UPI?" : "Got the money?"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-5">
                <div className="rounded-[20px] border-2 border-black bg-white p-4 flex items-center gap-3">
                  <Avatar name={payload.memberName} color={payload.memberColor} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>
                      {isPay ? `to ${payload.memberName}` : `from ${payload.memberName}`}
                    </div>
                    <div className="text-black/55 truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, marginTop: 2 }}>
                      {payload.groupName}
                      {payload.upi && isPay ? ` · ${payload.upi}` : ""}
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 380, damping: 22 }}
                  className="mt-4 flex items-baseline justify-center gap-1"
                >
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26 }}>₹</span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 56,
                      letterSpacing: "-0.05em",
                      lineHeight: 1,
                    }}
                  >
                    {payload.amount.toLocaleString("en-IN")}
                  </span>
                </motion.div>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-black/55" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                  <Shield size={12} />
                  {isPay
                    ? "We'll open your UPI app — confirm there."
                    : "This won't ping them. Use Nudge for that."}
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 h-12 rounded-full border-2 border-black bg-white"
                    style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}
                  >
                    Not now
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      payload.onConfirm();
                      onClose();
                    }}
                    className="flex-1 h-12 rounded-full border-2 border-black flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: accent,
                      boxShadow: "3px 3px 0 0 rgba(0,0,0,1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    <Icon size={14} />
                    {isPay ? "Pay now" : "Yes, mark paid"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
