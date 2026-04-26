import { motion } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { ArrowUpRight, Plus, MoreHorizontal } from "lucide-react";
import { Avatar } from "./Avatar";
import { useStore, groupBurn, simplifyDebts, type Group } from "../store";
import { GroupIcon } from "./GroupIcon";

export function GroupsCarousel({
  onOpenGroup,
  onOpenManage,
  onSettle: _onSettle,
}: {
  onOpenGroup: (id: string) => void;
  onOpenManage: () => void;
  onSettle?: (id: string) => void;
}) {
  const groups = useStore((s) => s.groups);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      const i = Math.round(el.scrollLeft / w);
      setActive(i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (groups.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const currentIdx = Math.round(el.scrollLeft / w);
      const nextIdx = (currentIdx + 1) % groups.length;
      el.scrollTo({ left: nextIdx * w, behavior: "smooth" });
    }, 6000);
    return () => clearInterval(interval);
  }, [groups.length, isPaused]);

  const scrollTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div>
      <div className="flex items-center justify-between px-6 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-black/50"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.14em" }}
          >
            YOUR GROUPS
          </span>
          <span
            className="px-1.5 h-[18px] rounded-full bg-black text-white inline-flex items-center"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10 }}
          >
            {groups.length}
          </span>
        </div>
        <button
          onClick={onOpenManage}
          className="flex items-center gap-1 text-black/55"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 11 }}
        >
          <Plus size={12} /> Manage
        </button>
      </div>

      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="no-scrollbar overflow-x-auto overflow-y-visible snap-x snap-mandatory flex py-4 -my-4"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {groups.map((g) => (
          <div key={g.id} className="shrink-0 w-full px-5 snap-center" style={{ scrollSnapAlign: "center" }}>
            <GroupCard g={g} onOpen={() => onOpenGroup(g.id)} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3">
        {groups.map((g, i) => (
          <button
            key={g.id}
            onClick={() => scrollTo(i)}
            className="h-1.5 rounded-full border border-black/50 transition-all"
            style={{
              width: i === active ? 24 : 8,
              backgroundColor: i === active ? "#000" : "transparent",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function GroupCard({ g, onOpen }: { g: Group; onOpen: () => void }) {
  const [period, setPeriod] = useState<"all"|"daily"|"weekly"|"monthly"|"yearly">("monthly");
  const [offset, setOffset] = useState<number>(0);
  // Subscribe to settlements so we re-render when debts change
  useStore((s) => s.settlements.length);

  const burn = groupBurn(g.id, period, offset);
  const edges = simplifyDebts(g.id);
  const youOwe = edges.filter((e) => e.from === "me").reduce((s, e) => s + e.amount, 0);
  const youGet = edges.filter((e) => e.to === "me").reduce((s, e) => s + e.amount, 0);
  const net = youGet - youOwe;

  const formatPeriod = () => {
    const now = new Date();
    if (period === "monthly") {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    if (period === "weekly") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      // Use a new date object so we don't mutate now incorrectly in consecutive calls if it was re-used
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1) - offset * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    if (period === "daily") {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
      if (offset === 0) return "Today";
      if (offset === 1) return "Yesterday";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return "All Time";
  };

  return (
    <motion.div
      onClick={onOpen}
      whileTap={{ scale: 0.98 }}
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      className="w-full rounded-[28px] border-2 border-black relative overflow-hidden text-left cursor-pointer"
      style={{ backgroundColor: g.bg, boxShadow: "5px 5px 0 0 rgba(0,0,0,1)" }}
    >
      <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full" style={{ backgroundColor: g.accent, opacity: 0.85 }} />

      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-11 w-11 rounded-2xl border-2 border-black bg-white flex items-center justify-center text-black">
              <GroupIcon icon={g.emoji} size={22} />
            </div>
            <div>
              <div className="text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {g.name}
              </div>
              <div className="text-white/65 mt-0.5" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                {g.members.length} members · tap to open
              </div>
            </div>
          </div>
          <div className="h-9 w-9 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center">
            <MoreHorizontal size={16} className="text-white" />
          </div>
        </div>

        <div className="mt-4 relative z-10">
          <div className="flex items-center justify-between mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }} onClick={(e) => e.stopPropagation()}>
            {/* Time Navigation */}
            <div className="flex items-center gap-1.5 bg-black/20 rounded-full border border-white/10 p-1">
              <button onClick={() => setOffset(offset + 1)} className="h-5 w-5 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 text-[10px] transition-colors">◀</button>
              <span className="text-[10px] text-white font-bold uppercase min-w-[70px] text-center tracking-wide">
                {formatPeriod()}
              </span>
              <button onClick={() => setOffset(Math.max(0, offset - 1))} disabled={offset === 0} className={`h-5 w-5 flex items-center justify-center rounded-full text-[10px] transition-colors ${offset === 0 ? "text-white/20" : "text-white/60 hover:text-white hover:bg-white/10"}`}>▶</button>
            </div>

            {/* Time Scale */}
            <div className="flex bg-black/20 rounded-full border border-white/10 p-0.5">
              {(["daily", "weekly", "monthly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); setOffset(0); }}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase transition-colors ${period === p ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
                >
                  {p === "daily" ? "DAILY" : p === "weekly" ? "WEEKLY" : "MONTHLY"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-baseline gap-1 text-white">
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22 }}>₹</span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 44, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {burn.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border-2 border-black bg-black/30 p-2.5">
            <div className="text-white/60" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: "0.1em" }}>
              YOU PAY
            </div>
            <div className="text-white tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", lineHeight: 1, marginTop: 2 }}>
              ₹{youOwe.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-black p-2.5" style={{ backgroundColor: "#74FF5A" }}>
            <div className="text-black/70" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: "0.1em" }}>
              YOU GET
            </div>
            <div className="tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", lineHeight: 1, marginTop: 2 }}>
              ₹{youGet.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex -space-x-2">
            {g.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} name={m.name} color={m.color} size={30} />
            ))}
            {g.members.length > 4 && (
              <div className="h-[30px] w-[30px] rounded-full bg-white border-2 border-black flex items-center justify-center" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10 }}>
                +{g.members.length - 4}
              </div>
            )}
          </div>
          <div
            className="h-10 px-3.5 rounded-full border-2 border-black flex items-center gap-1.5"
            style={{
              backgroundColor: net >= 0 ? "#74FF5A" : "#FFD84D",
              boxShadow: "3px 3px 0 0 rgba(0,0,0,1)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {net > 0
              ? `Collect ₹${net.toLocaleString("en-IN")}`
              : net < 0
              ? `Settle ₹${Math.abs(net).toLocaleString("en-IN")}`
              : `View ledger`}
            <ArrowUpRight size={13} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
