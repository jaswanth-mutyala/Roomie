import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Utensils, Wifi, Home, Sparkles, ShoppingBag, Search, HandCoins, ArrowUpDown, Clock, Users, Info, SlidersHorizontal } from "lucide-react";
import { Avatar } from "./Avatar";
import { useStore, toast } from "../store";

const CAT_INFO: Record<string, { icon: any; tint: string }> = {
  Food: { icon: Utensils, tint: "#74FF5A" },
  Mess: { icon: Utensils, tint: "#74FF5A" },
  Wifi: { icon: Wifi, tint: "#B5A8FF" },
  Groceries: { icon: ShoppingBag, tint: "#FFD84D" },
  Maid: { icon: Sparkles, tint: "#FF5C39" },
  Rent: { icon: Home, tint: "#7B61FF" },
  Travel: { icon: ShoppingBag, tint: "#FFD84D" },
  Stay: { icon: Home, tint: "#7B61FF" },
};

function getCatInfo(cat: string) {
  return CAT_INFO[cat] || { icon: ShoppingBag, tint: "#FFD84D" };
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtFull(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) + " · " + fmtTime(iso);
}

// Group items by date (just the day part)
function dateKey(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

type HistoryItem = {
  id: string;
  date: string;
  icon: any;
  cat: string;
  tint: string;
  title: string;
  groupName: string;
  sub: string;
  amt: number;
  by: string;
  membersStr: string;
  avatar: string;
  // Detail fields
  payerNames: string;
  splitNames: string[];
  perPerson: number;
  splitCount: number;
  type: "bill" | "settle";
  groupId: string;
};

export function HistorySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [sortDesc, setSortDesc] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [detailItem, setDetailItem] = useState<HistoryItem | null>(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "bill" | "settle">("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");

  const bills = useStore((s) => s.bills);
  const settlements = useStore((s) => s.settlements);
  const groups = useStore((s) => s.groups);
  const me = useStore((s) => s.me);

  const rawItems: HistoryItem[] = [
    ...bills.map((b) => {
      const g = groups.find((x) => x.id === b.groupId);
      const payerEntries = Object.entries(b.payers);
      const payerNames = payerEntries.map(([id]) => {
        if (id === "me") return me.name;
        return g?.members.find((m) => m.id === id)?.name || id;
      }).join(", ");
      const mainPayerId = payerEntries[0]?.[0] || "me";
      const mainPayer = mainPayerId === "me" ? me : g?.members.find((m) => m.id === mainPayerId);
      const info = getCatInfo(b.category);
      const splitCount = b.splitAmong.length || 1;
      const perPerson = b.amount / splitCount;

      const membersStr = b.splitAmong.map(uid => {
        if (uid === "me") return me.name;
        return g?.members.find(m => m.id === uid)?.name || "";
      }).join(" ");

      const splitNames = b.splitAmong.map(uid => {
        if (uid === "me") return me.name;
        return g?.members.find(m => m.id === uid)?.name || uid;
      });

      return {
        id: b.id,
        groupId: b.groupId,
        date: b.date,
        icon: info.icon,
        cat: b.category,
        tint: info.tint,
        title: b.title,
        groupName: g?.name || "",
        sub: `Paid by ${payerNames}`,
        amt: b.amount,
        by: mainPayer?.name || "Unknown",
        membersStr,
        avatar: mainPayerId === "me" ? me.color : (mainPayer?.color || "#ccc"),
        payerNames,
        splitNames,
        perPerson: Math.round(perPerson),
        splitCount,
        type: "bill" as const,
      };
    }),
    ...settlements.map((s) => {
      const g = groups.find((x) => x.id === s.groupId);
      const fromName = s.from === "me" ? me.name : g?.members.find((m) => m.id === s.from)?.name || "Unknown";
      const toName = s.to === "me" ? me.name : g?.members.find((m) => m.id === s.to)?.name || "Unknown";
      return {
        id: s.id,
        groupId: s.groupId,
        date: s.date,
        icon: HandCoins,
        cat: "Settle",
        tint: "#74FF5A",
        title: "Settled Up",
        groupName: g?.name || "",
        sub: `${fromName} → ${toName}`,
        amt: s.amount,
        by: fromName,
        membersStr: `${fromName} ${toName}`,
        avatar: "#ccc",
        payerNames: fromName,
        splitNames: [toName],
        perPerson: s.amount,
        splitCount: 1,
        type: "settle" as const,
      };
    }),
  ];

  const filterMonthDate = new Date();
  filterMonthDate.setMonth(filterMonthDate.getMonth() - monthOffset);

  const filteredItems = rawItems.filter((it) => {
    if (monthOffset !== -1) {
      const itDate = new Date(it.date);
      if (itDate.getFullYear() !== filterMonthDate.getFullYear() || itDate.getMonth() !== filterMonthDate.getMonth()) {
        return false;
      }
    }

    const s = search.toLowerCase().trim();
    if (!s && activeCat === "All") return true;

    const matchesSearch = !s || (
      it.title?.toLowerCase()?.includes(s) ||
      it.by?.toLowerCase()?.includes(s) ||
      it.cat?.toLowerCase()?.includes(s) ||
      it.groupName?.toLowerCase()?.includes(s) ||
      it.membersStr?.toLowerCase()?.includes(s)
    );
    const matchesCat = activeCat === "All" || it.cat === activeCat;
    const matchesType = filterType === "all" || it.type === filterType;
    const matchesGroup = filterGroup === "all" || it.groupId === filterGroup;
    return matchesSearch && matchesCat && matchesType && matchesGroup;
  }).sort((a, b) => sortDesc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));

  const grouped: Record<string, HistoryItem[]> = {};
  for (const it of filteredItems) {
    const key = dateKey(it.date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(it);
  }

  const TIMELINE = Object.entries(grouped).map(([key, items]) => ({
    day: fmtDate(items[0].date),
    items,
  }));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 z-40" />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="absolute inset-0 z-50 bg-[#FFFBF2] overflow-hidden"
          >
            <div className="flex flex-col h-full pt-4">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-3">
                <div>
                  <div className="text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.1em" }}>ACTIVITY</div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.1 }}>History</h2>
                </div>
                <button onClick={onClose} className="h-9 w-9 rounded-full bg-white border-2 border-black flex items-center justify-center" style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}>
                  <X size={16} />
                </button>
              </div>

              {/* Search + sort */}
              <div className="px-5 flex items-center gap-2">
                <div className="flex-1 h-12 rounded-full bg-white border-2 border-black flex items-center gap-2 px-4" style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}>
                  <Search size={18} className="text-black/50" />
                  <input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search people, bills, groups..."
                    className="flex-1 bg-transparent outline-none text-black placeholder:text-black/40"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(true)}
                  className="relative h-12 w-12 rounded-full bg-black flex items-center justify-center border-2 border-black active:scale-95 transition-transform"
                  style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
                >
                  <SlidersHorizontal size={18} className="text-white" />
                  {(activeCat !== "All" || monthOffset !== 0 || filterType !== "all" || filterGroup !== "all" || search) && (
                    <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-[#FF5C39] border-2 border-black" />
                  )}
                </button>
              </div>

              {/* Filter pills */}
              <div className="flex px-5 mt-4 items-center gap-3 overflow-x-auto no-scrollbar py-2 shrink-0" style={{ WebkitOverflowScrolling: "touch" }}>
                <div className="relative shrink-0">
                  <select 
                    value={monthOffset}
                    onChange={(e) => setMonthOffset(Number(e.target.value))}
                    className="pl-5 pr-8 h-11 rounded-full border-2 border-black bg-[#B5A8FF] text-black outline-none appearance-none"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(off => {
                       const d = new Date();
                       d.setMonth(d.getMonth() - off);
                       return <option key={off} value={off}>{d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</option>
                    })}
                    <option value={-1}>All Time</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L5 5L9 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <div className="w-0.5 h-6 bg-black/10 shrink-0 mx-1" />

                {["All", "Mess", "Rent", "Wifi", "Groceries", "Maid", "Food", "Travel", "Stay"].map((c) => (
                  <button key={c} onClick={() => setActiveCat(c)}
                    className="shrink-0 px-6 h-11 rounded-full border-2 border-black transition-all active:scale-90 flex items-center justify-center"
                    style={{
                      backgroundColor: activeCat === c ? "#000" : "#fff", color: activeCat === c ? "#fff" : "#000",
                      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14,
                      boxShadow: activeCat === c ? "none" : "3px 3px 0 0 rgba(0,0,0,1)",
                    }}
                  >{c}</button>
                ))}
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto px-5 pt-6 pb-20 no-scrollbar">
                {TIMELINE.map((group) => (
                  <div key={group.day} className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-2 w-2 rounded-full bg-black shrink-0" />
                      <span className="shrink-0" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", color: "#000" }}>{group.day}</span>
                      <div className="flex-1 h-[1.5px] bg-black/10" />
                    </div>
                    <div className="relative pl-4">
                      <div className="absolute left-[3px] top-0 bottom-0 w-[1px] bg-black/10" />
                      <div className="space-y-5">
                        {group.items.map((it, i) => {
                          const Icon = it.icon;
                          const time = fmtTime(it.date);
                          return (
                            <motion.div key={it.id} initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 * i }} className="relative">
                              <div className="absolute -left-[16px] top-[26px] h-2.5 w-2.5 rounded-full border-2 border-black z-10" style={{ backgroundColor: it.tint }} />
                              <div
                                onClick={() => setDetailItem(it)}
                                className="bg-white border-2 border-black rounded-[24px] p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                                style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
                              >
                                <div className="h-12 w-12 rounded-[18px] border-2 border-black flex items-center justify-center shrink-0" style={{ backgroundColor: it.tint }}>
                                  <Icon size={20} className="text-black" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#000" }}>{it.title}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Avatar name={it.by} color={it.avatar} size={16} ring={false} />
                                    <span className="text-black/50 truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>{it.sub}</span>
                                  </div>
                                  {time && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Clock size={10} className="text-black/30" />
                                      <span className="text-black/35" style={{ fontFamily: "'Inter', sans-serif", fontSize: 10 }}>{time}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: "#000" }}>
                                    ₹{it.amt.toLocaleString("en-IN")}
                                  </div>
                                  <div className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-black/5 border border-black/5"
                                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.06em", color: "#000" }}
                                  >{it.cat.toUpperCase()}</div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <Search size={48} className="mb-4" />
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>No matching bills found</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Filter popup */}
          <AnimatePresence>
            {showFilters && (
              <div className="absolute inset-0 z-[60] flex items-center justify-center p-5">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative bg-[#FFFBF2] w-full max-w-sm rounded-[28px] border-4 border-black p-6"
                  style={{ boxShadow: "8px 8px 0 0 rgba(0,0,0,1)" }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>Filters</h3>
                    <button onClick={() => setShowFilters(false)} className="h-8 w-8 rounded-full border-2 border-black flex items-center justify-center bg-white hover:bg-black/5" style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}>
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-5">
                    {/* Sort Order */}
                    <div>
                      <div className="text-black/50 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.1em" }}>SORT ORDER</div>
                      <div className="flex gap-2">
                        <button onClick={() => setSortDesc(true)} className="flex-1 h-10 rounded-full border-2 border-black flex items-center justify-center" style={{ backgroundColor: sortDesc ? "#B5A8FF" : "white", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, boxShadow: sortDesc ? "2px 2px 0 0 rgba(0,0,0,1)" : "none" }}>Newest</button>
                        <button onClick={() => setSortDesc(false)} className="flex-1 h-10 rounded-full border-2 border-black flex items-center justify-center" style={{ backgroundColor: !sortDesc ? "#B5A8FF" : "white", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, boxShadow: !sortDesc ? "2px 2px 0 0 rgba(0,0,0,1)" : "none" }}>Oldest</button>
                      </div>
                    </div>
                    
                    {/* Transaction Type */}
                    <div>
                      <div className="text-black/50 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.1em" }}>TYPE</div>
                      <div className="flex gap-2">
                        <button onClick={() => setFilterType("all")} className="flex-1 h-10 rounded-full border-2 border-black flex items-center justify-center" style={{ backgroundColor: filterType === "all" ? "#FFD84D" : "white", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, boxShadow: filterType === "all" ? "2px 2px 0 0 rgba(0,0,0,1)" : "none" }}>All</button>
                        <button onClick={() => setFilterType("bill")} className="flex-1 h-10 rounded-full border-2 border-black flex items-center justify-center" style={{ backgroundColor: filterType === "bill" ? "#FFD84D" : "white", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, boxShadow: filterType === "bill" ? "2px 2px 0 0 rgba(0,0,0,1)" : "none" }}>Splits</button>
                        <button onClick={() => setFilterType("settle")} className="flex-1 h-10 rounded-full border-2 border-black flex items-center justify-center" style={{ backgroundColor: filterType === "settle" ? "#FFD84D" : "white", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, boxShadow: filterType === "settle" ? "2px 2px 0 0 rgba(0,0,0,1)" : "none" }}>Settles</button>
                      </div>
                    </div>
                    
                    {/* Group */}
                    <div>
                      <div className="text-black/50 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.1em" }}>GROUP</div>
                      <div className="relative">
                        <select 
                          value={filterGroup}
                          onChange={(e) => setFilterGroup(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl border-2 border-black bg-white appearance-none outline-none"
                          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}
                        >
                          <option value="all">All Groups</option>
                          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ArrowUpDown size={14} className="text-black/50" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() => {
                        setSearch("");
                        setActiveCat("All");
                        setMonthOffset(0);
                        setFilterType("all");
                        setFilterGroup("all");
                        setSortDesc(true);
                      }}
                      className="flex-1 h-12 rounded-full border-2 border-black flex items-center justify-center bg-white"
                      style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}
                    >
                      Reset All
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="flex-1 h-12 rounded-full border-2 border-black flex items-center justify-center bg-[#74FF5A]"
                      style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Detail popup */}
          <AnimatePresence>
            {detailItem && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailItem(null)} className="absolute inset-0 bg-black/60 z-[60]" />
                <motion.div
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 32 }}
                  className="absolute bottom-0 left-0 right-0 z-[70] bg-[#FFFBF2] rounded-t-[36px] border-t-2 border-black overflow-hidden"
                  style={{ maxHeight: "80%" }}
                >
                  <DetailView item={detailItem} onClose={() => setDetailItem(null)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

function DetailView({ item, onClose }: { item: HistoryItem; onClose: () => void }) {
  const Icon = item.icon;
  return (
    <div className="flex flex-col">
      <div className="pt-3 pb-2 flex flex-col items-center">
        <div className="h-1.5 w-10 rounded-full bg-black/25" />
      </div>
      <div className="flex items-center justify-between px-5 pb-3">
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>
          {item.type === "bill" ? "Split Details" : "Settlement Details"}
        </span>
        <button onClick={onClose} className="h-8 w-8 rounded-full bg-white border-2 border-black flex items-center justify-center" style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}>
          <X size={14} />
        </button>
      </div>

      <div className="px-5 pb-6 overflow-y-auto">
        {/* Hero card */}
        <div className="rounded-[20px] border-2 border-black p-4 relative overflow-hidden" style={{ backgroundColor: item.tint, boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-[18px] border-2 border-black bg-white flex items-center justify-center shrink-0">
              <Icon size={22} className="text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>{item.title}</div>
              <div className="text-black/55 mt-0.5" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>{item.groupName} · {item.cat}</div>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>₹</span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 38, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {item.amt.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Info rows */}
        <div className="mt-4 rounded-[18px] border-2 border-black bg-white overflow-hidden" style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}>
          {/* Date & Time */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10">
            <div className="h-9 w-9 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
              <Clock size={16} className="text-black/50" />
            </div>
            <div className="flex-1">
              <div className="text-black/45" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em" }}>DATE & TIME</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>{fmtFull(item.date)}</div>
            </div>
          </div>

          {/* Paid by */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10">
            <div className="h-9 w-9 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
              <HandCoins size={16} className="text-black/50" />
            </div>
            <div className="flex-1">
              <div className="text-black/45" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em" }}>
                {item.type === "bill" ? "PAID BY" : "FROM"}
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>{item.payerNames}</div>
            </div>
          </div>

          {/* Split among */}
          {item.type === "bill" && (
            <div className="flex items-start gap-3 px-4 py-3 border-b border-black/10">
              <div className="h-9 w-9 rounded-xl bg-black/5 flex items-center justify-center shrink-0 mt-0.5">
                <Users size={16} className="text-black/50" />
              </div>
              <div className="flex-1">
                <div className="text-black/45" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em" }}>SPLIT AMONG ({item.splitCount})</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {item.splitNames.map((name, i) => (
                    <span key={i} className="inline-block px-3 py-1 rounded-full bg-black/5 border border-black/10" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12 }}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Per person */}
          {item.type === "bill" && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10">
              <div className="h-9 w-9 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                <Info size={16} className="text-black/50" />
              </div>
              <div className="flex-1">
                <div className="text-black/45" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em" }}>PER PERSON</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>₹{item.perPerson.toLocaleString("en-IN")}</div>
              </div>
            </div>
          )}

          {/* Settlement: To */}
          {item.type === "settle" && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10">
              <div className="h-9 w-9 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                <ArrowUpDown size={16} className="text-black/50" />
              </div>
              <div className="flex-1">
                <div className="text-black/45" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em" }}>PAID TO</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>{item.splitNames[0]}</div>
              </div>
            </div>
          )}

          {/* Group */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-9 w-9 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
              <Users size={16} className="text-black/50" />
            </div>
            <div className="flex-1">
              <div className="text-black/45" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em" }}>GROUP</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>{item.groupName || "—"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
