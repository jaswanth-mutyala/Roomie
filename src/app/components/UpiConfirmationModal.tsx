import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Smartphone, CheckCircle2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { generateUpiLink, openUpiLink } from "../utils/upi";
import { useStore, toast, actions } from "../store";

type UpiConfirmationModalProps = {
  open: boolean;
  onClose: () => void;
  groupId: string | null;
  receiverId: string | null;
  amount: number;
};

export function UpiConfirmationModal({ open, onClose, groupId, receiverId, amount }: UpiConfirmationModalProps) {
  const groups = useStore((s) => s.groups);
  const [step, setStep] = useState<"confirm" | "verify">("confirm");

  // Reset step when opened
  useEffect(() => {
    if (open) setStep("confirm");
  }, [open]);
  
  // Find the receiver's details across all groups to get their UPI ID
  let receiver: { name: string; upi?: string; color: string } | null = null;
  for (const g of groups) {
    const member = g.members.find(m => m.id === receiverId);
    if (member) {
      receiver = { name: member.name, upi: member.upi, color: member.color };
      if (member.upi) break; // found one with UPI
    }
  }

  const handlePay = () => {
    if (!receiver) {
      toast("Receiver details not found.", "#FF5C39");
      return;
    }
    
    // Check if the user has a UPI ID configured. Since this is local mockup, we fallback to a mock one if empty.
    const upiId = receiver.upi || "receiver@upi"; 

    try {
      const link = generateUpiLink({
        upiId,
        name: receiver.name,
        amount,
        note: `Settle up · Roomie`,
      });
      openUpiLink(link);
      toast(`Opening UPI app for ${receiver.name.split(" ")[0]}...`, "#B5A8FF");
      // Don't close! Switch to verification step
      setStep("verify");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to generate link", "#FF5C39");
    }
  };

  const handleVerifySuccess = () => {
    if (groupId && receiverId) {
      actions.settle(groupId, "me", receiverId, amount);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && receiver && (
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
            className="relative w-full max-w-sm rounded-[32px] border-4 border-black bg-[#FFFBF2] overflow-hidden"
            style={{ boxShadow: "8px 8px 0 0 rgba(0,0,0,1)" }}
          >
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-5 pb-0">
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>
                  {step === "confirm" ? "Confirm Payment" : "Verify Payment"}
                </h2>
                <button onClick={onClose} className="h-8 w-8 rounded-full border-2 border-black flex items-center justify-center bg-white" style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}>
                  <X size={16} />
                </button>
              </div>
              
              {step === "confirm" ? (
                <>
                  <div className="p-6 flex flex-col items-center text-center">
                    <Avatar name={receiver.name} color={receiver.color} size={64} />
                    <p className="mt-4 text-black/80" style={{ fontFamily: "'Inter', sans-serif", fontSize: 16 }}>
                      Pay <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>₹{amount.toLocaleString("en-IN")}</span> to <span style={{ fontWeight: 600 }}>{receiver.name}</span>?
                    </p>
                    {!receiver.upi && (
                      <p className="mt-2 text-[#FF5C39]" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                        (They haven't added a UPI ID. A default will be used for testing.)
                      </p>
                    )}
                  </div>

                  <div className="p-5 pt-0 flex flex-col gap-3">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handlePay}
                      className="w-full h-14 rounded-full border-2 border-black bg-[#B5A8FF] text-black text-center flex items-center justify-center gap-2"
                      style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}
                    >
                      <Smartphone size={18} /> Open UPI App
                    </motion.button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-6 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-[#74FF5A]/20 flex items-center justify-center mb-4 text-[#74FF5A]">
                      <CheckCircle2 size={32} strokeWidth={2.5} />
                    </div>
                    <p className="text-black/80" style={{ fontFamily: "'Inter', sans-serif", fontSize: 16 }}>
                      Did you complete the <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>₹{amount.toLocaleString("en-IN")}</span> transfer via your UPI app?
                    </p>
                  </div>

                  <div className="p-5 pt-0 flex flex-col gap-3">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleVerifySuccess}
                      className="w-full h-14 rounded-full border-2 border-black bg-[#74FF5A] text-black text-center flex items-center justify-center gap-2"
                      style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}
                    >
                      Yes, mark as paid ✓
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={onClose}
                      className="w-full h-14 rounded-full border-2 border-black bg-white text-black text-center flex items-center justify-center"
                      style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}
                    >
                      No, cancel
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
