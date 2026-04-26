import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Plus, Pause, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { useStore, actions } from "../store";
import { GroupIcon } from "./GroupIcon";
import { Avatar } from "./Avatar";

export function RecurringSheet({ open, onClose, onOpenSplit }: { open: boolean; onClose: () => void; onOpenSplit: () => void }) {
  const bills = useStore((s) => s.recurring);
  const groups = useStore((s) => s.groups);
  const [filter, setFilter] = useState<string>("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);

  const filtered = filter === "all" ? bills : bills.filter((b) => b.groupId === filter);
  const total = filtered.filter((b) => !b.paused).reduce((s, b) => s + b.amount, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 z-40" />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="absolute bottom-0 left-0 right-0 z-50 bg-[#FFFBF2] rounded-t-[36px] border-t-2 border-black overflow-hidden"
            style={{ height: "92%" }}
          >
            <div className="flex flex-col h-full">
              <div className="pt-3 pb-2 flex flex-col items-center">
                <div className="h-1.5 w-12 rounded-full bg-black/30" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3">
                <div>
                  <div className="text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.1em" }}>AUTOPILOT</div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                    Recurring Bills
                  </h2>
                </div>
                <button onClick={onClose} className="h-9 w-9 rounded-full bg-white border-2 border-black flex items-center justify-center" style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}>
                  <X size={16} />
                </button>
              </div>

              <div className="px-5">
                <div className="rounded-[24px] border-2 border-black p-4 flex items-center justify-between" style={{ backgroundColor: "#000", boxShadow: "5px 5px 0 0 rgba(0,0,0,1)" }}>
                  <div>
                    <div className="text-white/60" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.14em" }}>
                      MONTHLY COMMITTED
                    </div>
                    <div className="flex items-baseline gap-1 text-white mt-0.5">
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>₹</span>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 36, letterSpacing: "-0.03em", lineHeight: 1 }}>
                        {total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <div className="h-14 w-14 rounded-full border-2 border-black flex items-center justify-center" style={{ backgroundColor: "#74FF5A" }}>
                    <Sparkles size={22} className="text-black" />
                  </div>
                </div>
              </div>

              {/* Group filter chips */}
              <div className="px-5 mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <Chip active={filter === "all"} onClick={() => setFilter("all")} label="All" />
                {groups.map((g) => (
                  <Chip
                    key={g.id}
                    active={filter === g.id}
                    onClick={() => setFilter(g.id)}
                    label={g.name}
                    prefix={<GroupIcon icon={g.emoji} size={12} />}
                    color={g.bg}
                  />
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5 space-y-2.5">
                {filtered.map((b, i) => {
                  const g = groups.find((x) => x.id === b.groupId);
                  const payer = g?.members.find((m) => m.id === b.payerId);
                  const isConfirming = confirmDelete === b.id;
                  const isExpanded = expandedBill === b.id;
                  
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.04 * i }}
                      onClick={() => setExpandedBill(isExpanded ? null : b.id)}
                      className="rounded-[22px] border-2 border-black bg-white p-3.5 flex flex-col gap-3 cursor-pointer"
                      style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", opacity: b.paused ? 0.65 : 1 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl border-2 border-black flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: g?.bg || "#FFD84D" }}>
                          {g ? <GroupIcon icon={g.emoji} size={20} /> : <GroupIcon icon="Zap" size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, lineHeight: 1.1 }}>
                            {b.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: b.paused ? "#999" : "#74FF5A" }} />
                            <span className="text-black/55 truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                              {b.paused ? "paused" : `${b.frequency} · day ${b.day} · ${payer?.name || "You"}`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em", lineHeight: 1 }}>
                            ₹{b.amount.toLocaleString("en-IN")}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/* Pause/Play */}
                            <button
                              onClick={(e) => { e.stopPropagation(); actions.toggleRecurring(b.id); }}
                              className="h-7 w-7 rounded-full border-2 border-black flex items-center justify-center bg-white"
                              style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
                            >
                              {b.paused ? <Play size={11} /> : <Pause size={11} />}
                            </button>
                            {/* Delete — tap once to confirm, tap again to delete */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isConfirming) {
                                  actions.deleteRecurring(b.id);
                                  setConfirmDelete(null);
                                } else {
                                  setConfirmDelete(b.id);
                                  setTimeout(() => setConfirmDelete(null), 2500);
                                }
                              }}
                              className="h-7 w-7 rounded-full border-2 border-black flex items-center justify-center transition-colors"
                              style={{
                                backgroundColor: isConfirming ? "#FF5C39" : "#fff",
                                boxShadow: "2px 2px 0 0 rgba(0,0,0,1)",
                              }}
                            >
                              <Trash2 size={11} className={isConfirming ? "text-white" : "text-black/60"} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Split Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 pb-1">
                              <div className="rounded-[16px] border-2 border-black overflow-hidden bg-white/50 divide-y divide-black/10">
                                {/* Paid By Row */}
                                <div className="flex items-center justify-between px-3 py-2.5 bg-black/5">
                                  <span className="text-black/60" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em" }}>
                                    PAID BY
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-black" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13 }}>
                                      {payer?.name || "You"}
                                    </span>
                                    <Avatar name={payer?.name || "You"} color={payer?.color || "#999"} size={24} ring={false} />
                                  </div>
                                </div>
                                
                                {/* Split Among Header */}
                                <div className="px-3 py-2 bg-white">
                                  <span className="text-black/60 block mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em" }}>
                                    SPLIT AMONG
                                  </span>
                                  <div className="space-y-2.5 pb-1">
                                    {b.splitAmong ? b.splitAmong.map((userId) => {
                                      const m = g?.members.find(x => x.id === userId);
                                      if (!m) return null;
                                      return (
                                        <div key={userId} className="flex items-center gap-2.5">
                                          <Avatar name={m.name} color={m.color} size={26} ring={false} />
                                          <span className="text-black flex-1" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13 }}>
                                            {m.name}
                                          </span>
                                          <span className="tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>
                                            ₹{Math.round(b.amount / b.splitAmong!.length)}
                                          </span>
                                        </div>
                                      );
                                    }) : g?.members.map((m) => (
                                      <div key={m.id} className="flex items-center gap-2.5">
                                        <Avatar name={m.name} color={m.color} size={26} ring={false} />
                                        <span className="text-black flex-1" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13 }}>
                                          {m.name}
                                        </span>
                                        <span className="tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>
                                          ₹{Math.round(b.amount / g.members.length)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="rounded-[20px] border-2 border-dashed border-black/30 p-6 text-center text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                    No recurring bills yet. Use New Split → toggle "Make it recurring" to add one.
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onClose(); setTimeout(onOpenSplit, 250); }}
                  className="w-full rounded-[22px] border-2 border-black bg-[#B5A8FF] p-4 flex items-center gap-3 justify-center"
                  style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
                >
                  <Plus size={18} />
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>
                    Add recurring bill
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Chip({ active, onClick, label, prefix, color }: { active: boolean; onClick: () => void; label: string; prefix?: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 h-8 px-3 rounded-full border-2 border-black flex items-center gap-1.5 transition-colors"
      style={{
        backgroundColor: active ? (color || "#000") : "#fff",
        color: active ? (color ? "#000" : "#fff") : "#000",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: 12,
        boxShadow: active ? "2px 2px 0 0 rgba(0,0,0,1)" : "none",
      }}
    >
      {prefix}
      {label}
    </button>
  );
}


