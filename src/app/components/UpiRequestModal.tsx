import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Copy } from "lucide-react";
import { Avatar } from "./Avatar";
import { generateUpiLink } from "../utils/upi";
import { useStore, toast } from "../store";

type UpiRequestModalProps = {
  open: boolean;
  onClose: () => void;
  receiverName: string;
  receiverColor?: string;
  amount: number;
  note: string;
};

export function UpiRequestModal({ open, onClose, receiverName, receiverColor = "#FFD84D", amount, note }: UpiRequestModalProps) {
  const me = useStore((s) => s.me);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");

  // Update message when props change or modal opens
  useEffect(() => {
    if (open && me.upi) {
      const generatedLink = generateUpiLink({
        upiId: me.upi,
        name: me.name,
        amount,
        note,
      });
      setLink(generatedLink);
      setMessage(`Hey ${receiverName.split(" ")[0]}! Can you settle up ₹${amount} for ${note}? Tap this link to pay via UPI:\n\n${generatedLink}`);
    }
  }, [open, me, receiverName, amount, note]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Settle up on Roomie",
          text: message,
        });
        toast("Request shared!", "#B5A8FF");
        onClose();
      } catch (error) {
        console.error("Error sharing UPI link:", error);
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast("Request copied to clipboard! 📋", "#74FF5A");
      onClose();
    } catch (err) {
      toast("Failed to copy", "#FF5C39");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-5">
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
            className="relative w-full max-w-sm rounded-[32px] border-4 border-black bg-[#FFFBF2] overflow-hidden flex flex-col"
            style={{ boxShadow: "8px 8px 0 0 rgba(0,0,0,1)" }}
          >
            <div className="flex items-center justify-between p-5 pb-0">
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>
                Request Payment
              </h2>
              <button onClick={onClose} className="h-8 w-8 rounded-full border-2 border-black flex items-center justify-center bg-white" style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}>
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col items-center">
              <Avatar name={receiverName} color={receiverColor} size={56} />
              <p className="mt-3 text-black/80 text-center" style={{ fontFamily: "'Inter', sans-serif", fontSize: 15 }}>
                Requesting <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17 }}>₹{amount.toLocaleString("en-IN")}</span> from <span style={{ fontWeight: 600 }}>{receiverName}</span>
              </p>

              <div className="w-full mt-4">
                <label className="block text-black/60 mb-1.5 ml-1" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.05em" }}>
                  MESSAGE
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-2xl border-2 border-black bg-white p-3 text-black focus:outline-none focus:ring-2 focus:ring-[#B5A8FF] resize-none"
                  rows={5}
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, boxShadow: "inset 2px 2px 0 0 rgba(0,0,0,0.05)" }}
                />
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleCopy}
                className="h-14 w-14 shrink-0 rounded-full border-2 border-black bg-white text-black flex items-center justify-center"
                style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
              >
                <Copy size={20} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleShare}
                className="flex-1 h-14 rounded-full border-2 border-black bg-[#B5A8FF] text-black text-center flex items-center justify-center gap-2"
                style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}
              >
                <Send size={18} /> Share Request
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
