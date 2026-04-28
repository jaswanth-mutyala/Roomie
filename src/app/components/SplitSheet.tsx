import { motion, AnimatePresence } from "motion/react"; // split-sheet
import { X, Delete, Camera, Tag, Users, ChevronDown, Check, Plus, Repeat } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { Avatar } from "./Avatar";
import { SwipeToSplit } from "./SwipeToSplit";
import { useStore, actions } from "../store";
import { GroupIcon } from "./GroupIcon";

const DEFAULT_CATEGORIES = ["Mess", "Wifi", "Rent", "Maid", "Groceries", "Food", "Travel", "Stay"];

/** Returns "#000" or "#fff" based on perceived luminance of a hex bg color */
function textForBg(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  // Perceived luminance formula (sRGB weighted)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#000" : "#fff";
}

/** Returns a muted version of the text color for secondary/dimmed text */
function mutedForBg(hex: string): string {
  return textForBg(hex) === "#000" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)";
}

export function SplitSheet({
  open,
  onClose,
  onScan,
  initialGroupId,
  editBillId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onScan?: () => void;
  initialGroupId?: string | null;
  editBillId?: string | null;
  onSuccess?: () => void;
}) {
  const groups = useStore((s) => s.groups);
  const meId = useStore((s) => s.me.id);
  const billToEdit = useStore((s) => s.bills.find((b) => b.id === editBillId));
  const [amount, setAmount] = useState("1000");
  const [groupId, setGroupId] = useState(groups[0]?.id || "");
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const [payerPickerOpen, setPayerPickerOpen] = useState(false);
  const [category, setCategory] = useState("Mess");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [title, setTitle] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [recurringDay, setRecurringDay] = useState<number | "">("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (scrollRef.current) {
      setStartX(e.pageX - scrollRef.current.offsetLeft);
      setScrollLeft(scrollRef.current.scrollLeft);
    }
  };
  const endDrag = () => setIsDragging(false);
  const onDrag = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft - (x - startX) * 1.5;
  };

  const group = groups.find((g) => g.id === groupId) || groups[0];
  const fg = group ? textForBg(group.bg) : "#fff";
  const muted = group ? mutedForBg(group.bg) : "rgba(255,255,255,0.6)";
  const isDark = fg === "#fff"; // true when bg is dark, text is white
  const [selected, setSelected] = useState<string[]>(group?.members.map((m) => m.id) || []);
  const [payers, setPayers] = useState<Record<string, string>>({ [meId]: "0" });

  useEffect(() => {
    if (open) {
      if (billToEdit) {
        setAmount(String(billToEdit.amount));
        const stringifiedPayers: Record<string, string> = {};
        for (const [k, v] of Object.entries(billToEdit.payers)) {
          stringifiedPayers[k] = String(v);
        }
        setPayers(stringifiedPayers);
        setGroupId(billToEdit.groupId);
        setSelected(billToEdit.splitAmong);
        setTitle(billToEdit.title);
        setCategory(billToEdit.category);
        setIsRecurring(false);
      } else {
        setAmount("0");
        setPayers({ [meId]: "0" });
        setIsRecurring(false);
        setFrequency("monthly");
        setRecurringDay("");
        setTitle("");
        const gId = initialGroupId || groups[0]?.id;
        if (gId) {
          setGroupId(gId);
          const g = groups.find((x) => x.id === gId);
          if (g) setSelected(g.members.map((m) => m.id));
        }
      }
    } else {
      // Reset selected when sheet closes so next open starts fresh
      setSelected([]);
    }
  }, [open, initialGroupId, billToEdit, groups]);

  const total = Number(amount) || 0;
  const chosen = group ? group.members.filter((m) => selected.includes(m.id)) : [];
  const perHead = chosen.length ? total / chosen.length : 0;

  const paidSum = Object.values(payers).reduce((s, v) => s + (Number(v) || 0), 0);
  const paidMatches = Math.abs(paidSum - total) < 0.5;

  const netPerMember = useMemo(() => {
    if (!group) return [];
    return group.members.map((m) => {
      const paid = Number(payers[m.id]) || 0;
      const share = selected.includes(m.id) ? perHead : 0;
      return { ...m, paid, share, net: paid - share };
    });
  }, [group, payers, perHead, selected]);

  const press = (k: string) => {
    setAmount((a) => {
      let next = a;
      if (k === "del") next = a.length > 1 ? a.slice(0, -1) : "0";
      else if (k === ".") next = a.includes(".") ? a : a + ".";
      else next = a === "0" ? k : a + k;
      setPayers((p) => {
        const ids = Object.keys(p);
        if (ids.length === 1) return { [ids[0]]: next };
        return p;
      });
      return next;
    });
  };

  const toggleMember = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const switchGroup = (id: string) => {
    const g = groups.find((x) => x.id === id)!;
    setGroupId(id);
    setSelected(g.members.map((m) => m.id));
    setPayers({ me: String(total) });
    setGroupPickerOpen(false);
  };

  const togglePayer = (id: string) => {
    setPayers((p) => {
      const next = { ...p };
      if (id in next) delete next[id];
      else next[id] = "0";
      const ids = Object.keys(next);
      if (ids.length === 1) next[ids[0]] = String(total);
      return next;
    });
  };

  const setPayerAmt = (id: string, v: string) => {
    setPayers((p) => ({ ...p, [id]: v.replace(/[^0-9.]/g, "") }));
  };

  const payerIds = Object.keys(payers);
  const payerLabel = !group
    ? "You"
    : payerIds.length === 1
      ? group.members.find((m) => m.id === payerIds[0])?.name || "You"
      : `${payerIds.length} people`;

  const commit = async () => {
    if (!group || total <= 0 || chosen.length === 0 || !paidMatches) return;
    const payerMap: Record<string, number> = {};
    for (const [id, v] of Object.entries(payers)) {
      const n = Number(v) || 0;
      if (n > 0) payerMap[id] = n;
    }
    const billTitle = title.trim() || `${category} — ${group.name}`;
    const mainPayerId = Object.keys(payerMap)[0] || meId;

    if (billToEdit) {
      await actions.updateBill(billToEdit.id, {
        groupId: group.id,
        title: billTitle,
        category,
        amount: total,
        payers: payerMap,
        splitAmong: selected,
      });
    } else if (isRecurring) {
      // Save as recurring bill
      await actions.addRecurring({
        groupId: group.id,
        title: billTitle,
        category,
        amount: total,
        frequency,
        day: Number(recurringDay) || 1,
        paused: false,
        payerId: mainPayerId,
        splitAmong: selected,
      });
    } else {
      // Save as one-time bill
      await actions.addBill({
        groupId: group.id,
        title: billTitle,
        category,
        amount: total,
        payers: payerMap,
        splitAmong: selected,
      });
    }
    setTitle("");
    onClose();
    onSuccess?.();
  };

  if (!group) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 z-40" />
      )}
      {open && (
        <motion.div
          key="sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="absolute inset-0 z-50 overflow-hidden flex flex-col"
          style={{ backgroundColor: group.bg, transition: "background-color 0.3s" }}
          onClick={() => setKeyboardOpen(false)}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
            <button onClick={onClose} className="h-10 w-10 rounded-full bg-black flex items-center justify-center border-2 border-black">
              <X size={16} className="text-white" />
            </button>
            <span style={{ color: fg, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>
              {billToEdit ? "Edit Split" : "New Split"}
            </span>
            <div className="w-10" />
          </div>

          <div className="px-5 pb-2 shrink-0">
            <button
              onClick={() => setGroupPickerOpen(true)}
              className="w-full rounded-[20px] border-2 border-black flex items-center gap-3 p-2.5 pr-4"
              style={{ backgroundColor: group.accent || "#FFD84D", boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", transition: "background-color 0.3s" }}
            >
              <div className="h-11 w-11 rounded-2xl border-2 border-black bg-white flex items-center justify-center shrink-0 text-black">
                <GroupIcon icon={group.emoji} size={22} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-black/60" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.14em" }}>
                  SPLITTING IN
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  {group.name}
                </div>
              </div>
              <div className="h-9 px-3 rounded-full bg-black text-white flex items-center gap-1" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11 }}>
                Change <ChevronDown size={12} />
              </div>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="px-6 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setKeyboardOpen(true);
                }}
                className="flex items-baseline gap-1 w-full text-left"
                style={{ color: fg }}
              >
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30 }}>₹</span>
                <motion.span
                  key={amount}
                  initial={{ scale: 1.08 }}
                  animate={{ scale: 1 }}
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 64, letterSpacing: "-0.05em", lineHeight: 1 }}
                >
                  {amount}
                </motion.span>
              </button>
              <div className="mt-1" style={{ color: muted, fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                ₹{perHead ? perHead.toFixed(0) : 0} per person · {chosen.length} people
              </div>
            </div>

            <div className="px-5 mt-3">
              <input
                value={title}
                onFocus={() => setKeyboardOpen(false)}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${category} — add a title`}
                className="w-full h-11 rounded-full border-2 border-black px-4 outline-none"
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)", color: fg, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13 }}
              />
            </div>

            <div className="px-5 mt-3">
              <button
                onClick={() => setPayerPickerOpen(true)}
                className="w-full rounded-[18px] border-2 border-black backdrop-blur p-3 flex items-center gap-3"
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)" }}
              >
                <div className="h-9 w-9 rounded-xl bg-black flex items-center justify-center">
                  <Users size={14} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div style={{ color: muted, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.1em" }}>
                    PAID BY
                  </div>
                  <div style={{ color: fg, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, lineHeight: 1.1 }}>
                    {payerLabel}
                    {!paidMatches && (
                      <span className="ml-2 text-[#FFD84D]" style={{ fontSize: 11 }}>
                        · ₹{(total - paidSum).toFixed(0)} off
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown size={16} style={{ color: muted }} />
              </button>
            </div>

            <div
              ref={scrollRef}
              onMouseDown={startDrag}
              onMouseLeave={endDrag}
              onMouseUp={endDrag}
              onMouseMove={onDrag}
              className={`flex items-center gap-2 overflow-x-auto overflow-y-visible no-scrollbar py-2 -my-2 px-5 mt-3 ${isDragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
            >
              <Tag size={14} style={{ color: muted }} className="shrink-0" />
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="shrink-0 px-3 h-8 rounded-full border-2 border-black"
                  style={{
                    backgroundColor: category === c ? "#74FF5A" : (isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)"),
                    color: category === c ? "#000" : fg,
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {c}
                </button>
              ))}
              <button
                onClick={() => {
                  const newTag = prompt("Enter new category name:");
                  if (newTag && newTag.trim() && !categories.includes(newTag.trim())) {
                    const cleanTag = newTag.trim();
                    setCategories([...categories, cleanTag]);
                    setCategory(cleanTag);
                  }
                }}
                className="shrink-0 px-3 h-8 rounded-full border-2 flex items-center gap-1.5"
                style={{
                  borderColor: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)",
                  color: fg,
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <Plus size={12} /> Add
              </button>
              {/* Spacer to ensure right padding isn't cut off when scrolling */}
              <div className="w-1 shrink-0" />
            </div>

            <div className="px-5 mt-4">
              <div className="mb-2" style={{ color: muted, fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Split between · {group.name}
              </div>
              {/* Vertical padding prevents tick badge from clipping against scroll bounds */}
              <div className="flex items-start gap-2 overflow-x-auto overflow-y-visible no-scrollbar py-3 -my-1 px-1">
                {group.members.map((r) => {
                  const active = selected.includes(r.id);
                  const isYou = r.id === meId;
                  return (
                    <button key={r.id} onClick={() => toggleMember(r.id)} className="shrink-0 flex flex-col items-center gap-1 relative" style={{ width: 64 }}>
                      <div className="relative">
                        <div style={{ opacity: active ? 1 : 0.35 }}>
                          <Avatar name={r.name} color={r.color} size={44} />
                        </div>
                        {active && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#74FF5A] border-2 border-black flex items-center justify-center">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className="text-center w-full truncate" style={{ color: fg, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 10, opacity: active ? 1 : 0.5 }}>
                        {isYou ? "You" : r.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {total > 0 && chosen.length > 0 && (
              <div className="px-5 mt-2 mb-4">
                <div className="mb-2" style={{ color: muted, fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Who gets what
                </div>
                <div className="rounded-[18px] border-2 border-black backdrop-blur overflow-hidden" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)", borderColor: isDark ? undefined : "rgba(0,0,0,0.3)" }}>
                  {netPerMember
                    .filter((m) => m.paid > 0 || m.share > 0)
                    .map((m) => (
                      <div key={m.id} className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
                        <Avatar name={m.name} color={m.color} size={26} ring={false} />
                        <span className="flex-1" style={{ color: fg, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12 }}>
                          {m.id === meId ? `${m.name} (You)` : m.name}
                        </span>
                        <span style={{ color: muted, fontFamily: "'Inter', sans-serif", fontSize: 10 }}>
                          paid ₹{m.paid.toFixed(0)} · owes ₹{m.share.toFixed(0)}
                        </span>
                        <span
                          className="tabular-nums"
                          style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 700,
                            fontSize: 13,
                            color: m.net > 0.5 ? "#16a34a" : m.net < -0.5 ? "#dc2626" : fg,
                          }}
                        >
                          {m.net > 0.5 ? `+₹${m.net.toFixed(0)}` : m.net < -0.5 ? `−₹${Math.abs(m.net).toFixed(0)}` : "·"}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div
            className="bg-[#FFFBF2] rounded-t-[28px] border-t-2 border-black p-4 pb-6 shrink-0 transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {keyboardOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="grid grid-cols-3 gap-2 pb-1"
              >
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"].map((k) => (
                  <motion.button
                    key={k}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => press(k)}
                    className="h-[48px] rounded-2xl border-2 border-black bg-white flex items-center justify-center"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
                  >
                    {k === "del" ? <Delete size={18} /> : k}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Recurring Toggle — visible only when keyboard is closed */}
            {!keyboardOpen && (
              <div className="mb-3">
                <div className="flex items-center justify-between rounded-2xl border-2 border-black bg-white px-4 h-12" style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}>
                  <div className="flex items-center gap-2">
                    <Repeat size={15} className="text-black/60" />
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>
                      Make it recurring
                    </span>
                  </div>
                  <button
                    onClick={() => setIsRecurring((v) => !v)}
                    className="relative h-6 w-11 rounded-full border-2 border-black transition-colors"
                    style={{ backgroundColor: isRecurring ? "#B5A8FF" : "#e5e5e5" }}
                  >
                    <span
                      className="absolute top-0.5 h-4 w-4 rounded-full bg-white border-2 border-black transition-all"
                      style={{ left: isRecurring ? "22px" : "2px" }}
                    />
                  </button>
                </div>

                {/* Frequency config (shown when toggled on) */}
                <AnimatePresence>
                  {isRecurring && (
                    <motion.div
                      key="freq-config"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 rounded-2xl border-2 border-black bg-[#F5F0FF] p-3 space-y-3" style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}>
                        <div>
                          <div className="text-black/50 mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.1em" }}>REPEAT</div>
                          <div className="flex gap-2">
                            {(["daily", "weekly", "monthly", "yearly"] as const).map((f) => (
                              <button
                                key={f}
                                onClick={() => setFrequency(f)}
                                className="flex-1 h-8 rounded-full border-2 border-black capitalize"
                                style={{
                                  backgroundColor: frequency === f ? "#B5A8FF" : "#fff",
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  fontWeight: 700,
                                  fontSize: 10,
                                  boxShadow: frequency === f ? "2px 2px 0 0 rgba(0,0,0,1)" : "none",
                                }}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-black/50 mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.1em" }}>
                            {frequency === "weekly" ? "ON DAY (1=Mon, 7=Sun)" : frequency === "monthly" ? "ON DATE" : frequency === "yearly" ? "MONTH (1–12)" : "EVERY N DAYS"}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setRecurringDay((d) => (d === "" ? 1 : Math.max(1, typeof d === "number" ? d - 1 : 1)))}
                              className="h-8 w-8 rounded-full border-2 border-black bg-white flex items-center justify-center"
                              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
                            >−</button>
                            <input
                              type="number"
                              value={recurringDay}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRecurringDay(val === "" ? "" : isNaN(Number(val)) ? 1 : Number(val));
                              }}
                              placeholder="1"
                              className="flex-1 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center tabular-nums text-center outline-none placeholder:text-black/30"
                              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15 }}
                            />
                            <button
                              onClick={() => setRecurringDay((d) => (d === "" ? 1 : Math.min(31, typeof d === "number" ? d + 1 : 1)))}
                              className="h-8 w-8 rounded-full border-2 border-black bg-white flex items-center justify-center"
                              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
                            >+</button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={onScan}
                className="h-[56px] w-[56px] rounded-full bg-black border-2 border-black flex items-center justify-center shrink-0"
              >
                <Camera size={20} className="text-white" />
              </button>
              <div className="flex-1">
                <SwipeToSplit disabled={!paidMatches || total <= 0 || chosen.length === 0 || !title.trim() || (isRecurring && recurringDay === "")} label={billToEdit ? "Swipe to update" : isRecurring ? "Swipe to schedule" : "Swipe to split"} onComplete={commit} color={isRecurring ? "#B5A8FF" : "#74FF5A"} />
              </div>
            </div>
          </div>

          {/* Group picker sheet */}
          <AnimatePresence>
            {groupPickerOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setGroupPickerOpen(false)} className="absolute inset-0 bg-black/50 z-[55]" />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  className="absolute bottom-0 left-0 right-0 z-[56] bg-[#FFFBF2] rounded-t-[28px] border-t-2 border-black p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
                      Pick a group
                    </h3>
                    <button onClick={() => setGroupPickerOpen(false)} className="h-8 w-8 rounded-full border-2 border-black bg-white flex items-center justify-center">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => switchGroup(g.id)}
                        className="w-full rounded-[18px] border-2 border-black bg-white p-3 flex items-center gap-3 text-left"
                        style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
                      >
                        <div className="h-11 w-11 rounded-xl border-2 border-black flex items-center justify-center text-white" style={{ backgroundColor: g.bg }}>
                          <GroupIcon icon={g.emoji} size={22} />
                        </div>
                        <div className="flex-1">
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>{g.name}</div>
                          <div className="text-black/55" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                            {g.members.length} members
                          </div>
                        </div>
                        {groupId === g.id && (
                          <div className="h-6 w-6 rounded-full bg-[#74FF5A] border-2 border-black flex items-center justify-center">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Payer picker sheet */}
          <AnimatePresence>
            {payerPickerOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPayerPickerOpen(false)} className="absolute inset-0 bg-black/50 z-[55]" />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  className="absolute bottom-0 left-0 right-0 z-[56] bg-[#FFFBF2] rounded-t-[28px] border-t-2 border-black p-5 max-h-[85%] overflow-y-auto no-scrollbar"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
                      Who paid?
                    </h3>
                    <button onClick={() => setPayerPickerOpen(false)} className="h-8 w-8 rounded-full border-2 border-black bg-white flex items-center justify-center">
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-black/55 mb-3" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                    Tap to add payers. Amounts must total ₹{total}.
                  </p>
                  <div className="space-y-2">
                    {group.members.map((m) => {
                      const selectedPayer = m.id in payers;
                      return (
                        <div
                          key={m.id}
                          className="rounded-[18px] border-2 border-black bg-white p-3 flex items-center gap-3"
                          style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
                        >
                          <button onClick={() => togglePayer(m.id)} className="flex items-center gap-3 flex-1 text-left">
                            <div style={{ opacity: selectedPayer ? 1 : 0.35 }}>
                              <Avatar name={m.name} color={m.color} size={40} />
                            </div>
                            <div>
                              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>
                                {m.id === meId ? `${m.name} (You)` : m.name}
                              </div>
                              <div className="text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                                {selectedPayer ? "tap to remove" : "tap to add as payer"}
                              </div>
                            </div>
                          </button>
                          {selectedPayer && (
                            <div className="flex items-center gap-1 bg-black/5 rounded-full px-2 py-1 border border-black/10">
                              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>₹</span>
                              <input
                                inputMode="numeric"
                                value={payers[m.id]}
                                onChange={(e) => setPayerAmt(m.id, e.target.value)}
                                className="bg-transparent outline-none w-16 text-right tabular-nums"
                                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-full border-2 border-black bg-white px-4 h-12" style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12 }}>
                      Paid total
                    </span>
                    <span
                      className="tabular-nums"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        fontSize: 16,
                        color: paidMatches ? "#16a34a" : "#FF5C39",
                      }}
                    >
                      ₹{paidSum.toFixed(0)} / ₹{total}
                    </span>
                  </div>
                  <button
                    onClick={() => setPayerPickerOpen(false)}
                    disabled={!paidMatches}
                    className="mt-3 w-full h-[56px] rounded-full border-2 border-black flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: paidMatches ? "#74FF5A" : "#ddd",
                      boxShadow: paidMatches ? "4px 4px 0 0 rgba(0,0,0,1)" : "none",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      opacity: paidMatches ? 1 : 0.6,
                    }}
                  >
                    {paidMatches ? "Looks good ✓" : `Adjust ₹${Math.abs(total - paidSum).toFixed(0)} to continue`}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

