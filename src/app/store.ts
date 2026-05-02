import { useSyncExternalStore } from "react";
import { supabase } from "../lib/supabase";
import { splitEqual } from "../lib/equal_split";

export type Member = {
  id: string;
  name: string;
  color: string;
  upi?: string;
  isMe?: boolean;
};

export type Bill = {
  id: string;
  groupId: string;
  title: string;
  category: string;
  amount: number;
  payers: Record<string, number>;
  splitAmong: string[];
  date: string;
  flag?: BillFlag;
  isEdited?: boolean;
  updatedAt?: string;
};

export type BillFlag = { by: string; reason: string };

export type RecurringBill = {
  id: string;
  groupId: string;
  title: string;
  category: string;
  amount: number;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  day: number;
  paused: boolean;
  payerId: string;
  splitAmong?: string[];
};

export type Settlement = {
  id: string;
  groupId: string;
  from: string;
  to: string;
  amount: number;
  date: string;
  status: 'pending' | 'confirmed' | 'rejected';
};

export type Group = {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  accent: string;
  members: Member[];
  createdAt: string;
};

export type Notification = {
  id: string;
  kind: "info" | "success" | "warn";
  name: string;
  color: string;
  title: string;
  sub: string;
  time: string;
  unread: boolean;
  action?: { type: "bill" | "group" | "settlement"; id: string; groupId?: string };
};

type State = {
  me: { id: string; authId: string; name: string; color: string; upi: string; karma: number; streak: number };
  profile: { notifications: boolean; darkMode: boolean; shareBurn: boolean };
  groups: Group[];
  bills: Bill[];
  recurring: RecurringBill[];
  settlements: Settlement[];
  notifications: Notification[];
  toasts: { id: string; text: string; tint: string }[];
  isLoading?: boolean;
  error?: string | null;
  unreadCount?: number;
};

const me: Member = { id: "", name: "You", color: "#FFD84D", upi: "aarav@okhdfc", isMe: true };

let state: State = {
  me: { id: "me", authId: "", name: "New User", color: "#FFD84D", upi: "aarav@okhdfc", karma: 92, streak: 12 },
  profile: { notifications: true, darkMode: false, shareBurn: true },
  groups: [],
  bills: [],
  recurring: [],
  settlements: [],
  notifications: [],
  toasts: [],
  isLoading: false,
  error: null,
  unreadCount: 0,
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function update(fn: (s: State) => State) {
  state = fn(state);
  notify();
}

export const MONEY_SCALE = 100;
export const AUTO_FORGIVE_THRESHOLD = 1;

function truncateMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.trunc(value * MONEY_SCALE) / MONEY_SCALE;
}

function isForgiven(value: number): boolean {
  return Math.abs(value) < AUTO_FORGIVE_THRESHOLD;
}

function toDbId(id: string): string {
  if (id !== "me") return id;
  return state.me.authId || "me";
}

function toDbPayers(payers: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(payers).map(([id, amount]) => [toDbId(id), amount]),
  );
}

function toDbIds(ids: string[]): string[] {
  return ids.map(toDbId).filter((id, idx, arr) => arr.indexOf(id) === idx);
}

async function saveBillInDb(bill: Bill, isUpdate: boolean) {
  return supabase.rpc("save_bill", {
    p_bill_id: bill.id,
    p_group_id: bill.groupId,
    p_title: bill.title,
    p_category: bill.category,
    p_amount: bill.amount,
    p_date: bill.date,
    p_payers: toDbPayers(bill.payers),
    p_split_among: toDbIds(bill.splitAmong),
    p_is_update: isUpdate,
  });
}

const BILL_FLAG_OVERRIDES_KEY = "roomie.billFlagOverrides.v1";

type BillFlagOverride = BillFlag | null;

function readBillFlagOverrides(): Record<string, BillFlagOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BILL_FLAG_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, BillFlagOverride>;
  } catch {
    return {};
  }
}

function writeBillFlagOverride(billId: string, flag: BillFlagOverride) {
  if (typeof window === "undefined") return;
  const overrides = readBillFlagOverrides();
  overrides[billId] = flag;
  window.localStorage.setItem(BILL_FLAG_OVERRIDES_KEY, JSON.stringify(overrides));
}

function clearBillFlagOverride(billId: string) {
  if (typeof window === "undefined") return;
  const overrides = readBillFlagOverrides();
  delete overrides[billId];
  if (Object.keys(overrides).length === 0) {
    window.localStorage.removeItem(BILL_FLAG_OVERRIDES_KEY);
  } else {
    window.localStorage.setItem(BILL_FLAG_OVERRIDES_KEY, JSON.stringify(overrides));
  }
}

function setBillFlag(bill: Bill, flag?: BillFlag): Bill {
  if (flag) return { ...bill, flag };
  // Create a copy without the flag property
  const newBill = { ...bill };
  delete newBill.flag;
  return newBill;
}

function applyBillFlagOverride(bill: Bill): Bill {
  const overrides = readBillFlagOverrides();
  if (!Object.prototype.hasOwnProperty.call(overrides, bill.id)) return bill;
  const override = overrides[bill.id];
  return override ? setBillFlag(bill, override) : setBillFlag(bill);
}

async function flushBillFlagOverrides() {
  const overrides = readBillFlagOverrides();
  for (const [billId, flag] of Object.entries(overrides)) {
    const payload = flag
      ? { flag_by: toDbId(flag.by), flag_reason: flag.reason }
      : { flag_by: null, flag_reason: null };
    const { error } = await supabase.from("bills").update(payload).eq("id", billId);
    if (!error) {
      clearBillFlagOverride(billId);
    } else {
      console.warn("Bill flag override is still local-only:", error);
    }
  }
}

// --- Offline Queue Logic ---
export type PendingAction = {
  id: string;
  type: "ADD_BILL" | "UPDATE_BILL" | "DELETE_BILL" | "ADD_SETTLEMENT" | "RESOLVE_SETTLEMENT";
  payload: any;
  createdAt: number;
};

const QUEUE_KEY = "roomie-pending-queue";

function getQueue(): PendingAction[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
}

function saveQueue(q: PendingAction[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {}
}

export function pushOfflineAction(action: Omit<PendingAction, "id" | "createdAt">) {
  const q = getQueue();
  q.push({ ...action, id: "q" + Date.now() + Math.floor(Math.random()*1000), createdAt: Date.now() });
  saveQueue(q);
}

let isProcessingQueue = false;

export async function processOfflineQueue() {
  if (isProcessingQueue || typeof navigator === "undefined" || !navigator.onLine) return;
  isProcessingQueue = true;
  
  try {
    const q = getQueue();
    if (q.length === 0) return;

    const remaining = [...q];
    let changed = false;

    for (const action of q) {
      let success = false;
      try {
        if (action.type === "ADD_BILL" || action.type === "UPDATE_BILL") {
          const res = await saveBillInDb(action.payload, action.type === "UPDATE_BILL");
          if (!res.error || !res.error.message.includes("Failed to fetch")) success = true;
        } else if (action.type === "DELETE_BILL") {
          const res = await supabase.from("bills").delete().eq("id", action.payload);
          if (!res.error || !res.error.message.includes("Failed to fetch")) success = true;
        } else if (action.type === "ADD_SETTLEMENT") {
          const res = await supabase.from("settlements").insert(action.payload);
          if (!res.error || !res.error.message.includes("Failed to fetch")) success = true;
        } else if (action.type === "RESOLVE_SETTLEMENT") {
          const res = await supabase.from("settlements").update({ status: action.payload.status }).eq("id", action.payload.id);
          if (!res.error || !res.error.message.includes("Failed to fetch")) success = true;
        }
      } catch (err) {
        console.error("Queue error:", err);
      }

      if (success) {
        const idx = remaining.findIndex(a => a.id === action.id);
        if (idx >= 0) remaining.splice(idx, 1);
        changed = true;
      } else {
        break;
      }
    }

    if (changed) saveQueue(remaining);
  } finally {
    isProcessingQueue = false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", processOfflineQueue);
}
// ----------------------------

export const actions = {
  setMe: (id: string, email?: string) => {
    update(s => ({
      ...s,
      me: { ...s.me, id: "me", authId: id, name: email ? email.split("@")[0] : s.me.name },
    }));
  },
  hydrateStore: (data: Partial<State> | ((s: State) => Partial<State>)) => {
    update((s) => ({ ...s, ...(typeof data === "function" ? data(s) : data) }));
  },
  addGroup: async (data: Omit<Group, "id" | "createdAt" | "members"> & { members?: Member[] }) => {
    const id = "g" + Date.now();
    const members: Member[] = [
      { id: "me", name: state.me.name, color: state.me.color, upi: state.me.upi, isMe: true },
      ...(data.members || []),
    ];

    // Push to Supabase first
    const res1 = await supabase.from("groups").insert({ id, name: data.name, emoji: data.emoji, bg: data.bg, accent: data.accent });
    if (res1.error) { toast("DB Error: " + res1.error.message, "#FF5C39"); return null; }

    const res2 = await supabase.from("users").upsert(members.map(m => ({ id: toDbId(m.id), name: m.name, color: m.color, upi: m.upi })));
    if (res2.error) { toast("DB Error: " + res2.error.message, "#FF5C39"); return null; }

    const resSelf = await supabase.from("group_members").insert({ group_id: id, user_id: toDbId("me") });
    if (resSelf.error) { toast("DB Error: " + resSelf.error.message, "#FF5C39"); return null; }

    const otherMembers = members.filter(m => m.id !== "me").map(m => ({ group_id: id, user_id: toDbId(m.id) }));
    const res3 = otherMembers.length > 0
      ? await supabase.from("group_members").insert(otherMembers)
      : { error: null };
    if (res3.error) { toast("DB Error: " + res3.error.message, "#FF5C39"); return null; }

    update((s) => ({
      ...s,
      groups: [
        ...s.groups,
        {
          id,
          createdAt: new Date().toISOString(),
          members,
          ...data,
        } as Group,
      ],
    }));
    toast("Group created 🎉", "#74FF5A");
    return id;
  },
  deleteGroup: async (id: string) => {
    const res = await supabase.from("groups").delete().eq("id", id);
    if (res.error) { toast("DB Error: " + res.error.message, "#FF5C39"); return; }

    update((s) => ({
      ...s,
      groups: s.groups.filter((g) => g.id !== id),
      bills: s.bills.filter((b) => b.groupId !== id),
      recurring: s.recurring.filter((r) => r.groupId !== id),
    }));
    toast("Group deleted", "#FF5C39");
  },  joinGroup: async (codeOrId: string) => {
    let groupId = codeOrId.trim();
    // parse RM-XXXX42 into gXXXX format
    if (groupId.toUpperCase().startsWith("RM-") && groupId.endsWith("42")) {
      const rawNum = groupId.substring(3, groupId.length - 2);
      groupId = "g" + rawNum.toLowerCase();
    } else if (groupId.includes("?join=")) {
      try {
        const url = new URL(groupId);
        groupId = url.searchParams.get("join") || groupId;
      } catch (e) {
        groupId = groupId.split("?join=")[1].split("&")[0] || groupId;
      }
    }

    if (state.groups.some(g => g.id === groupId)) {
      toast("You are already in this group!", "#FFD84D");
      return groupId;
    }

    // Attempt to join first because RLS restricts viewing groups they aren't part of
    const res = await supabase.from("group_members").insert({ group_id: groupId, user_id: toDbId("me") });
    
    // 23505 = already exists, 23503 = foreign key violation (group does not exist)
    if (res.error && res.error.code !== "23505") {
      if (res.error.code === "23503") {
        toast("Invalid code or group not found.", "#FF5C39");
      } else {
        toast("DB Error: " + res.error.message, "#FF5C39");
      }
      return null;
    }

    // Now that we're a member, we can fetch the group info (RLS will permit this)
    const { data: gData, error: gError } = await supabase.from("groups").select("name").eq("id", groupId).single();
    
    await actions.sync();
    toast(`Joined ${gData?.name || "group"} 🎉`, "#74FF5A");
    return groupId;
  },  exitGroup: async (id: string) => {
    const res = await supabase.from("group_members").delete().eq("group_id", id).eq("user_id", toDbId("me"));
    if (res.error) { toast("DB Error: " + res.error.message, "#FF5C39"); return; }

    update((s) => ({
      ...s,
      groups: s.groups.filter((g) => g.id !== id),
      bills: s.bills.filter((b) => b.groupId !== id),
      recurring: s.recurring.filter((r) => r.groupId !== id),
    }));
    toast("Left group", "#FFD84D");
  },
  searchUsers: async (query: string) => {
    if (!query.trim()) return [];
    const res = await supabase
      .from("users")
      .select("id, name, color, upi")
      .or(`name.ilike.%${query}%,id.ilike.%${query}%`)
      .limit(5);
    
    if (res.error) {
      console.error(res.error);
      return [];
    }
    return res.data as Member[];
  },
  addExistingMember: async (groupId: string, member: Member) => {
    const res = await supabase.from("group_members").insert({ group_id: groupId, user_id: member.id });
    if (res.error) {
      // If it's a unique violation, they might already be in the group
      if (res.error.code !== "23505") {
        toast("DB Error: " + res.error.message, "#FF5C39");
      } else {
        toast(`${member.name} is already in the group!`, "#FFD84D");
      }
      return;
    }

    update((s) => ({
      ...s,
      groups: s.groups.map(g => g.id === groupId ? {
        ...g,
        members: [...g.members, member]
      } : g)
    }));
    toast(`Added ${member.name} 🎉`, "#74FF5A");
  },
  addMember: async (groupId: string, name: string) => {
    const colors = ["#FF5C39", "#74FF5A", "#FFD84D", "#B5A8FF", "#FF9FB8", "#6EE7C7"];
    const id = name.toLowerCase().replace(/\s+/g, "") + Date.now().toString().slice(-4);
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Push to Supabase first
    const res1 = await supabase.from("users").upsert({ id, name, color });
    if (res1.error) { toast("DB Error: " + res1.error.message, "#FF5C39"); return; }
    
    const res2 = await supabase.from("group_members").insert({ group_id: groupId, user_id: id });
    if (res2.error) { toast("DB Error: " + res2.error.message, "#FF5C39"); return; }

    update((s) => ({
      ...s,
      groups: s.groups.map(g => g.id === groupId ? {
        ...g,
        members: [...g.members, { id, name, color }]
      } : g)
    }));
    toast(`Added ${name} 🎉`, "#74FF5A");
  },
  addBill: async (b: Omit<Bill, "id" | "date">) => {
    const bill: Bill = { ...b, id: "b" + Date.now(), date: new Date().toISOString() };
    const group = state.groups.find(g => g.id === b.groupId);
    
    update((s) => ({ ...s, bills: [bill, ...s.bills] }));

    try {
      const res = await saveBillInDb(bill, false);
      if (res.error) throw res.error;
      toast(`Split ₹${b.amount} — done 💸`, "#74FF5A");
    } catch (e: any) {
      if (e.message?.includes("Failed to fetch") || !navigator.onLine) {
        pushOfflineAction({ type: "ADD_BILL", payload: bill });
        toast(`Split ₹${b.amount} (Saved offline)`, "#FFD84D");
      } else {
        toast("DB Error: " + e.message, "#FF5C39");
        update((s) => ({ ...s, bills: s.bills.filter(x => x.id !== bill.id) }));
      }
    }
    const groupMembers = group?.members || [];
    const myId = state.me.id;
    groupMembers.forEach(m => {
      actions.pushNotification({
        kind: "info",
        name: state.me.name,
        color: state.me.color,
        title: "added " + b.title,
        sub: "₹" + b.amount.toLocaleString() + " · " + (group?.name || "Group"),
        action: { type: "bill", id: bill.id, groupId: b.groupId },
      }, m.id);
    });
  },
  updateBill: async (id: string, b: Omit<Bill, "id" | "date">) => {
    const group = state.groups.find(g => g.id === b.groupId);
    const existing = state.bills.find((bill) => bill.id === id);
    if (!existing) return;
    const bill: Bill = {
      ...b,
      id,
      date: existing.date,
      flag: existing.flag,
    };

    update((s) => ({
      ...s,
      bills: s.bills.map((bill) => bill.id === id ? { ...bill, ...b, isEdited: true, updatedAt: new Date().toISOString() } : bill),
    }));

    try {
      const res = await saveBillInDb(bill, true);
      if (res.error) throw res.error;
      toast(`Updated ${b.title} 📝`, "#74FF5A");
    } catch (e: any) {
      if (e.message?.includes("Failed to fetch") || !navigator.onLine) {
        pushOfflineAction({ type: "UPDATE_BILL", payload: bill });
        toast(`Updated ${b.title} (Saved offline)`, "#FFD84D");
      } else {
        toast("DB Error: " + e.message, "#FF5C39");
        update((s) => ({
          ...s,
          bills: s.bills.map((bill) => bill.id === id ? existing : bill),
        }));
      }
    }
    const groupMembers = group?.members || [];
    const myId = state.me.id;
    groupMembers.forEach(m => {
      actions.pushNotification({
        kind: "info",
        name: state.me.name,
        color: state.me.color,
        title: "updated " + b.title,
        sub: "₹" + b.amount.toLocaleString() + " · " + (group?.name || "Group"),
        action: { type: "bill", id, groupId: b.groupId },
      }, m.id);
    });
  },
  deleteBill: async (id: string) => {
    const existing = state.bills.find(b => b.id === id);
    update((s) => ({
      ...s,
      bills: s.bills.filter((b) => b.id !== id),
    }));

    try {
      const res = await supabase.from("bills").delete().eq("id", id);
      if (res.error) throw res.error;
      toast("Split deleted 🗑️", "#FF5C39");
    } catch (e: any) {
      if (e.message?.includes("Failed to fetch") || !navigator.onLine) {
        pushOfflineAction({ type: "DELETE_BILL", payload: id });
        toast("Split deleted (Saved offline)", "#FFD84D");
      } else {
        toast("DB Error: " + e.message, "#FF5C39");
        if (existing) update((s) => ({ ...s, bills: [...s.bills, existing] }));
      }
    }
  },
  flagBill: async (billId: string, reason: string) => {
    console.log("Flagging bill:", billId, reason);
    const cleanReason = reason.trim();
    if (!cleanReason) return;
    const flag: BillFlag = { by: "me", reason: cleanReason };
    update(s => ({
      ...s,
      bills: s.bills.map(b => b.id === billId ? setBillFlag(b, flag) : b)
    }));
    const { error } = await supabase
      .from("bills")
      .update({ flag_by: toDbId("me"), flag_reason: cleanReason })
      .eq("id", billId);
    if (error) {
      console.warn("DB Flag Error:", error);
      writeBillFlagOverride(billId, flag);
      toast("Flag saved locally (Sync error)", "#FFD84D");
      return;
    }
    console.log("Bill flag synced to DB");
    clearBillFlagOverride(billId);
  },
  unflagBill: async (billId: string) => {
    console.log("Unflagging bill:", billId);
    update(s => ({
      ...s,
      bills: s.bills.map(b => b.id === billId ? setBillFlag(b) : b)
    }));
    const { error } = await supabase
      .from("bills")
      .update({ flag_by: null, flag_reason: null })
      .eq("id", billId);
    if (error) {
      console.warn("DB Resolve Error:", error);
      writeBillFlagOverride(billId, null);
      toast("Resolved locally (Sync error)", "#FFD84D");
      return;
    }
    console.log("Bill resolution synced to DB");
    clearBillFlagOverride(billId);
  },
  settle: async (groupId: string, from: string, to: string, amount: number) => {
    const normalizedAmount = truncateMoney(amount);
    if (normalizedAmount < AUTO_FORGIVE_THRESHOLD) {
      toast("Tiny balance auto-forgiven (< ₹1)", "#FFD84D");
      return;
    }

    const id = "s" + Date.now();
    const date = new Date().toISOString();
    const payload = { id, group_id: groupId, from_user: toDbId(from), to_user: toDbId(to), amount: normalizedAmount, date, status: 'pending' };

    update((s) => ({
      ...s,
      settlements: [
        ...s.settlements,
        { id, groupId, from, to, amount: normalizedAmount, date, status: 'pending' as const },
      ],
    }));

    const toMember = state.groups.flatMap((g) => g.members).find((m) => m.id === to);

    try {
      const res = await supabase.from("settlements").insert(payload);
      if (res.error) throw res.error;
      toast(`Pending: Marked ₹${normalizedAmount.toFixed(2)} as paid to ${toMember?.name || "them"}`, "#FFF85A");
    } catch (e: any) {
      if (e.message?.includes("Failed to fetch") || !navigator.onLine) {
        pushOfflineAction({ type: "ADD_SETTLEMENT", payload });
        toast(`Marked as paid (Saved offline)`, "#FFD84D");
      } else {
        toast("DB Error: " + e.message, "#FF5C39");
        update((s) => ({ ...s, settlements: s.settlements.filter(x => x.id !== id) }));
        return;
      }
    }
    actions.pushNotification({
      kind: "info",
      name: state.me.name,
      color: state.me.color,
      title: "Marked ₹" + normalizedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " as paid",
      sub: "Please confirm you received it in " + (state.groups.find(g => g.id === groupId)?.name || "group"),
      action: { type: "settlement", id, groupId }
    }, to);
  },
  confirmSettlement: async (id: string, status: 'confirmed' | 'rejected') => {
    const existing = state.settlements.find(s => s.id === id);
    update((s) => ({
      ...s,
      settlements: s.settlements.map((sett) => (sett.id === id ? { ...sett, status } : sett)),
    }));

    try {
      const res = await supabase.from("settlements").update({ status }).eq("id", id);
      if (res.error) throw res.error;
      toast(status === 'confirmed' ? "Payment confirmed" : "Payment rejected", status === 'confirmed' ? "#74FF5A" : "#FF5C39");
    } catch (e: any) {
      if (e.message?.includes("Failed to fetch") || !navigator.onLine) {
        pushOfflineAction({ type: "RESOLVE_SETTLEMENT", payload: { id, status } });
        toast(`Status updated (Saved offline)`, "#FFD84D");
      } else {
        toast("DB Error: " + e.message, "#FF5C39");
        if (existing) {
          update((s) => ({
            ...s,
            settlements: s.settlements.map((sett) => (sett.id === id ? existing : sett)),
          }));
        }
        return;
      }
    }
    const set = state.settlements.find(s => s.id === id);
    if (set) {
        actions.pushNotification({
          kind: status === 'confirmed' ? "success" : "warn",
          name: state.me.name,
          color: state.me.color,
          title: status === 'confirmed' ? "Payment recipient confirmed" : "Payment rejected",
          sub: `For ₹${set.amount}`,
        }, set.from);
    }
  },
  toggleRecurring: async (id: string) => {
    const r = state.recurring.find(x => x.id === id);
    if (!r) return;
    
    // Push to Supabase first
    const res = await supabase.from("recurring_bills").update({ paused: !r.paused }).eq("id", id);
    if (res.error) { toast("DB Error: " + res.error.message, "#FF5C39"); return; }
    
    update((s) => ({
      ...s,
      recurring: s.recurring.map((r) => (r.id === id ? { ...r, paused: !r.paused } : r)),
    }));
  },
  deleteRecurring: async (id: string) => {
    // Push to Supabase first
    const res = await supabase.from("recurring_bills").delete().eq("id", id);
    if (res.error) { toast("DB Error: " + res.error.message, "#FF5C39"); return; }

    update((s) => ({ ...s, recurring: s.recurring.filter((r) => r.id !== id) }));
    toast("Recurring bill deleted", "#FF5C39");
  },
  addRecurring: async (r: Omit<RecurringBill, "id">) => {
    const bill: RecurringBill = { ...r, id: "r" + Date.now() };

    // Also create an initial one-time bill for the current period so it shows in history/category burn
    const group = state.groups.find((g) => g.id === r.groupId);
    const splitAmong = r.splitAmong || (group ? group.members.map((m) => m.id) : [r.payerId]);
    const onTimeBill: Bill = {
      id: "b" + Date.now(),
      groupId: r.groupId,
      title: r.title,
      category: r.category,
      amount: r.amount,
      payers: { [r.payerId]: r.amount },
      splitAmong,
      date: new Date().toISOString().slice(0, 10),
    };

    // Push both to Supabase first
    const res1 = await supabase.from("recurring_bills").insert({ id: bill.id, group_id: bill.groupId, title: bill.title, category: bill.category, amount: bill.amount, frequency: bill.frequency, day: bill.day, paused: bill.paused, payer_id: toDbId(bill.payerId) });
    if (res1.error) { toast("DB Error: " + res1.error.message, "#FF5C39"); return; }

    const res2 = await saveBillInDb(onTimeBill, false);
    if (res2.error) { toast("DB Error: " + res2.error.message, "#FF5C39"); return; }

    update((s) => ({
      ...s,
      recurring: [bill, ...s.recurring],
      bills: [onTimeBill, ...s.bills],
    }));
    toast(`Added ${r.title} to autopilot 🚀`, "#B5A8FF");
  },
  updateProfile: (patch: Partial<State["profile"]>) => {
    update((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  },
  setUpi: (upi: string) => {
    update((s) => ({ ...s, me: { ...s.me, upi } }));
    toast("UPI updated ✓", "#74FF5A");
  },
  dismissToast: (id: string) => {
    update((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) }));
  },
  markNotifsRead: async () => {
    update((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, unread: false })) }));
    const myId = state.me.id;
    await supabase.from("notifications").update({ unread: false }).eq("user_id", myId);
  },
  pushNotification: async (n: Omit<Notification, "id" | "time" | "unread">, forUserId: string) => {
    try {
      const dbUserId = toDbId(forUserId);
      const { data, error } = await supabase.from("notifications").insert([{
        user_id: dbUserId,
        kind: n.kind,
        name: n.name,
        color: n.color,
        title: n.title,
        sub: n.sub,
        time: new Date().toISOString(),
        unread: true,
        action_type: n.action?.type,
        action_id: n.action?.id,
        action_group_id: n.action?.groupId
      }]).select().single();

      if (error) console.error("Error pushing notification:", error);
    } catch (err) {
      console.error(err);
    }
  },
  sync: async () => {
    try {
      const [
        { data: groupsData },
        { data: usersData },
        { data: membersData },
        { data: billsData },
        { data: payersData },
        { data: splitsData },
        { data: settlementsData },
        { data: recurringData },
        { data: notificationsData }
      ] = await Promise.all([
        supabase.from("groups").select("*"),
        supabase.from("users").select("*"),
        supabase.from("group_members").select("*"),
        supabase.from("bills").select("*"),
        supabase.from("bill_payers").select("*"),
        supabase.from("bill_splits").select("*"),
        supabase.from("settlements").select("*"),
        supabase.from("recurring_bills").select("*"),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }),
      ]);

      // If we got nothing back, don't wipe local state
      if (!groupsData || groupsData.length === 0) {
        console.log("Sync: No groups found in DB, keeping local state");
        return;
      }

      // Build a mapping: DB user ID -> internal "me" key.
      const meAuthId = state.me.authId;
      const meUser = (usersData || []).find(u => meAuthId && u.id === meAuthId) || (usersData || []).find(u => u.is_me === true);
      const mapId = (id: string) => {
        if (id === "me") return "me";
        if (meAuthId && id === meAuthId) return "me";
        if (meUser && id === meUser.id) return "me";
        return id;
      };

      const newGroups: Group[] = groupsData.map(g => ({
        id: g.id,
        name: g.name,
        emoji: g.emoji,
        bg: g.bg,
        accent: g.accent,
        createdAt: g.created_at,
        members: Array.from(new Map(
          ((membersData || [])
          .filter(m => m.group_id === g.id)
          .map(m => {
            const u = (usersData || []).find(x => x.id === m.user_id);
            const mappedId = mapId(m.user_id);
            return {
              id: mappedId,
              name: u?.name || "Unknown",
              color: u?.color || "#ccc",
              upi: u?.upi,
              isMe: mappedId === "me"
            };
          }))
          .map((member) => [member.id, member])
        ).values())
      }));

      // Ensure "me" is in every group — if not found, add from state
      for (const g of newGroups) {
        if (!g.members.find(m => m.id === "me")) {
          g.members.unshift({
            id: "me",
            name: state.me.name,
            color: state.me.color,
            upi: state.me.upi,
            isMe: true
          });
        }
      }

      const newBills: Bill[] = (billsData || []).map(b => {
        const flag = b.flag_reason
          ? { by: mapId(b.flag_by || "me"), reason: String(b.flag_reason) }
          : undefined;

        return applyBillFlagOverride({
          id: b.id,
          groupId: b.group_id,
          title: b.title,
          category: b.category,
          amount: Number(b.amount),
          date: b.date,
          payers: (payersData || [])
            .filter(p => p.bill_id === b.id)
            .reduce((acc, p) => {
              const uid = mapId(p.user_id);
              acc[uid] = (acc[uid] || 0) + Number(p.amount_paid || 0);
              return acc;
            }, {} as Record<string, number>),
          splitAmong: (splitsData || [])
            .filter(s => s.bill_id === b.id)
            .map(s => mapId(s.user_id))
            .filter((id, idx, arr) => arr.indexOf(id) === idx),
          flag,
        });
      });

      const newSettlements: Settlement[] = (settlementsData || []).map(s => ({
        id: s.id,
        groupId: s.group_id,
        from: mapId(s.from_user),
        to: mapId(s.to_user),
        amount: Number(s.amount),
        date: s.date,
        status: s.status || "pending"
      }));

      const newRecurring: RecurringBill[] = (recurringData || []).map(r => ({
        id: r.id,
        groupId: r.group_id,
        title: r.title,
        category: r.category,
        amount: r.amount,
        frequency: r.frequency,
        day: r.day,
        paused: r.paused,
        payerId: mapId(r.payer_id)
      }));

      // Merge: keep local-only items (IDs not in DB) and add DB items
      const dbBillIds = new Set(newBills.map(b => b.id));
      const localOnlyBills = state.bills.filter(b => !dbBillIds.has(b.id));

      const dbSettlementIds = new Set(newSettlements.map(s => s.id));
      const localOnlySettlements = state.settlements.filter(s => !dbSettlementIds.has(s.id));

      const dbGroupIds = new Set(newGroups.map(g => g.id));
      const localOnlyGroups = state.groups.filter(g => !dbGroupIds.has(g.id));

      const dbRecurringIds = new Set(newRecurring.map(r => r.id));
      const localOnlyRecurring = state.recurring.filter(r => !dbRecurringIds.has(r.id));

      const newNotifications: Notification[] = (notificationsData || []).map((n: any) => ({
        id: n.id,
        kind: n.kind,
        name: n.name,
        color: n.color,
        title: n.title,
        sub: n.sub,
        time: n.time || n.created_at,
        unread: n.unread,
        action: n.action_type ? { type: n.action_type, id: n.action_id, groupId: n.action_group_id } : undefined,
      }));

      update(s => ({
        ...s,
        groups: [...newGroups, ...localOnlyGroups],
        bills: [...newBills, ...localOnlyBills],
        settlements: [...newSettlements, ...localOnlySettlements],
        recurring: [...newRecurring, ...localOnlyRecurring],
        notifications: newNotifications,
      }));

      await flushBillFlagOverrides();

      console.log("Store synced with Supabase:", {
        groups: newGroups.length,
        bills: newBills.length,
        settlements: newSettlements.length,
        recurring: newRecurring.length,
        notifications: newNotifications.length
      });
    } catch (e) {
      console.error("Sync error:", e);
    }
  },
  subscribeNotifications: (authId: string) => {
    if (!authId) return;
    console.log("Subscribing to notifications for:", authId);
    
    const channel = supabase.channel(`notifications:${authId}`)
      .on("postgres_changes", 
        { 
          event: "INSERT", 
          schema: "public", 
          table: "notifications", 
          filter: `user_id=eq.${authId}` 
        }, 
        (payload) => {
          console.log("New notification received:", payload);
          const n = payload.new;
          const notif: Notification = {
            id: n.id,
            kind: n.kind,
            name: n.name,
            color: n.color,
            title: n.title,
            sub: n.sub,
            time: n.time || n.created_at,
            unread: n.unread,
            action: n.action_type ? { type: n.action_type, id: n.action_id, groupId: n.action_group_id } : undefined,
          };
          update(s => ({ ...s, notifications: [notif, ...s.notifications] }));
          
          if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
            new window.Notification(notif.title, { body: notif.sub });
          }

          // Trigger a full sync when we get a notification to pull new bills/splits
          actions.sync();
        }
      )
      .subscribe((status) => {
        console.log("Notification subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

function toast(text: string, tint: string) {
  const id = "t" + Date.now();
  update((s) => ({ ...s, toasts: [...s.toasts, { id, text, tint }] }));
  setTimeout(() => actions.dismissToast(id), 2500);
}

export { toast };

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => selector(state),
    () => selector(state),
  );
}

// --- Selectors ---
export function getGroup(id: string) {
  return state.groups.find((g) => g.id === id);
}

export function groupBills(groupId: string) {
  return state.bills.filter((b) => b.groupId === groupId);
}

export function groupBurn(groupId: string, period: "all" | "daily" | "weekly" | "monthly" | "yearly" = "all", offset: number = 0) {
  let bills = groupBills(groupId);

  if (period !== "all") {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (period === "monthly") {
      start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
    } else if (period === "weekly") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff - (offset * 7)));
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (period === "daily") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
      end = new Date(start);
    } else if (period === "yearly") {
      start = new Date(now.getFullYear() - offset, 0, 1);
      end = new Date(now.getFullYear() - offset, 11, 31);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    bills = bills.filter(b => {
      const d = new Date(b.date);
      return d >= start && d <= end;
    });
  }

  return bills.reduce((s, b) => s + b.amount, 0);
}

export function netFor(groupId: string, memberId: string): number {
  const bills = groupBills(groupId);
  let net = 0;
  for (const b of bills) {
    const paid = truncateMoney(b.payers[memberId] || 0);
    let share = 0;
    if (b.splitAmong.length > 0) {
      const idx = b.splitAmong.indexOf(memberId);
      if (idx >= 0) share = splitEqual(b.amount, b.splitAmong.length)[idx];
    }
    net = truncateMoney(net + (paid - share));
  }
  // Settlements: "from" paid money to "to"
  // If I am "from": I paid, so my debt decreases → net goes UP
  // If I am "to": I received, so what's owed to me decreases → net goes DOWN
  for (const s of state.settlements.filter((x) => x.groupId === groupId && x.status !== 'rejected')) {
    const amt = truncateMoney(s.amount);
    if (s.from === memberId) net = truncateMoney(net + amt);
    if (s.to === memberId) net = truncateMoney(net - amt);
  }
  return isForgiven(net) ? 0 : net;
}

export type DebtEdge = {
  from: string;
  fromName: string;
  fromColor: string;
  to: string;
  toName: string;
  toColor: string;
  amount: number;
};

type DebtBalance = { id: string; name: string; color: string; net: number };

function buildDebtEdges(balances: DebtBalance[]): DebtEdge[] {
  const creditors = balances
    .filter((b) => b.net >= AUTO_FORGIVE_THRESHOLD)
    .map((b) => ({ ...b, net: truncateMoney(b.net) }));

  const debtors = balances
    .filter((b) => b.net <= -AUTO_FORGIVE_THRESHOLD)
    .map((b) => ({ ...b, net: truncateMoney(Math.abs(b.net)) }));

  const result: DebtEdge[] = [];
  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const debtor = debtors[debtorIdx];
    const creditor = creditors[creditorIdx];

    const amount = truncateMoney(Math.min(debtor.net, creditor.net));
    if (amount >= AUTO_FORGIVE_THRESHOLD) {
      result.push({
        from: debtor.id,
        fromName: debtor.name,
        fromColor: debtor.color,
        to: creditor.id,
        toName: creditor.name,
        toColor: creditor.color,
        amount,
      });
    }

    debtor.net = truncateMoney(debtor.net - amount);
    creditor.net = truncateMoney(creditor.net - amount);

    if (debtor.net < AUTO_FORGIVE_THRESHOLD) debtorIdx++;
    if (creditor.net < AUTO_FORGIVE_THRESHOLD) creditorIdx++;
  }

  return result;
}

export function simplifyDebts(groupId: string): DebtEdge[] {
  const g = getGroup(groupId);
  if (!g || g.members.length === 0) return [];

  const balances = g.members.map((m) => ({
    id: m.id,
    name: m.name,
    color: m.color,
    net: truncateMoney(netFor(groupId, m.id)),
  }));

  return buildDebtEdges(balances);
}

export function getBillEdges(b: Bill, g: Group): DebtEdge[] {
  const shares = b.splitAmong.length > 0 ? splitEqual(b.amount, b.splitAmong.length) : [];

  const nets: { id: string, name: string, color: string, net: number }[] = [];

  for (const m of g.members) {
    const paid = truncateMoney(b.payers[m.id] || 0);
    const idx = b.splitAmong.indexOf(m.id);
    const share = idx >= 0 ? shares[idx] : 0;
    nets.push({ id: m.id, name: m.name, color: m.color, net: truncateMoney(paid - share) });
  }

  for (const [id, paid] of Object.entries(b.payers)) {
    if (!g.members.find(m => m.id === id)) {
      const idx = b.splitAmong.indexOf(id);
      const share = idx >= 0 ? shares[idx] : 0;
      nets.push({ id, name: id === "me" ? "You" : id, color: "#ccc", net: truncateMoney(paid - share) });
    }
  }

  return buildDebtEdges(nets);
}

export function youOweAcrossGroups() {
  const result: { groupId: string; groupName: string; to: string; toName: string; toColor: string; amount: number }[] = [];
  for (const g of state.groups) {
    const edges = simplifyDebts(g.id).filter((e) => e.from === "me");
    for (const e of edges) {
      result.push({ groupId: g.id, groupName: g.name, to: e.to, toName: e.toName, toColor: e.toColor, amount: e.amount });
    }
  }
  return result;
}

export function owedToYouAcrossGroups() {
  const result: { groupId: string; groupName: string; from: string; fromName: string; fromColor: string; amount: number }[] = [];
  for (const g of state.groups) {
    const edges = simplifyDebts(g.id).filter((e) => e.to === "me");
    for (const e of edges) {
      result.push({ groupId: g.id, groupName: g.name, from: e.from, fromName: e.fromName, fromColor: e.fromColor, amount: e.amount });
    }
  }
  return result;
}
