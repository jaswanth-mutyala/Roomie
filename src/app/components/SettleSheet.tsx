import { useState } from "react";
import { BurstKind } from "./SuccessBurst";
import { motion, AnimatePresence } from "motion/react";
import { X, Flag, Smartphone, Info, ChevronDown, CheckCircle2, Send } from "lucide-react";
import { Avatar } from "./Avatar";
import { useStore, simplifyDebts, groupBills, actions, toast, AUTO_FORGIVE_THRESHOLD } from "../store";
import { UpiRequestModal } from "./UpiRequestModal";
import { UpiConfirmationModal } from "./UpiConfirmationModal";
import { ConfirmDialog, ConfirmPayload } from "./ConfirmDialog";

export function SettleSheet({
  groupId,
  memberId,
  onClose,
  onOpenNudge,
  onSuccess,
}: {
  groupId: string | null;
  memberId: string | null;
  onClose: () => void;
  onOpenNudge?: (memberId: string, amount: number) => void;
  onSuccess?: (kind: BurstKind) => void;
}) {
  const groups = useStore((s) => s.groups);
  const meUpi = useStore((s) => s.me.upi);
  const open = !!groupId && !!memberId;
  const g = groups.find((x) => x.id === groupId);
  const person = g?.members.find((m) => m.id === memberId);

  if (!open || !g || !person) {
    return (
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 z-[60]" />
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 z-[60]" />
      <motion.div
        key="sh"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="absolute bottom-0 left-0 right-0 z-[70] bg-[#FFFBF2] rounded-t-[36px] border-t-2 border-black overflow-hidden"
        style={{ height: "94%" }}
      >
        <Inner g={g} person={person} onClose={onClose} onOpenNudge={onOpenNudge} onSuccess={onSuccess} />
      </motion.div>
    </AnimatePresence>
  );
}

function Inner({
  g, person, onClose, onOpenNudge, onSuccess,
}: {
  g: { id: string; name: string; bg: string; members: { id: string; name: string; color: string; upi?: string }[] };
  person: { id: string; name: string; color: string; upi?: string };
  onClose: () => void;
  onOpenNudge?: (memberId: string, amount: number) => void;
  onSuccess?: (kind: BurstKind) => void;
}) {
  const meUpi = useStore((s) => s.me.upi);
  // Subscribe to settlements so we re-render when debts change
  useStore((s) => s.settlements.length);
  useStore((s) => s.bills);
  const edges = simplifyDebts(g.id);
  const fromMe = edges.find((e) => e.from === "me" && e.to === person.id);
  const toMe = edges.find((e) => e.to === "me" && e.from === person.id);
  const owed = toMe?.amount || 0;
  const owes = fromMe?.amount || 0;
  const isOwedToMe = owed > 0;
  const amount = isOwedToMe ? owed : owes;
  const [showUpiRequest, setShowUpiRequest] = useState(false);
  const [showUpiConfirm, setShowUpiConfirm] = useState(false);
  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [showFlag, setShowFlag] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<ConfirmPayload | null>(null);
  const [flagReason, setFlagReason] = useState("");

  const items = groupBills(g.id)
    .filter((b) => b.splitAmong.includes(person.id) && b.splitAmong.includes("me"))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
    .map((b) => {
      const splitCount = b.splitAmong.length || 1;
      const perHead = b.amount / splitCount;

      // Calculate exact proportional debt flow between me and this person for THIS bill
      const nets: Record<string, number> = {};
      let totalCredit = 0;

      for (const id of b.splitAmong) {
        const paid = b.payers[id] || 0;
        const net = paid - perHead;
        nets[id] = net;
        if (net > 0) totalCredit += net;
      }

      // Also include payers who are not in splitAmong
      for (const [id, paid] of Object.entries(b.payers)) {
        if (!b.splitAmong.includes(id)) {
          nets[id] = paid;
          if (paid > 0) totalCredit += paid;
        }
      }

      const myNet = nets["me"] || 0;
      const theirNet = nets[person.id] || 0;
      let billContrib = 0;
      let proportion = 0;

      if (isOwedToMe) {
        // They owe me overall. Show how much of their debt for this bill goes to my credit.
        if (theirNet < -AUTO_FORGIVE_THRESHOLD && myNet > AUTO_FORGIVE_THRESHOLD && totalCredit > 0) {
          proportion = myNet / totalCredit;
          billContrib = Math.abs(theirNet) * proportion;
        }
      } else {
        // I owe them overall. Show how much of my debt for this bill goes to their credit.
        if (myNet < -AUTO_FORGIVE_THRESHOLD && theirNet > AUTO_FORGIVE_THRESHOLD && totalCredit > 0) {
          proportion = theirNet / totalCredit;
          billContrib = Math.abs(myNet) * proportion;
        }
      }

      const payerIds = Object.keys(b.payers);
      const payerName = payerIds.map(id => {
        const name = id === "me" ? "You" : (g.members.find(m => m.id === id)?.name || id);
        return payerIds.length > 1 ? `${name} (₹${b.payers[id]})` : name;
      }).join(", ");
      const d = new Date(b.date);
      const dateStr = isNaN(d.getTime()) ? b.date : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const timeStr = isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      return { id: b.id, label: b.title, amt: Math.round(billContrib), total: b.amount, payerName, dateStr, timeStr, splitCount, perHead: Math.round(perHead), myNet: Math.round(myNet), theirNet: Math.round(theirNet), proportion, isEdited: b.isEdited, isFlagged: !!b.flag };
    })
    .filter(i => i.amt > 0); // Only show bills that actually contribute to the debt

  const handleSettle = () => {
    if (amount <= 0) return onClose();
    if (isOwedToMe) {
      actions.settle(g.id, person.id, "me", amount);
      onClose();
      onSuccess?.("received");
    } else {
      setShowUpiConfirm(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="pt-3 pb-2 flex flex-col items-center">
            <div className="h-1.5 w-12 rounded-full bg-black/30" />
          </div>
          <div className="flex items-center justify-between px-6 pb-3">
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>Settle Up</span>
            <button onClick={onClose} className="h-9 w-9 rounded-full bg-white border-2 border-black flex items-center justify-center" style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}>
              <X size={16} />
            </button>
          </div>

          <div className="px-5">
            <div className="rounded-[28px] border-2 border-black p-5 relative overflow-hidden" style={{ backgroundColor: "#1A1A1A", boxShadow: "5px 5px 0 0 rgba(0,0,0,1)" }}>
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full" style={{ backgroundColor: g.bg }} />
              <div className="relative flex items-center gap-3">
                <Avatar name={person.name} color={person.color} size={52} />
                <div>
                  <div className="text-white/60" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                    {person.name.split(" ")[0]} {isOwedToMe ? "owes you" : "→ you owe"} · {g.name}
                  </div>
                  <div className="flex items-baseline gap-0.5 text-white">
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22 }}>₹</span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 48, letterSpacing: "-0.04em", lineHeight: 1 }}>
                      {amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 mt-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-2 px-1">
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.08em" }}>BREAKDOWN</span>
            </div>
            <div className="bg-white border-2 border-black rounded-[22px] overflow-hidden" style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}>
              <div className="px-4 py-3 border-b-2 border-dashed border-black/20">
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.18em" }}>
                  ROOMIE · RECEIPT
                </div>
                <div className="text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                  {g.name} · {new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                {items.map((i, idx) => (
                  <ReceiptRow key={idx} item={i} groupName={g.name} groupId={g.id} />
                ))}
                {items.length === 0 && (
                  <div className="text-center text-black/40 py-3" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                    No shared bills found
                  </div>
                )}
                <div className="border-t-2 border-dashed border-black/20 pt-2.5 mt-2 flex items-center justify-between">
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>NET OWED</span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
                    ₹{amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              <div className="px-4 pb-4 flex items-center gap-[2px] h-10 overflow-hidden">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i} className="bg-black" style={{ width: i % 3 === 0 ? 2 : 1, height: "100%" }} />
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 pb-8 border-t-2 border-black/10">
            <div className="flex gap-3">
              {isOwedToMe ? (
                <>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowUpiRequest(true)}
                    className="flex-1 h-[58px] rounded-full border-2 border-black flex items-center justify-center gap-2 text-white"
                    style={{
                      backgroundColor: "#1A1A1A",
                      boxShadow: "5px 5px 0 0 rgba(0,0,0,1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <Smartphone size={16} /> Request UPI
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setConfirmPayload({
                      kind: "receive",
                      amount,
                      groupName: g.name,
                      memberName: person.name,
                      memberColor: person.color,
                      onConfirm: () => {
                        actions.settle(g.id, person.id, "me", amount);
                        onClose();
                        onSuccess?.("received");
                      },
                    })}
                    className="flex-1 h-[58px] rounded-full border-2 border-black flex items-center justify-center gap-2 text-black"
                    style={{
                      backgroundColor: "#74FF5A",
                      boxShadow: "5px 5px 0 0 rgba(0,0,0,1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <CheckCircle2 size={16} /> Received
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowUpiConfirm(true)}
                    className="flex-1 h-[58px] rounded-full border-2 border-black flex items-center justify-center gap-2 text-black"
                    style={{
                      backgroundColor: "#74FF5A",
                      boxShadow: "5px 5px 0 0 rgba(0,0,0,1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <Smartphone size={16} /> Pay via UPI
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setConfirmPayload({
                      kind: "pay",
                      amount,
                      groupName: g.name,
                      memberName: person.name,
                      memberColor: person.color,
                      upi: person.upi,
                      onConfirm: () => {
                        actions.settle(g.id, "me", person.id, amount);
                        onClose();
                        onSuccess?.("paid");
                      },
                    })}
                    className="flex-1 h-[58px] rounded-full border-2 border-black flex items-center justify-center gap-2 text-black"
                    style={{
                      backgroundColor: "#FFD84D",
                      boxShadow: "5px 5px 0 0 rgba(0,0,0,1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <CheckCircle2 size={16} /> Paid
                  </motion.button>
                </>
              )}
            </div>
          </div>
          <UpiRequestModal
            open={showUpiRequest}
            onClose={() => setShowUpiRequest(false)}
            receiverName={person.name}
            receiverColor={person.color}
            amount={amount}
            note={`Roomie · ${g.name}`}
          />
          <UpiConfirmationModal
            open={showUpiConfirm}
            onClose={() => {
              setShowUpiConfirm(false);
              onClose(); // Close the SettleSheet as well, since the modal handles the settlement logic
              onSuccess?.("paid");
            }}
            groupId={g.id}
            receiverId={person.id}
            amount={amount}
          />
          <ConfirmDialog
            payload={confirmPayload}
            onClose={() => setConfirmPayload(null)}
          />
    </div>
  );
}

/** Single receipt line — clean row with date + expandable ⓘ detail */
function ReceiptRow({ item, groupName, groupId }: { item: { id: string; label: string; amt: number; total: number; payerName: string; dateStr: string; timeStr: string; splitCount: number; perHead: number; myNet: number; theirNet: number; proportion: number; isEdited?: boolean; isFlagged?: boolean }; groupName: string; groupId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [showFlag, setShowFlag] = useState(false);
  const [flagReason, setFlagReason] = useState("");

  const submitFlag = () => {
    if (!flagReason.trim()) return;
    actions.flagBill(item.id, flagReason.trim());
    actions.pushNotification({
      kind: "info",
      name: "You",
      color: "#FFD84D",
      title: `🚩 Flagged "${item.label}" in ${groupName}`,
      sub: flagReason.trim(),
      action: { type: "bill", id: item.id, groupId },
    });
    toast(`Bill flagged: ${flagReason.trim()} 🚩`, "#FFD84D");
    setFlagReason("");
    setShowFlag(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13 }}>{item.label}</span>
            {item.isFlagged && <span className="text-[8px] bg-[#FFD84D]/30 px-1.2 py-0.2 rounded-full text-[#b45309] font-bold border border-[#FFD84D]">🚩</span>}
            {item.isEdited && <span className="text-[8px] bg-black/5 px-1.2 py-0.2 rounded-full text-black/40 font-bold border border-black/10">📝</span>}
          </div>
          <div className="text-black/40 mt-0.5" style={{ fontFamily: "'Inter', sans-serif", fontSize: 10 }}>
            {item.dateStr}{item.timeStr ? ` · ${item.timeStr}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14 }}>₹{item.amt}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="h-6 w-6 rounded-full bg-black/5 flex items-center justify-center transition-colors hover:bg-black/10"
          >
            {expanded ? <ChevronDown size={12} className="text-black/50 rotate-180 transition-transform" /> : <Info size={11} className="text-black/40" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-lg bg-black/[0.03] px-3 py-2 space-y-1" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
              <div className="flex justify-between text-black/60">
                <span>Paid by</span>
                <span className="font-semibold text-black/80">{item.payerName}</span>
              </div>
              <div className="flex justify-between text-black/60">
                <span>Total bill</span>
                <span className="font-semibold text-black/80">₹{item.total.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-black/60">
                <span>Split among</span>
                <span className="font-semibold text-black/80">{item.splitCount} people</span>
              </div>
              <div className="flex justify-between text-black/60">
                <span>Per person share</span>
                <span className="font-semibold text-black/80">₹{item.perHead.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-black/60 pt-1 mt-1 border-t border-black/5">
                <span>Added to this receipt</span>
                <span className="font-semibold text-black/80">₹{item.amt}</span>
              </div>
              <div className="text-black/50 pt-2 pb-1 space-y-1" style={{ fontSize: 10 }}>
                <div className="flex justify-between">
                  <span>{item.myNet < 0 ? "Your underpayment for this bill" : "Their underpayment for this bill"}</span>
                  <span>₹{item.myNet < 0 ? Math.abs(item.myNet) : Math.abs(item.theirNet)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{item.myNet < 0 ? "Their share of the overpayment" : "Your share of the overpayment"}</span>
                  <span>{Math.round(item.proportion * 100)}%</span>
                </div>
                <div className="flex justify-between text-black/40 pt-1 border-t border-black/5" style={{ fontSize: 9 }}>
                  <span>₹{item.myNet < 0 ? Math.abs(item.myNet) : Math.abs(item.theirNet)} × {Math.round(item.proportion * 100)}%</span>
                  <span>= ₹{item.amt}</span>
                </div>
                {item.proportion < 0.99 && (
                  <div className="text-black/30 pt-0.5 leading-tight" style={{ fontSize: 8.5 }}>
                    * The remaining {Math.round((1 - item.proportion) * 100)}% of the {item.myNet < 0 ? "underpayment" : "overpayment"} is distributed to other members on their respective receipts.
                  </div>
                )}
              </div>

              {/* Flag this bill */}
              <div className="pt-2 mt-1 border-t border-black/5">
                <AnimatePresence>
                  {showFlag && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-2"
                    >
                      <div className="text-black/50 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.08em" }}>
                        WHAT'S WRONG?
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          autoFocus
                          value={flagReason}
                          onChange={(e) => setFlagReason(e.target.value)}
                          placeholder="e.g. I wasn't part of this"
                          className="flex-1 h-8 rounded-full border border-black/20 bg-white px-2.5 text-black outline-none"
                          style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}
                          onKeyDown={(e) => { if (e.key === "Enter") submitFlag(); }}
                        />
                        <button
                          onClick={submitFlag}
                          className="h-8 w-8 rounded-full bg-[#FFD84D] border border-black/20 flex items-center justify-center shrink-0"
                        >
                          <Send size={11} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setShowFlag(!showFlag)}
                  className="flex items-center gap-1 text-black/35 hover:text-[#FF5C39] transition-colors"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 10 }}
                >
                  <Flag size={10} /> {showFlag ? "Cancel" : "Flag this bill"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
