import { motion, AnimatePresence } from "motion/react";
import { X, Send, Shuffle } from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar } from "./Avatar";
import { useStore, simplifyDebts } from "../store";

const ROASTS = [
  "Bhai chai nahi, settlement due hai ☕",
  "Wifi bill won't pay itself bestie 💅",
  "Your UPI is shy again 🫣",
  "Rent day ≠ ghosting day 👻",
  "Maid came. You didn't pay. Awkward. 🧹",
  "Plot twist: you still owe ₹{amt} 🌀",
];

export function NudgeSheet({
  open,
  onClose,
  ctx,
}: {
  open: boolean;
  onClose: () => void;
  ctx?: { memberId: string; amount: number } | null;
}) {
  const groups = useStore((s) => s.groups);
  // Subscribe to settlements so we re-render when debts change
  useStore((s) => s.settlements.length);
  const [selectedGroup, setSelectedGroup] = useState<string>("All");

  let friends: { id: string; name: string; color: string; owes: number }[] = [];

  if (ctx) {
    const person = groups.flatMap(g => g.members).find(m => m.id === ctx.memberId);
    if (person) {
      friends = [{ id: person.id, name: person.name, color: person.color, owes: ctx.amount }];
    }
  } else {
    const totals: Record<string, number> = {};
    for (const g of groups) {
      if (selectedGroup !== "All" && g.id !== selectedGroup) continue;
      const debts = simplifyDebts(g.id);
      const owingMe = debts.filter(d => d.to === "me" && d.amount > 0);
      for (const d of owingMe) {
        totals[d.from] = (totals[d.from] || 0) + d.amount;
      }
    }
    for (const [memberId, amount] of Object.entries(totals)) {
      const person = groups.flatMap(g => g.members).find(m => m.id === memberId);
      if (person && !friends.find(f => f.id === person.id)) {
        friends.push({ id: person.id, name: person.name, color: person.color, owes: Math.round(amount) });
      }
    }
    if (friends.length === 0) {
      friends = [{ id: "none", name: "No one", color: "#ccc", owes: 0 }];
    }
  }

  const [target, setTarget] = useState(friends[0]?.id || "none");
  const [msgIdx, setMsgIdx] = useState(0);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      if (!friends.find(f => f.id === target)) {
        setTarget(friends[0]?.id || "none");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ctx, selectedGroup]);

  const person = friends.find((f) => f.id === target) || friends[0];
  const msg = person.id === "none" ? "No one owes you right now! 🎉" : ROASTS[msgIdx].replace("{amt}", String(person.owes));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="absolute bottom-0 left-0 right-0 z-50 bg-[#FF5C39] rounded-t-[36px] border-t-2 border-black overflow-hidden"
            style={{ height: "78%" }}
          >
            <div className="flex flex-col h-full">
              <div className="pt-3 pb-2 flex flex-col items-center">
                <div className="h-1.5 w-12 rounded-full bg-black/30" />
              </div>
              <div className="flex items-center justify-between px-5 pb-1">
                <div>
                  <div className="text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.1em" }}>
                    SEND A
                  </div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: "-0.03em", lineHeight: 1 }}>
                    Nudge 🫣
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="h-9 w-9 rounded-full bg-black border-2 border-black flex items-center justify-center"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>

              {/* Pick person */}
              <div className="px-5 mt-4">
                {!ctx && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar" style={{ scrollbarWidth: "none" }}>
                    <button
                      onClick={() => setSelectedGroup("All")}
                      className="shrink-0 px-3 h-8 rounded-full border-2 border-black"
                      style={{
                        backgroundColor: selectedGroup === "All" ? "#000" : "#fff",
                        color: selectedGroup === "All" ? "#fff" : "#000",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      All Groups
                    </button>
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGroup(g.id)}
                        className="shrink-0 px-3 h-8 rounded-full border-2 border-black"
                        style={{
                          backgroundColor: selectedGroup === g.id ? "#000" : g.bg,
                          color: selectedGroup === g.id ? "#fff" : (g.bg === "#1A1A1A" ? "#fff" : "#000"),
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="text-black/60 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em" }}>
                  WHO OWES YOU?
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar" style={{ scrollbarWidth: "none" }}>
                  {friends.map((f) => {
                    const active = target === f.id;
                    return (
                      <button key={f.id} disabled={f.id === "none"} onClick={() => setTarget(f.id)} className="shrink-0 flex flex-col items-center gap-1.5">
                        <div style={{ opacity: active ? 1 : 0.5, transform: active ? "scale(1.05)" : "scale(1)", transition: "all 0.2s" }}>
                          <Avatar name={f.name} color={f.color} size={54} />
                        </div>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11 }}>
                          {f.name}
                        </span>
                        <span className="text-black/60" style={{ fontFamily: "'Inter', sans-serif", fontSize: 10 }}>
                          {f.id === "none" ? "All clear" : `₹${f.owes}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message bubble */}
              <div className="flex-1 px-5 mt-5 flex flex-col items-center justify-center">
                <motion.div
                  key={msgIdx + target}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative max-w-[280px]"
                >
                  <div
                    className="bg-white rounded-[28px] rounded-br-[8px] border-2 border-black p-4"
                    style={{ boxShadow: "5px 5px 0 0 rgba(0,0,0,1)" }}
                  >
                    <div className="text-black" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                      {msg}
                    </div>
                    <div className="text-black/40 mt-2 text-right" style={{ fontFamily: "'Inter', sans-serif", fontSize: 10 }}>
                      via Roomie · WhatsApp
                    </div>
                  </div>
                </motion.div>

                <button
                  onClick={() => setMsgIdx((i) => (i + 1) % ROASTS.length)}
                  className="mt-5 px-4 h-10 rounded-full bg-black text-white flex items-center gap-1.5"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, boxShadow: "3px 3px 0 0 rgba(0,0,0,0.5)" }}
                >
                  <Shuffle size={13} /> New roast
                </button>
              </div>

              {/* Send CTA */}
              <div className="p-4 border-t-2 border-black/10">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSent(true);
                    setTimeout(() => {
                      setSent(false);
                      onClose();
                    }, 900);
                  }}
                  className="w-full h-[64px] rounded-full border-2 border-black flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: sent ? "#74FF5A" : "#000",
                    color: sent ? "#000" : "#fff",
                    boxShadow: "5px 5px 0 0 rgba(0,0,0,1)",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {sent ? "Sent! 🎉" : (<><Send size={17} /> Nudge {person.id === "none" ? "" : person.name}</>)}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
