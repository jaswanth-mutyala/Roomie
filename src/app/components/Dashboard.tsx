import { useState } from "react";
import { motion } from "motion/react";
import { Bell, Home, Clock, User, Plus, Info, Repeat, MessageCircleWarning, Users, Smartphone } from "lucide-react";
import { Avatar } from "./Avatar";
import { BentoCard } from "./BentoCard";
import { SpendingDonut } from "./SpendingDonut";
import { GroupsCarousel } from "./GroupsCarousel";
import { useStore, owedToYouAcrossGroups, youOweAcrossGroups, actions, toast } from "../store";
import { SettleAllModal } from "./SettleAllModal";
import { UpiConfirmationModal } from "./UpiConfirmationModal";
import { UpiRequestModal } from "./UpiRequestModal";
import { shareUpiRequest } from "../utils/upi";

export function Dashboard({
  onOpenSplit,
  onOpenHistory,
  onOpenScan: _onOpenScan,
  onOpenWrap: _onOpenWrap,
  onOpenProfile,
  onOpenRecurring,
  onOpenNudge,
  onOpenNotifications,
  onOpenGroup,
  onOpenGroups,
  onOpenSettle,
}: {
  onOpenSplit: () => void;
  onOpenHistory: () => void;
  onOpenScan: () => void;
  onOpenWrap: () => void;
  onOpenProfile: () => void;
  onOpenRecurring: () => void;
  onOpenNudge: () => void;
  onOpenNotifications: () => void;
  onOpenGroup: (id: string) => void;
  onOpenGroups: () => void;
  onOpenSettle?: (groupId: string, memberId: string) => void;
}) {
  const me = useStore((s) => s.me);
  const [showSettleAll, setShowSettleAll] = useState(false);
  const [upiConfirmCtx, setUpiConfirmCtx] = useState<{ groupId: string; receiverId: string; amount: number } | null>(null);
  const [upiRequestCtx, setUpiRequestCtx] = useState<{ name: string; color: string; amount: number; note: string } | null>(null);
  useStore((s) => s.bills.length + s.settlements.length + s.groups.length);
  const recurringCount = useStore((s) => s.recurring.filter((r) => !r.paused).length);

  const owedToYou = owedToYouAcrossGroups();
  const youOwe = youOweAcrossGroups();
  const oweTotal = youOwe.reduce((s, e) => s + e.amount, 0);

  const unreadNotifs = useStore((s) => s.notifications.filter((n) => n.unread).length);

  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden pb-[120px]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <div>
          <p className="text-black/55" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 12 }}>
            Hey {me.name.split(" ")[0]} 👋
          </p>
          <div className="flex items-baseline gap-1">
            <h1 className="text-black" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30, letterSpacing: "-0.03em", lineHeight: 1 }}>
              Roomie.
            </h1>
            <span className="inline-block h-2 w-2 rounded-full bg-[#74FF5A] border border-black" />
          </div>
        </div>
        <button
          onClick={onOpenNotifications}
          className="h-11 w-11 rounded-full bg-white border-2 border-black flex items-center justify-center relative"
          style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
        >
          <Bell size={18} className="text-black" />
          {unreadNotifs > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#FF5C39] border-2 border-black text-white flex items-center justify-center" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9 }}>
              {unreadNotifs}
            </span>
          )}
        </button>
      </div>

      <div className="mt-4">
        <GroupsCarousel onOpenGroup={onOpenGroup} onOpenManage={onOpenGroups} />
      </div>

      {/* Donut + quick stats row */}
      <div className="px-5 mt-5 grid grid-cols-5 gap-3">
        <div className="col-span-3">
          <BentoCard className="bg-white h-full">
            <div className="p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-black/50" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em" }}>
                  CATEGORY BURN
                </div>
              </div>
              <SpendingDonut />
            </div>
          </BentoCard>
        </div>
        <div className="col-span-2 flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onOpenRecurring}
            className="flex-1 rounded-[22px] border-2 border-black bg-white p-3 flex flex-col justify-between text-left"
            style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
          >
            <div className="h-9 w-9 rounded-xl bg-[#B5A8FF] border-2 border-black flex items-center justify-center">
              <Repeat size={15} />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, lineHeight: 1 }}>Autopilot</div>
              <div className="text-black/55 mt-1" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                {recurringCount} active
              </div>
            </div>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onOpenNudge}
            className="flex-1 rounded-[22px] border-2 border-black p-3 flex flex-col justify-between text-left"
            style={{ backgroundColor: "#FFD84D", boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
          >
            <div className="h-9 w-9 rounded-xl bg-black flex items-center justify-center">
              <MessageCircleWarning size={15} className="text-[#FFD84D]" />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, lineHeight: 1 }}>Nudge 🫣</div>
              <div className="text-black/60 mt-1" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                {owedToYou.length} owe you
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Who owes you */}
      <div className="px-5 mt-5">
        <BentoCard className="bg-white">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>
                Who owes you
              </h2>
              <button onClick={onOpenHistory} className="text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                See all
              </button>
            </div>

            <div className="space-y-1">
              {owedToYou.length === 0 && (
                <div className="rounded-[20px] border-2 border-dashed border-black/20 p-5 text-center text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                  Nothing pending — you're all caught up 🎉
                </div>
              )}
              {owedToYou.slice(0, 5).map((r, i) => (
                <motion.div
                  key={r.groupId + r.from}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.04 * (i + 1), type: "spring", stiffness: 220, damping: 24 }}
                >
                  <div
                    onClick={() => onOpenSettle ? onOpenSettle(r.groupId, r.from) : onOpenGroup(r.groupId)}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-black/5 cursor-pointer transition-colors"
                  >
                    <Avatar name={r.fromName} color={r.fromColor} size={42} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-black" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, lineHeight: 1.1 }}>
                        {r.fromName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#74FF5A]" />
                        <span className="text-black/60" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                          {r.groupName} · owes you
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1 shrink-0">
                      <div className="tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", lineHeight: 1 }}>
                        ₹{r.amount.toLocaleString("en-IN")}
                      </div>
                      {me.upi && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpiRequestCtx({
                              name: r.fromName,
                              color: r.fromColor,
                              amount: r.amount,
                              note: `Roomie · ${r.groupName}`
                            });
                          }}
                          className="text-[#1A1A1A] bg-black/5 hover:bg-black/10 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
                          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10 }}
                        >
                          Request <Smartphone size={10} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </BentoCard>
      </div>

      {/* You owe */}
      <div className="px-5 mt-4">
        <BentoCard className="bg-black text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/55" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em" }}>
                  YOU OWE
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>₹</span>
                  <span className="tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30, letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {oweTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-white/50 mt-1" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                  to {youOwe.length} {youOwe.length === 1 ? "roomie" : "roomies"} · across groups
                </div>
              </div>
              {youOwe.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettleAll(true)}
                  className="h-11 px-4 rounded-full border-2 border-black bg-[#74FF5A] text-black"
                  style={{ boxShadow: "3px 3px 0 0 rgba(255,255,255,0.2)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12 }}
                >
                  Settle all
                </motion.button>
              )}
            </div>
            {youOwe.length > 0 ? (
              <div className="mt-3 space-y-2">
                {youOwe.map((p) => (
                  <div
                    key={p.groupId + p.to}
                    onClick={() => onOpenSettle ? onOpenSettle(p.groupId, p.to) : onOpenGroup(p.groupId)}
                    className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-3 py-2 cursor-pointer"
                  >
                    <Avatar name={p.toName} color={p.toColor} size={30} ring={false} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, lineHeight: 1 }}>
                        {p.toName}
                      </div>
                      <div className="text-white/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, marginTop: 2 }}>
                        {p.groupName} · you owe ₹{p.amount}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUpiConfirmCtx({ groupId: p.groupId, receiverId: p.to, amount: p.amount });
                      }}
                      className="h-8 px-3 rounded-full bg-white text-black border-2 border-black"
                      style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11 }}
                    >
                      Pay UPI →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[20px] border-2 border-dashed border-white/20 p-5 text-center text-white/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                You have no pending payments. Great job! 💸
              </div>
            )}
          </div>
        </BentoCard>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-30">
        <div className="relative mx-auto w-full" style={{ maxWidth: 430 }}>
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center pointer-events-auto">
            <div
              className="flex items-center gap-1 rounded-full bg-black px-2 h-[60px] border-2 border-black"
              style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
            >
              <NavIcon active icon={<Home size={19} />} />
              <NavIcon icon={<Users size={19} />} onClick={onOpenGroups} />
              <button
                onClick={onOpenSplit}
                className="h-[52px] w-[52px] rounded-full flex items-center justify-center mx-1"
                style={{ backgroundColor: "#74FF5A", border: "2px solid #000", boxShadow: "0 0 0 4px #000" }}
              >
                <Plus size={24} className="text-black" strokeWidth={3} />
              </button>
              <NavIcon icon={<Clock size={19} />} onClick={onOpenHistory} />
              <NavIcon icon={<User size={19} />} onClick={onOpenProfile} />
            </div>
          </div>
        </div>
      </div>

      <SettleAllModal 
        open={showSettleAll} 
        onClose={() => setShowSettleAll(false)} 
        youOwe={youOwe} 
        oweTotal={oweTotal} 
      />
      <UpiConfirmationModal
        open={!!upiConfirmCtx}
        onClose={() => setUpiConfirmCtx(null)}
        groupId={upiConfirmCtx?.groupId || null}
        receiverId={upiConfirmCtx?.receiverId || null}
        amount={upiConfirmCtx?.amount || 0}
      />
      <UpiRequestModal
        open={!!upiRequestCtx}
        onClose={() => setUpiRequestCtx(null)}
        receiverName={upiRequestCtx?.name || ""}
        receiverColor={upiRequestCtx?.color}
        amount={upiRequestCtx?.amount || 0}
        note={upiRequestCtx?.note || ""}
      />
    </div>
  );
}

function NavIcon({ icon, active = false, onClick }: { icon: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-10 w-10 rounded-full flex items-center justify-center ${active ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
    >
      {icon}
    </button>
  );
}
