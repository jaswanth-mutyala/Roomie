import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  Users, Plus, Repeat, MessageCircleWarning, Sparkles, Wallet, Bell, ArrowRight, Check,
} from "lucide-react";
import { Logo } from "./Logo";

type Step = {
  bg: string;
  accent: string;
  badge: string;
  title: string;
  body: string;
  visual: React.ReactNode;
};

const STEPS: Step[] = [
  {
    bg: "#7B61FF",
    accent: "#9F8BFF",
    badge: "WELCOME",
    title: "Splits without the awkward.",
    body: "Roomie tracks every rupee across roommates, trips and friend circles — so you never have to ask twice.",
    visual: <HeroLogoVisual />,
  },
  {
    bg: "#FFD84D",
    accent: "#FFE88A",
    badge: "STEP 01",
    title: "Make a group, add your crew",
    body: "PG roomies, Goa squad, office lunch club — each group has its own ledger, color and members.",
    visual: <GroupsVisual />,
  },
  {
    bg: "#74FF5A",
    accent: "#B5F5A8",
    badge: "STEP 02",
    title: "Tap +, swipe to split",
    body: "Punch the amount, pick payers (one or many), select who's in. Drag the swipe-button — done.",
    visual: <SplitVisual />,
  },
  {
    bg: "#B5A8FF",
    accent: "#D8CFFF",
    badge: "STEP 03",
    title: "Autopilot the boring bills",
    body: "Rent, wifi, mess, weekly maid — set it once, Roomie reposts the split every cycle.",
    visual: <AutopilotVisual />,
  },
  {
    bg: "#FF9FB8",
    accent: "#FFC4D4",
    badge: "STEP 04",
    title: "Settle in 1 tap, nudge politely",
    body: "Simplified debt graph means fewer transfers. Pay UPI in-app or send a soft Nudge with one tap.",
    visual: <SettleVisual />,
  },
  {
    bg: "#1A1A1A",
    accent: "#74FF5A",
    badge: "READY?",
    title: "Build your money karma 💸",
    body: "Pay streak, monthly Wrap, group trophies — Roomie turns settling up into a game you'll actually want to win.",
    visual: <KarmaVisual />,
  },
];

export function WelcomeTour({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[55] flex flex-col"
      style={{ backgroundColor: step.bg }}
    >
      {/* Top progress */}
      <div className="px-5 pt-4 flex items-center gap-1.5">
        {STEPS.map((_, idx) => (
          <div key={idx} className="flex-1 h-1.5 rounded-full bg-black/20 overflow-hidden border border-black/20">
            <motion.div
              initial={false}
              animate={{ width: idx < i ? "100%" : idx === i ? "100%" : "0%" }}
              transition={{ duration: idx === i ? 0.5 : 0 }}
              className="h-full bg-black"
            />
          </div>
        ))}
      </div>
      <div className="px-5 mt-3 flex items-center justify-between">
        <span className="px-2 h-6 rounded-full bg-black text-white inline-flex items-center" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em" }}>
          {step.badge}
        </span>
        {!last && (
          <button onClick={onDone} className="text-black/65" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12 }}>
            Skip
          </button>
        )}
      </div>

      {/* Visual */}
      <div className="flex-1 flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full" style={{ backgroundColor: step.accent, opacity: 0.7 }} />
        <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full" style={{ backgroundColor: step.accent, opacity: 0.4 }} />
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ y: 24, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -24, scale: 0.94, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="relative w-full"
          >
            {step.visual}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Copy + CTA */}
      <div className="px-6 pb-7 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={i + "txt"}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className={i === 5 ? "text-white" : "text-black"}
          >
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              {step.title}
            </h2>
            <p className={`mt-2 ${i === 5 ? "text-white/70" : "text-black/70"}`} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
              {step.body}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={() => setI((x) => Math.max(0, x - 1))}
            disabled={i === 0}
            className="h-14 px-5 rounded-full border-2 border-black bg-white"
            style={{
              boxShadow: i === 0 ? "none" : "4px 4px 0 0 rgba(0,0,0,1)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              opacity: i === 0 ? 0.4 : 1,
            }}
          >
            Back
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => (last ? onDone() : setI((x) => x + 1))}
            className="flex-1 h-14 rounded-full border-2 border-black bg-black text-white flex items-center justify-center gap-2"
            style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}
          >
            {last ? (
              <>
                Let's go <Sparkles size={16} className="text-[#FFD84D]" />
              </>
            ) : (
              <>
                Next <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* --- Visuals --- */

function HeroLogoVisual() {
  return (
    <div className="flex flex-col items-center">
      <Logo size={130} />
      <div className="mt-6 flex gap-2">
        {["#FFD84D", "#74FF5A", "#FF9FB8"].map((c, i) => (
          <motion.div
            key={c}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
            className="h-9 px-3 rounded-full border-2 border-black bg-white flex items-center"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11 }}
          >
            <span className="h-2 w-2 rounded-full mr-1.5 border border-black" style={{ backgroundColor: c }} />
            {["Roomies", "Trips", "Friends"][i]}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function GroupsVisual() {
  const cards = [
    { emoji: "🏠", name: "404 Boys PG", color: "#7B61FF", n: 5 },
    { emoji: "🏖️", name: "Goa Trip", color: "#FF5C39", n: 4 },
    { emoji: "🍕", name: "Office Lunches", color: "#1A1A1A", n: 3 },
  ];
  return (
    <div className="space-y-2.5">
      {cards.map((c, i) => (
        <motion.div
          key={c.name}
          initial={{ x: i % 2 ? 60 : -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15 * i, type: "spring", stiffness: 220, damping: 22 }}
          className="rounded-[20px] border-2 border-black bg-white p-3 flex items-center gap-3"
          style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
        >
          <div className="h-12 w-12 rounded-2xl border-2 border-black flex items-center justify-center" style={{ backgroundColor: c.color, fontSize: 22 }}>
            {c.emoji}
          </div>
          <div className="flex-1">
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, lineHeight: 1.1 }}>{c.name}</div>
            <div className="flex items-center gap-1 text-black/55 mt-1">
              <Users size={11} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>{c.n} members</span>
            </div>
          </div>
          <Check size={16} className="text-[#74FF5A]" strokeWidth={3} />
        </motion.div>
      ))}
    </div>
  );
}

function SplitVisual() {
  return (
    <div className="rounded-[28px] border-2 border-black bg-white p-5" style={{ boxShadow: "5px 5px 0 0 rgba(0,0,0,1)" }}>
      <div className="text-black/55" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em" }}>NEW SPLIT</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22 }}>₹</span>
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 320, damping: 18 }}
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 56, letterSpacing: "-0.05em", lineHeight: 1 }}
        >
          1,000
        </motion.span>
      </div>
      <div className="mt-3 flex gap-1.5 flex-wrap">
        {["Mess", "Wifi", "Rent", "Maid"].map((c, i) => (
          <div key={c} className="h-7 px-2.5 rounded-full border-2 border-black flex items-center" style={{ backgroundColor: i === 0 ? "#74FF5A" : "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10 }}>
            {c}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        {["#FFD84D", "#74FF5A", "#FF5C39", "#B5A8FF"].map((c, i) => (
          <motion.div
            key={i}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.05 }}
            className="h-9 w-9 rounded-full border-2 border-black"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, 180, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.6 }}
        className="mt-4 h-12 w-12 rounded-full bg-white border-2 border-black flex items-center justify-center relative"
        style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
      >
        <ArrowRight size={18} />
      </motion.div>
      <div className="mt-2 -mt-12 ml-14 h-12 rounded-full bg-black flex items-center px-4">
        <span className="text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.16em" }}>
          SWIPE TO SPLIT
        </span>
      </div>
    </div>
  );
}

function AutopilotVisual() {
  const items = [
    { name: "April Rent", icon: "🏠", amt: "₹32k", tint: "#7B61FF" },
    { name: "Airtel Wifi", icon: "📡", amt: "₹999", tint: "#B5A8FF" },
    { name: "Mess sub", icon: "🍱", amt: "₹4.5k", tint: "#74FF5A" },
  ];
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <motion.div
          key={it.name}
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 * i, type: "spring", stiffness: 220, damping: 22 }}
          className="rounded-[20px] border-2 border-black bg-white p-3 flex items-center gap-3"
          style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
        >
          <div className="h-12 w-12 rounded-2xl border-2 border-black flex items-center justify-center" style={{ backgroundColor: it.tint, fontSize: 20 }}>
            {it.icon}
          </div>
          <div className="flex-1">
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>{it.name}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <Repeat size={10} className="text-black/55" />
              <span className="text-black/55" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>monthly · auto-split</span>
            </div>
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>{it.amt}</span>
        </motion.div>
      ))}
    </div>
  );
}

function SettleVisual() {
  return (
    <div className="space-y-3">
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="rounded-[22px] border-2 border-black bg-white p-3 flex items-center gap-2"
        style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
      >
        <div className="h-9 w-9 rounded-full border-2 border-black bg-[#FFD84D]" />
        <ArrowRight size={14} />
        <div className="h-9 w-9 rounded-full border-2 border-black bg-[#74FF5A]" />
        <div className="flex-1">
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>Aman → You</div>
          <div className="text-black/55" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>simplified · ₹1,200</div>
        </div>
        <div className="h-8 px-3 rounded-full border-2 border-black bg-[#74FF5A] flex items-center" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11 }}>
          Mark paid
        </div>
      </motion.div>
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-[22px] border-2 border-black p-3 flex items-center gap-3"
        style={{ backgroundColor: "#FFD84D", boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
      >
        <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center">
          <MessageCircleWarning size={16} className="text-[#FFD84D]" />
        </div>
        <div className="flex-1">
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>Nudge 🫣</div>
          <div className="text-black/65" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>auto-WhatsApp the awkward part</div>
        </div>
      </motion.div>
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-[22px] border-2 border-black bg-black p-3 flex items-center gap-3"
        style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
      >
        <div className="h-10 w-10 rounded-xl bg-[#74FF5A] border-2 border-black flex items-center justify-center">
          <Wallet size={16} />
        </div>
        <div className="flex-1 text-white">
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>Pay UPI →</div>
          <div className="text-white/55" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>opens GPay / PhonePe / any app</div>
        </div>
      </motion.div>
    </div>
  );
}

function KarmaVisual() {
  return (
    <div className="rounded-[28px] border-2 border-black bg-[#FFFBF2] p-5 relative overflow-hidden" style={{ boxShadow: "6px 6px 0 0 rgba(0,0,0,1)" }}>
      <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-[#FFD84D] border-2 border-black" />
      <div className="relative flex items-center gap-3">
        <Logo size={56} />
        <div>
          <div className="text-black/55" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em" }}>ROOMIE KARMA</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30, letterSpacing: "-0.03em", lineHeight: 1 }}>92<span className="text-black/40" style={{ fontSize: 14 }}>/100</span></div>
        </div>
      </div>
      <div className="mt-4 h-3 rounded-full bg-black/15 border-2 border-black overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: "92%" }} transition={{ duration: 1.2 }} className="h-full" style={{ background: "linear-gradient(90deg,#74FF5A,#FFD84D)" }} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { ic: <Plus size={14} />, lbl: "12 splits" },
          { ic: <Bell size={14} />, lbl: "0 nudges" },
          { ic: <Sparkles size={14} />, lbl: "Apr Wrap" },
        ].map((s) => (
          <div key={s.lbl} className="h-10 rounded-full border-2 border-black bg-white flex items-center justify-center gap-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11 }}>
            {s.ic} {s.lbl}
          </div>
        ))}
      </div>
    </div>
  );
}
