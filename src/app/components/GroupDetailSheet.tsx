import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, X, Receipt, ArrowRight, Sparkles, Plus, Share2, Check, Flag } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Avatar } from "./Avatar";
import { useStore, groupBills, groupBurn, simplifyDebts, netFor, actions, getBillEdges, toast, type Group, type Member } from "../store";
import { GroupIcon } from "./GroupIcon";

export function GroupDetailSheet({
  id,
  onClose,
  onSplit,
  onOpenSettle,
  onEditBill,
}: {
  id: string | null;
  onClose: () => void;
  onSplit: () => void;
  onOpenSettle?: (groupId: string, memberId: string) => void;
  onEditBill?: (groupId: string, billId: string) => void;
}) {
  const groups = useStore((s) => s.groups);
  useStore((s) => s.bills);
  useStore((s) => s.settlements);
  const open = !!id;
  const g = id ? groups.find((group) => group.id === id) : undefined;

  if (!g && open) return null;

  return (
    <AnimatePresence>
      {open && g && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 z-40" />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="absolute inset-0 z-50 bg-[#FFFBF2] overflow-hidden"
          >
            <Inner g={g} onClose={onClose} onSplit={onSplit} onOpenSettle={onOpenSettle} onEditBill={onEditBill} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Inner({
  g,
  onClose,
  onSplit,
  onOpenSettle,
  onEditBill,
}: {
  g: Group;
  onClose: () => void;
  onSplit: () => void;
  onOpenSettle?: (groupId: string, memberId: string) => void;
  onEditBill?: (groupId: string, billId: string) => void;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [addMemberName, setAddMemberName] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const [confirmAction, setConfirmAction] = useState<"exit" | "delete" | null>(null);
  const [splitToDelete, setSplitToDelete] = useState<string | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [friendSearchResults, setFriendSearchResults] = useState<Member[]>([]);
  const [isFriendSearching, setIsFriendSearching] = useState(false);

  useEffect(() => {
    if (!addMemberName.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await actions.searchUsers(addMemberName.trim());
      // filter out folks already in group
      setSearchResults(results.filter(r => !g.members.some(m => m.id === r.id)));
      setIsSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [addMemberName, g.members]);

  useEffect(() => {
    if (!friendSearch.trim()) {
      setFriendSearchResults([]);
      setIsFriendSearching(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsFriendSearching(true);
      const results = await actions.searchUsers(friendSearch.trim());
      // filter out folks already in group
      setFriendSearchResults(results.filter(r => !g.members.some(m => m.id === r.id)));
      setIsFriendSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [friendSearch, g.members]);

  const submitAddMember = (user: Member) => {
    actions.addExistingMember(g.id, user);
    setAddMemberName("");
    setSearchResults([]);
    setShowAddInput(false);
  };

  // Subscribe to settlements so we re-render when debts change
  useStore((s) => s.settlements.length);

  const bills = groupBills(g.id).slice().sort((a, b) => {
    // Flagged bills at the very top
    if (!!a.flag !== !!b.flag) return a.flag ? -1 : 1;
    // Within sections, sort by latest timestamp (updatedAt or date)
    const timeA = a.updatedAt || a.date;
    const timeB = b.updatedAt || b.date;
    return timeB.localeCompare(timeA);
  });
  const burn = groupBurn(g.id);
  const edges = simplifyDebts(g.id);
  const myNet = netFor(g.id, "me");
  const groupCode = `${g.id.replace("g", "RM-").toUpperCase()}42`;
  const inviteLink = typeof window === "undefined"
    ? `roomie://join/${g.id}`
    : `${window.location.origin}?join=${encodeURIComponent(g.id)}`;

  const copyInviteCode = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(groupCode);
      toast("Group code copied", "#74FF5A");
    } catch {
      toast(`Group code: ${groupCode}`, "#FFD84D");
    }
  };

  const shareInvite = async () => {
    const text = `Join ${g.name} on Roomie with code ${groupCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Join ${g.name} on Roomie`, text, url: inviteLink });
        toast("Invite shared", "#74FF5A");
      } else {
        if (!navigator.clipboard) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(`${text} ${inviteLink}`);
        toast("Invite link copied", "#74FF5A");
      }
    } catch {
      toast("Invite ready to share", "#FFD84D");
    }
  };

  return (
    <div className="flex flex-col h-full pt-4">
      <div className="flex items-center justify-between px-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-2xl border-2 border-black flex items-center justify-center text-white" style={{ backgroundColor: g.bg }}>
            <GroupIcon icon={g.emoji} size={20} />
          </div>
          <div>
            <div className="text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.1em" }}>GROUP</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {g.name}
            </h2>
          </div>
        </div>
        <button onClick={onClose} className="h-9 w-9 rounded-full bg-white border-2 border-black flex items-center justify-center" style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}>
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {/* Hero */}
        <div className="rounded-[24px] border-2 border-black p-4 relative overflow-hidden" style={{ backgroundColor: g.bg, boxShadow: "5px 5px 0 0 rgba(0,0,0,1)" }}>
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full" style={{ backgroundColor: g.accent, opacity: 0.9 }} />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-white/60" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em" }}>
                TOTAL BURN
              </div>
              <div className="flex items-baseline gap-1 text-white">
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>₹</span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 34, letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {burn.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="mt-1 text-white/70" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                {bills.length} bills · {g.members.length} members
              </div>
            </div>
            <div className="flex -space-x-2 items-center">
              {g.members.slice(0, 5).map((m) => (
                <Avatar key={m.id} name={m.name} color={m.color} size={30} />
              ))}
              <button
                onClick={() => {
                  setShowAddInput((v) => !v);
                  setTimeout(() => addInputRef.current?.focus(), 50);
                }}
                className="h-[30px] w-[30px] rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center backdrop-blur-sm z-10"
              >
                <Plus size={14} className="text-white" />
              </button>
            </div>
          </div>

          {/* Inline add member input */}
          <AnimatePresence>
            {showAddInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 overflow-hidden"
              >
                <div className="mt-2 flex items-center gap-2 bg-white/20 rounded-2xl border-2 border-white/40 px-3 py-2">
                  <input
                    ref={addInputRef}
                    value={addMemberName}
                    onChange={(e) => setAddMemberName(e.target.value)}
                    placeholder="Search friend's @username or name..."
                    className="flex-1 bg-transparent outline-none text-white placeholder:text-white/50"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14 }}
                  />
                  {isSearching && <span className="text-white/50 text-xs">...</span>}
                </div>
                {addMemberName.trim().length > 0 && (
                  <div className="mt-2 bg-white/20 rounded-2xl border-2 border-white/40 p-2 overflow-hidden flex flex-col gap-1 backdrop-blur-sm">
                    {searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => submitAddMember(user)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 text-left w-full"
                        >
                          <Avatar name={user.name} color={user.color} size={28} />
                          <div>
                            <div className="text-white font-bold text-sm tracking-tight">{user.name}</div>
                            <div className="text-white/60 text-xs">@{user.id}</div>
                          </div>
                        </button>
                      ))
                    ) : (
                      !isSearching && (
                        <div className="p-3 text-center text-white text-sm">
                          <p className="mb-2 opacity-80 mt-1">No user found.</p>
                          <button
                            onClick={shareInvite}
                            className="bg-white text-black px-4 py-2 rounded-full font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            Invite {addMemberName} to Roomie
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative mt-3 flex items-center justify-between">
            <div
              className="px-3 h-9 rounded-full border-2 border-black flex items-center gap-1.5"
              style={{
                backgroundColor: myNet >= 0 ? "#74FF5A" : "#FFD84D",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              You net {myNet >= 0 ? "+" : "−"}₹{Math.abs(Math.round(myNet)).toLocaleString("en-IN")}
            </div>
            <button
              onClick={onSplit}
              className="h-9 px-3 rounded-full border-2 border-black bg-white flex items-center gap-1.5"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12 }}
            >
              <Plus size={12} /> New split
            </button>
          </div>
        </div>

        {/* Simplify Debts */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Sparkles size={13} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em" }}>
              SIMPLIFIED DEBTS
            </span>
          </div>
          {edges.length === 0 ? (
            <div className="rounded-[20px] border-2 border-black bg-white p-4 text-center text-black/55" style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)", fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
              All settled ✓ Nobody owes anybody.
            </div>
          ) : (
            <div className="space-y-2">
              {edges.map((e, i) => {
                const involvesMe = e.from === "me" || e.to === "me";
                return (
                  <div
                    key={i}
                    onClick={() => {
                      const memberId = e.from === "me" ? e.to : e.to === "me" ? e.from : e.from;
                      onOpenSettle?.(g.id, memberId);
                    }}
                    className="rounded-[18px] border-2 border-black bg-white p-3 flex items-center gap-2 cursor-pointer"
                    style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
                  >
                    <Avatar name={e.fromName} color={e.fromColor} size={34} ring={false} />
                    <div className="flex items-center gap-1 text-black/60">
                      <ArrowRight size={14} />
                    </div>
                    <Avatar name={e.toName} color={e.toColor} size={34} ring={false} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, lineHeight: 1.1 }}>
                        {e.fromName} → {e.toName}
                      </div>
                      <div className="text-black/55" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                        ₹{e.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                    {involvesMe ? (
                      <button
                        className="h-9 px-3 rounded-full border-2 border-black flex items-center"
                        style={{
                          backgroundColor: e.from === "me" ? "#FFD84D" : "#74FF5A",
                          boxShadow: "2px 2px 0 0 rgba(0,0,0,1)",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      >
                        {e.from === "me" ? "Mark paid →" : "Mark received →"}
                      </button>
                    ) : (
                      <div
                        className="h-9 px-3 rounded-full border-2 border-black/20 flex items-center bg-black/5"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 10, color: "rgba(0,0,0,0.45)" }}
                      >
                        View details →
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Receipt size={13} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em" }}>
              SPLITS
            </span>
          </div>
          <div className="space-y-2">
            {bills.map((b) => {
              const payerIds = Object.keys(b.payers);
              const payerNames = payerIds
                .map((id) => g.members.find((m) => m.id === id)?.name || id)
                .join(", ");
              const myShare = b.splitAmong.includes("me") ? b.amount / (b.splitAmong.length || 1) : 0;
              const myPaid = b.payers["me"] || 0;
              const myNet = myPaid - myShare;
              const dt = new Date(b.date);
              const dateLabel = isNaN(dt.getTime()) ? b.date : dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const timeLabel = isNaN(dt.getTime()) ? "" : dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
              const isExpanded = expandedBillId === b.id;
              const billEdges = isExpanded ? getBillEdges(b, g) : [];
              const isFlagged = !!b.flag;

              return (
                <div key={b.id} className="flex flex-col gap-2">
                  <div
                    onClick={() => setExpandedBillId(isExpanded ? null : b.id)}
                    className="rounded-[18px] border-2 border-black bg-white p-3 flex items-center gap-3 cursor-pointer transition-transform active:scale-[0.98]"
                    style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
                  >
                    <div className="h-10 w-10 rounded-xl border-2 border-black flex items-center justify-center shrink-0" style={{ backgroundColor: g.accent, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11 }}>
                      {b.category.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate flex items-center gap-1.5 flex-wrap" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, lineHeight: 1.1 }}>
                        {b.title}
                        {isFlagged && <span className="text-[9px] bg-[#FFD84D]/30 px-1.5 py-0.5 rounded-full text-[#b45309] font-bold border border-[#FFD84D]">🚩 Flagged</span>}
                        {b.isEdited && <span className="text-[9px] bg-black/5 px-1.5 py-0.5 rounded-full text-black/40 font-bold border border-black/10">📝 Edited</span>}
                      </div>
                      <div className="text-black/55 truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                        Paid by {payerNames} · {dateLabel}{timeLabel ? ` · ${timeLabel}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em" }}>
                        ₹{b.amount.toLocaleString("en-IN")}
                      </div>
                      <div
                        className="tabular-nums mt-0.5"
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: 11,
                          color: myNet > 0.5 ? "#16a34a" : myNet < -0.5 ? "#FF5C39" : "#888",
                        }}
                      >
                        {myNet > 0.5 ? `+₹${myNet.toFixed(0)}` : myNet < -0.5 ? `−₹${Math.abs(myNet).toFixed(0)}` : "·"}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-black/[0.03] rounded-[16px] p-3 space-y-2 border border-black/10 mx-2">
                          <div className="text-black/50" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: "0.1em", fontWeight: 700 }}>
                            THIS BILL'S DEBT FLOW
                          </div>
                          {billEdges.length === 0 ? (
                            <div className="text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                              Perfectly balanced! No debts.
                            </div>
                          ) : (
                            <>
                              {billEdges.map((e, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded-full border border-black flex items-center justify-center text-black font-bold shrink-0" style={{ backgroundColor: e.fromColor, fontSize: 8 }}>
                                      {e.fromName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <ArrowRight size={10} className="text-black/30 shrink-0" />
                                    <div className="h-5 w-5 rounded-full border border-black flex items-center justify-center text-black font-bold shrink-0" style={{ backgroundColor: e.toColor, fontSize: 8 }}>
                                      {e.toName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-black/70 ml-1 truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                                      {e.fromName} owes {e.toName}
                                    </span>
                                  </div>
                                  <span className="font-semibold text-black" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12 }}>
                                    ₹{e.amount}
                                  </span>
                                </div>
                              ))}
                              <div className="text-black/40 pt-1 border-t border-black/5 leading-tight" style={{ fontSize: 9.5 }}>
                                * These are raw debts for this specific bill. Real-world payments are combined and simplified across all bills, so these exact transfers may cancel out.
                              </div>
                            </>
                          )}
                          
                          {/* Flag Resolution */}
                          {isFlagged && (
                            <div className="mt-3 p-3 rounded-[12px] border border-[#FFD84D] bg-[#FFD84D]/10">
                              <div className="flex items-start gap-2">
                                <Flag size={14} className="text-[#b45309] mt-0.5 shrink-0" />
                                <div>
                                  <div className="text-[#b45309]" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11 }}>
                                    FLAGGED BY {b.flag!.by === "me" ? "YOU" : b.flag!.by.toUpperCase()}
                                  </div>
                                  <div className="text-black/70 mt-0.5" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                                    "{b.flag!.reason}"
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    actions.unflagBill(b.id);
                                  }}
                                  className="flex-1 h-8 rounded-full border border-[#b45309] bg-[#FFD84D] text-[#b45309]"
                                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11 }}
                                >
                                  Mark Resolved
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {myPaid > 0 && (
                            <div className="mt-3 pt-3 border-t border-black/10 flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onEditBill) onEditBill(g.id, b.id);
                                }}
                                className="flex-1 h-8 rounded-full border border-black/20 bg-white text-black/70"
                                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 11 }}
                              >
                                Edit Split
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSplitToDelete(b.id);
                                }}
                                className="flex-1 h-8 rounded-full border border-[#FF5C39]/20 bg-white text-[#FF5C39]/70 hover:bg-[#FF5C39]/5 transition-colors"
                                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 11 }}
                              >
                                Delete Split
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            {bills.length === 0 && (
              <div className="rounded-[18px] border-2 border-dashed border-black/30 p-6 text-center text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                No bills yet. Tap "New split" to get started.
              </div>
            )}
          </div>
        </div>

        {/* Group Settings */}
        <div className="mt-8 pt-6 border-t-2 border-black/10 pb-8 space-y-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em", color: "#888" }}>
              GROUP SETTINGS
            </span>
          </div>

          {!showInvite ? (
            <button
              onClick={() => setShowInvite(true)}
              className="w-full h-[52px] rounded-[18px] border-2 border-black bg-white flex items-center justify-between px-4 text-black transition-transform active:scale-[0.98]"
              style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-black/5 flex items-center justify-center">
                  <Plus size={16} />
                </div>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>Invite a friend</span>
              </div>
              <ArrowRight size={16} className="text-black/40" />
            </button>
          ) : (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="rounded-[18px] border-2 border-black bg-white p-4 space-y-4 overflow-hidden"
              style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full border-2 border-black flex items-center justify-center" style={{ backgroundColor: "#74FF5A" }}>
                    <Sparkles size={14} className="text-black" />
                  </div>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15 }}>Invite to {g.name}</span>
                </div>
                <button onClick={() => setShowInvite(false)} className="h-7 w-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div>
                <div className="text-black/50 mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.1em" }}>GROUP CODE</div>
                <div className="h-12 bg-[#FFFBF2] rounded-xl flex items-center justify-between border-2 border-black/10 px-3">
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.15em" }}>
                    {groupCode}
                  </span>
                  <button onClick={copyInviteCode} className="text-[11px] font-bold px-3 py-1.5 bg-white border-2 border-black rounded-full" style={{ boxShadow: "1px 1px 0 0 rgba(0,0,0,1)" }}>
                    COPY
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={shareInvite}
                  className="flex-1 h-12 rounded-full text-white flex items-center justify-center gap-2 border-2 border-black"
                  style={{ backgroundColor: g.bg, boxShadow: "2px 2px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}
                >
                  <Share2 size={16} /> Share Link
                </button>
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-black text-black/50 hover:text-black"
                  style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
                  title="Search & Add friend"
                >
                  <Plus size={16} />
                </button>
              </div>
            </motion.div>
          )}

          <button
            onClick={() => {
              if (edges.length > 0) {
                toast("Please settle all debts in the group first", "#FF5C39");
              } else {
                setConfirmAction("exit");
              }
            }}
            className="w-full h-[52px] rounded-[18px] border-2 border-black bg-white flex items-center justify-between px-4 text-black transition-transform active:scale-[0.98]"
            style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
          >
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>Exit Group</span>
            <span className="text-black/40 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>Leave silently</span>
          </button>

          <button
            onClick={() => {
              if (edges.length > 0) {
                toast("Please settle all debts in the group first", "#FF5C39");
              } else {
                setConfirmAction("delete");
              }
            }}
            className="w-full h-[52px] rounded-[18px] border-2 border-black flex items-center justify-between px-4 text-black transition-transform active:scale-[0.98]"
            style={{ backgroundColor: "#FF5C39", boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
          >
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>Delete Group</span>
            <X size={16} className="text-black/60" />
          </button>
        </div>
      </div>

      {/* Custom Modals */}
      <AnimatePresence>
        {confirmAction && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmAction(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-[28px] border-2 border-black p-6"
              style={{ boxShadow: "5px 5px 0 0 rgba(0,0,0,1)" }}
            >
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>
                {confirmAction === "exit" ? "Exit Group?" : "Delete Group?"}
              </h3>
              <p className="mt-3 text-black/60" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, lineHeight: 1.5 }}>
                {confirmAction === "exit"
                  ? `Are you sure you want to exit ${g.name}? You will no longer be a part of this group.`
                  : `Delete ${g.name} for everyone? All bills and history will be permanently lost.`}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center font-bold"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmAction === "exit") {
                      actions.exitGroup(g.id);
                      onClose();
                    } else {
                      actions.deleteGroup(g.id);
                      onClose();
                    }
                    setConfirmAction(null);
                  }}
                  className="flex-1 h-12 rounded-full border-2 border-black flex items-center justify-center font-bold text-black"
                  style={{ backgroundColor: confirmAction === "exit" ? "#FFD84D" : "#FF5C39", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14 }}
                >
                  {confirmAction === "exit" ? "Exit" : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {splitToDelete && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSplitToDelete(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
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
                    Delete Split?
                  </h2>
                  <button onClick={() => setSplitToDelete(null)} className="h-8 w-8 rounded-full border-2 border-black flex items-center justify-center bg-white hover:bg-black/5 transition-colors" style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}>
                    <X size={16} />
                  </button>
                </div>
                
                <div className="p-6 flex flex-col text-center">
                  <p className="text-black/80" style={{ fontFamily: "'Inter', sans-serif", fontSize: 16 }}>
                    Are you sure you want to delete this split? This action cannot be undone and will permanently alter everyone's simplified debts.
                  </p>
                </div>

                <div className="p-5 pt-0 flex flex-col gap-3">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      actions.deleteBill(splitToDelete);
                      setSplitToDelete(null);
                    }}
                    className="w-full h-14 rounded-full border-2 border-black bg-[#FF5C39] text-black text-center flex items-center justify-center"
                    style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}
                  >
                    Delete permanently
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSplitToDelete(null)}
                    className="w-full h-14 rounded-full border-2 border-black bg-white text-black text-center flex items-center justify-center"
                    style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showAddFriend && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddFriend(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-[28px] border-2 border-black p-6"
              style={{ boxShadow: "5px 5px 0 0 rgba(0,0,0,1)" }}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>Add Friend</h3>
                <button onClick={() => setShowAddFriend(false)} className="h-8 w-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
                  <X size={16} className="text-black/60" />
                </button>
              </div>

              <input
                autoFocus
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="Search friend's @username or name..."
                className="w-full h-[52px] bg-black/5 rounded-2xl px-4 outline-none border-2 border-transparent focus:border-black transition-colors shrink-0"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}
              />

              <div className="mt-4 flex-1 overflow-y-auto min-h-[100px] max-h-[300px]">
                {friendSearch.trim().length > 0 ? (
                  isFriendSearching ? (
                    <div className="text-center text-black/50 py-4 text-sm font-medium">Searching...</div>
                  ) : friendSearchResults.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {friendSearchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            actions.addExistingMember(g.id, user);
                            setShowAddFriend(false);
                            setFriendSearch("");
                            setShowInvite(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-transparent hover:border-black/10 bg-black/5 hover:bg-black/5 transition-all text-left"
                        >
                          <Avatar name={user.name} color={user.color} size={36} />
                          <div>
                            <div className="font-bold text-black text-[15px] leading-tight flex items-center gap-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                              {user.name}
                            </div>
                            <div className="text-black/50 text-[12px] font-medium tracking-tight mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                              @{user.id}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-black/50 text-sm mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>No user found with that name.</p>
                      <button
                        onClick={shareInvite}
                        className="bg-black text-white px-5 py-2.5 rounded-full font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all text-sm"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        Invite {friendSearch} to Roomie
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center text-black/40 py-8 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Type a name or username to search
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
