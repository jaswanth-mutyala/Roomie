import { motion, AnimatePresence } from "motion/react";
import { X, Trophy, Flame, Zap, Bell, Wallet, Shield, LogOut, ChevronRight, Moon, Sparkles, Check } from "lucide-react";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { useStore, actions } from "../store";
import { supabase } from "../../lib/supabase";

export function ProfileSheet({
  open,
  onClose,
  onOpenWrap,
}: {
  open: boolean;
  onClose: () => void;
  onOpenWrap?: () => void;
}) {
  const me = useStore((s) => s.me);
  const profile = useStore((s) => s.profile);
  const bills = useStore((s) => s.bills);
  const [editingUpi, setEditingUpi] = useState(false);
  const [upiDraft, setUpiDraft] = useState(me.upi);

  const ytd = bills.reduce((s, b) => {
    const share = b.splitAmong.includes("me") ? b.amount / b.splitAmong.length : 0;
    return s + share;
  }, 0);

  const saveUpi = () => {
    if (!upiDraft.trim()) return;
    actions.setUpi(upiDraft.trim());
    setEditingUpi(false);
  };

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
            className="absolute inset-0 z-50 bg-[#FFFBF2] overflow-hidden"
          >
            <div className="flex flex-col h-full pt-4">
              <div className="flex items-center justify-between px-5 pb-3">
                <div>
                  <div className="text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.1em" }}>PROFILE</div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                    My Stuff
                  </h2>
                </div>
                <button onClick={onClose} className="h-9 w-9 rounded-full bg-white border-2 border-black flex items-center justify-center" style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}>
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {/* Identity */}
                <motion.div
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="rounded-[28px] border-2 border-black p-5 relative overflow-hidden"
                  style={{ backgroundColor: "#7B61FF", boxShadow: "6px 6px 0 0 rgba(0,0,0,1)" }}
                >
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full" style={{ backgroundColor: "#9F8BFF" }} />
                  <div className="relative flex items-center gap-3">
                    <Avatar name={me.name} color={me.color} size={60} />
                    <div className="flex-1">
                      <div className="text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", lineHeight: 1 }}>
                        {me.name}
                      </div>
                      <div className="text-white/70" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                        {me.upi} · since Jan '26
                      </div>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.1em" }}>
                        <Trophy size={10} className="text-[#FFD84D]" /> PUNCTUAL PAYER
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-5">
                    <div className="flex items-end justify-between mb-1.5">
                      <span className="text-white/70" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.1em" }}>
                        ROOMIE KARMA
                      </span>
                      <span className="text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
                        {me.karma}<span className="text-white/50">/100</span>
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-black/30 border-2 border-black overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${me.karma}%` }}
                        transition={{ duration: 1 }}
                        className="h-full"
                        style={{ background: "linear-gradient(90deg,#74FF5A,#FFD84D)" }}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-[22px] border-2 border-black p-4 bg-white" style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-[#FF5C39] border-2 border-black flex items-center justify-center">
                        <Flame size={14} className="text-black" />
                      </div>
                      <span className="text-black/55" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.06em" }}>
                        Pay streak
                      </span>
                    </div>
                    <div className="mt-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {me.streak} <span className="text-black/40" style={{ fontSize: 14 }}>months</span>
                    </div>
                  </div>
                  <div className="rounded-[22px] border-2 border-black p-4" style={{ backgroundColor: "#74FF5A", boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-black flex items-center justify-center">
                        <Zap size={14} className="text-[#74FF5A]" />
                      </div>
                      <span className="text-black/70" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.06em" }}>
                        YTD burn
                      </span>
                    </div>
                    <div className="mt-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: "-0.02em", lineHeight: 1 }}>
                      ₹{(ytd / 1000).toFixed(1)}k
                    </div>
                  </div>
                </div>

                {/* Monthly Wrap button */}
                <button
                  onClick={onOpenWrap}
                  className="mt-4 w-full rounded-[20px] border-2 border-black p-3 flex items-center gap-3"
                  style={{ backgroundColor: "#FFD84D", boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
                >
                  <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center">
                    <Sparkles size={16} className="text-[#FFD84D]" />
                  </div>
                  <div className="flex-1 text-left">
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>Monthly Wrap</div>
                    <div className="text-black/60" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>Your April story in 3 cards</div>
                  </div>
                  <ChevronRight size={16} />
                </button>

                {/* UPI editor */}
                <div className="mt-4 rounded-[20px] border-2 border-black bg-white p-3" style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl border-2 border-black bg-[#74FF5A] flex items-center justify-center">
                      <Wallet size={16} />
                    </div>
                    <div className="flex-1">
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>UPI ID</div>
                      {!editingUpi ? (
                        <div className="text-black/60" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>{me.upi}</div>
                      ) : (
                        <input
                          value={upiDraft}
                          onChange={(e) => setUpiDraft(e.target.value)}
                          placeholder="yourname@bank"
                          className="mt-1 w-full h-8 rounded-full border-2 border-black px-3 bg-[#FFFBF2] outline-none"
                          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12 }}
                          autoFocus
                        />
                      )}
                    </div>
                    {!editingUpi ? (
                      <button
                        onClick={() => {
                          setUpiDraft(me.upi);
                          setEditingUpi(true);
                        }}
                        className="h-9 px-3 rounded-full border-2 border-black bg-white"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11 }}
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        onClick={saveUpi}
                        className="h-9 w-9 rounded-full border-2 border-black bg-[#74FF5A] flex items-center justify-center"
                        style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Toggles */}
                <div className="mt-3 space-y-2">
                  <ToggleRow
                    icon={<Bell size={16} />}
                    tint="#FFD84D"
                    label="Notifications"
                    sub="Bill alerts, nudges"
                    active={profile.notifications}
                    onToggle={() => actions.updateProfile({ notifications: !profile.notifications })}
                  />
                  <ToggleRow
                    icon={<Moon size={16} />}
                    tint="#B5A8FF"
                    label="Dark mode"
                    sub="Easy on the eyes at night"
                    active={profile.darkMode}
                    onToggle={() => actions.updateProfile({ darkMode: !profile.darkMode })}
                  />
                  <ToggleRow
                    icon={<Shield size={16} />}
                    tint="#FF9FB8"
                    label="Share burn in Wrap"
                    sub="Friends can see your month"
                    active={profile.shareBurn}
                    onToggle={() => actions.updateProfile({ shareBurn: !profile.shareBurn })}
                  />
                </div>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.reload();
                  }}
                  className="mt-5 w-full h-[52px] rounded-full border-2 border-black bg-white flex items-center justify-center gap-2 text-black/70"
                  style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13 }}
                >
                  <LogOut size={14} /> Sign out
                </button>
                <div className="text-center text-black/35 mt-3" style={{ fontFamily: "'Inter', sans-serif", fontSize: 10 }}>
                  Roomie v1.0 · made with ☕ in Bangalore
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ToggleRow({
  icon,
  tint,
  label,
  sub,
  active,
  onToggle,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  sub: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full rounded-[20px] border-2 border-black bg-white p-3 flex items-center gap-3"
      style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
    >
      <div className="h-10 w-10 rounded-xl border-2 border-black flex items-center justify-center" style={{ backgroundColor: tint }}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, lineHeight: 1.1 }}>{label}</div>
        <div className="text-black/55" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>{sub}</div>
      </div>
      <div
        className="h-7 w-12 rounded-full border-2 border-black flex items-center p-0.5"
        style={{ backgroundColor: active ? "#74FF5A" : "#ddd" }}
      >
        <motion.div
          animate={{ x: active ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="h-5 w-5 rounded-full bg-white border-2 border-black"
        />
      </div>
    </button>
  );
}
