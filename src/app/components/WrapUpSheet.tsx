import { motion, AnimatePresence } from "motion/react";
import { X, Share2, Download, TrendingUp, Flame, Trophy, Utensils } from "lucide-react";
import { Avatar } from "./Avatar";
import { useStore, groupBills } from "../store";

export function WrapUpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const groups = useStore((s) => s.groups);
  // Using g1 (Boys PG) as the primary group for the wrap-up demonstration
  const g = groups[0]; 
  const bills = useStore((s) => s.bills).filter(b => b.date.startsWith("2026-04"));
  
  const totalBurn = bills.reduce((s, b) => s + b.amount, 0);
  const billsCount = bills.length;
  const memberCount = g?.members.length || 1;
  const avgPerHead = Math.round(totalBurn / memberCount);

  // Calculate Biggest Spender
  const spendMap: Record<string, number> = {};
  bills.forEach(b => {
    Object.entries(b.payers).forEach(([uid, amt]) => {
      spendMap[uid] = (spendMap[uid] || 0) + amt;
    });
  });
  
  let biggestSpenderId = "me";
  let maxSpend = 0;
  Object.entries(spendMap).forEach(([uid, amt]) => {
    if (amt > maxSpend) {
      maxSpend = amt;
      biggestSpenderId = uid;
    }
  });
  
  const biggestSpender = g?.members.find(m => m.id === biggestSpenderId) || g?.members[0];

  const stats = [
    { label: "Total burn", value: `₹${totalBurn.toLocaleString("en-IN")}`, tint: "#74FF5A" },
    { label: "Bills split", value: billsCount.toString(), tint: "#FFD84D" },
    { label: "Avg per head", value: `₹${avgPerHead.toLocaleString("en-IN")}`, tint: "#B5A8FF" },
  ];

  const awards = [
    { icon: Flame, title: "Biggest Spender", name: biggestSpender?.name || "Someone", color: biggestSpender?.color || "#74FF5A", note: `₹${maxSpend.toLocaleString("en-IN")} this month` },
    { icon: Trophy, title: "Most Punctual", name: "Aman", color: "#FF5C39", note: "0 late settles" },
    { icon: Utensils, title: "Mess Maharaja", name: "Kabir", color: "#FFD84D", note: "24 meals logged" },
  ];

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
            className="absolute bottom-0 left-0 right-0 z-50 bg-black rounded-t-[36px] overflow-hidden"
            style={{ height: "94%" }}
          >
            <div className="flex flex-col h-full">
              <div className="pt-3 pb-2 flex flex-col items-center">
                <div className="h-1.5 w-12 rounded-full bg-white/30" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3">
                <div>
                  <div className="text-white/60" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.1em" }}>
                    APRIL · 2026
                  </div>
                  <h2
                    className="text-white"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.1 }}
                  >
                    Monthly Wrap-Up
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="h-9 w-9 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-4">
                {/* Hero share card */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 22 }}
                  className="rounded-[28px] border-2 border-black overflow-hidden relative"
                  style={{
                    background: "linear-gradient(135deg, #7B61FF 0%, #FF5C39 100%)",
                    boxShadow: "6px 6px 0 0 rgba(255,255,255,0.2)",
                  }}
                >
                  {/* noise + decor */}
                  <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full" style={{ backgroundColor: "#FFD84D", opacity: 0.4 }} />
                  <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full" style={{ backgroundColor: "#74FF5A", opacity: 0.35 }} />

                  <div className="relative p-5">
                    <div className="flex items-center justify-between">
                      <div
                        className="inline-block px-2.5 h-6 rounded-full bg-black text-white flex items-center"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em" }}
                      >
                        #ROOMIEWRAPPED
                      </div>
                      <div className="flex -space-x-2">
                        {g?.members.slice(0, 4).map((m, i) => (
                          <Avatar key={m.id} name={m.name} color={m.color} size={26} />
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 text-white">
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, opacity: 0.8 }}>
                        You & {memberCount - 1} roomies spent
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28 }}>₹</span>
                        <span
                          style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 700,
                            fontSize: 64,
                            letterSpacing: "-0.05em",
                            lineHeight: 1,
                          }}
                        >
                          {totalBurn.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13 }}>
                        <TrendingUp size={14} /> Trends looking good · nice.
                      </div>
                    </div>

                    {/* Mini bar chart */}
                    <div className="mt-5 flex items-end gap-1.5 h-20">
                      {[40, 65, 35, 80, 55, 70, 45, 90, 60, 75, 50, 85].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.05 * i, type: "spring", stiffness: 200, damping: 22 }}
                          className="flex-1 rounded-t-md border border-black"
                          style={{ backgroundColor: i % 3 === 0 ? "#74FF5A" : i % 3 === 1 ? "#FFD84D" : "#fff" }}
                        />
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-white/70" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                      <span>Apr 1</span>
                      <span>Apr 30</span>
                    </div>
                  </div>
                </motion.div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {stats.map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      className="rounded-[20px] border-2 border-black p-3"
                      style={{ backgroundColor: s.tint, boxShadow: "4px 4px 0 0 rgba(255,255,255,0.15)" }}
                    >
                      <div className="text-black/70" style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.06em" }}>
                        {s.label}
                      </div>
                      <div
                        className="text-black mt-1"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", lineHeight: 1 }}
                      >
                        {s.value}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Awards */}
                <div className="mt-5">
                  <div className="text-white/60 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.14em" }}>
                    PG AWARDS 🏆
                  </div>
                  <div className="space-y-2.5">
                    {awards.map((a, i) => {
                      const Icon = a.icon;
                      return (
                        <motion.div
                          key={a.title}
                          initial={{ x: 12, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.15 + i * 0.08 }}
                          className="rounded-[22px] border-2 border-white/15 bg-white/5 p-3 flex items-center gap-3"
                        >
                          <div
                            className="h-11 w-11 rounded-2xl border-2 border-black flex items-center justify-center shrink-0"
                            style={{ backgroundColor: a.color }}
                          >
                            <Icon size={18} className="text-black" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-white/60"
                              style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}
                            >
                              {a.title}
                            </div>
                            <div
                              className="text-white"
                              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}
                            >
                              {a.name}
                            </div>
                            <div className="text-white/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                              {a.note}
                            </div>
                          </div>
                          <Avatar name={a.name} color={a.color} size={36} />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Share CTA */}
              <div className="p-4 border-t-2 border-white/10 flex items-center gap-2">
                <button
                  className="h-[60px] w-[60px] rounded-full bg-white flex items-center justify-center border-2 border-black shrink-0"
                  style={{ boxShadow: "4px 4px 0 0 rgba(255,255,255,0.2)" }}
                >
                  <Download size={20} className="text-black" />
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 h-[60px] rounded-full border-2 border-black flex items-center justify-center gap-2 text-black"
                  style={{
                    backgroundColor: "#74FF5A",
                    boxShadow: "4px 4px 0 0 rgba(255,255,255,0.2)",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  <Share2 size={16} /> Share to WhatsApp
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
