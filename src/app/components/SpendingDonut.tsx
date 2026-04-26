import { motion } from "motion/react";
import { useMemo } from "react";
import { useStore } from "../store";

const CATEGORY_COLORS: Record<string, string> = {
  Rent: "#7B61FF",
  Mess: "#74FF5A",
  Wifi: "#B5A8FF",
  Groceries: "#FFD84D",
  Food: "#FFD84D",
  Travel: "#6EE7C7",
  Stay: "#FF9FB8",
  Maid: "#FF5C39",
  Other: "#BBBBBB",
};

export function SpendingDonut({ size = 108 }: { size?: number } = {}) {
  const bills = useStore((s) => s.bills);

  // Compute per-category totals from live bills
  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const b of bills) {
      totals[b.category] = (totals[b.category] || 0) + b.amount;
    }
    const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);
    if (grandTotal === 0) return [];

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([label, amt]) => ({
        label,
        pct: Math.round((amt / grandTotal) * 100),
        color: CATEGORY_COLORS[label] || CATEGORY_COLORS.Other,
        amt,
      }));
  }, [bills]);

  const grandTotal = useMemo(() => bills.reduce((s, b) => s + b.amount, 0), [bills]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 15;
  const C = 2 * Math.PI * r;

  // Format total nicely
  const totalLabel = grandTotal >= 1000
    ? `₹${(grandTotal / 1000).toFixed(1)}k`
    : `₹${grandTotal.toFixed(0)}`;

  // Fall back UI when no bills
  if (data.length === 0) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={cx} cy={cy} r={r} stroke="#00000010" strokeWidth={14} fill="none" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, textAlign: "center", color: "#999" }}>No data</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 text-black/40" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
          Add a split to see category breakdown
        </div>
      </div>
    );
  }

  let acc = 0;

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} stroke="#00000010" strokeWidth={14} fill="none" />
          {data.map((d, i) => {
            const len = (d.pct / 100) * C;
            const off = acc;
            acc += len;
            return (
              <motion.circle
                key={d.label}
                cx={cx}
                cy={cy}
                r={r}
                stroke={d.color}
                strokeWidth={14}
                fill="none"
                strokeDasharray={`${len} ${C}`}
                initial={{ strokeDashoffset: -off, opacity: 0 }}
                animate={{ strokeDashoffset: -off, opacity: 1 }}
                transition={{ delay: 0.1 * i, duration: 0.6 }}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-black/50" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: "0.12em" }}>
            TOTAL
          </span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {totalLabel}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        {data.slice(0, 4).map((d, i) => (
          <motion.div
            key={d.label}
            initial={{ x: 8, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 * i + 0.3 }}
            className="flex items-center gap-1.5"
          >
            <div className="h-2 w-2 rounded-sm border border-black shrink-0" style={{ backgroundColor: d.color }} />
            <span className="flex-1 truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: 10.5 }}>{d.label}</span>
            <span className="tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10.5 }}>{d.pct}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
