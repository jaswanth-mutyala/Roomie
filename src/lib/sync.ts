import { supabase } from "./supabase";
import { actions, Group, Bill, Settlement, RecurringBill, Member } from "../app/store";

export async function initialFetch() {
  console.log("Fetching data from Supabase...");

  // 1. Fetch Users
  const { data: users } = await supabase.from("users").select("*");
  // 2. Fetch Groups & Members
  const { data: groupsData } = await supabase.from("groups").select("*");
  const { data: groupMembers } = await supabase.from("group_members").select("*");
  
  // 3. Fetch Bills, Payers, Splits
  const { data: billsData } = await supabase.from("bills").select("*");
  const { data: billPayers } = await supabase.from("bill_payers").select("*");
  const { data: billSplits } = await supabase.from("bill_splits").select("*");
  
  // 4. Fetch Settlements & Recurring
  const { data: settlementsData } = await supabase.from("settlements").select("*");
  const { data: recurringData } = await supabase.from("recurring_bills").select("*");

  if (!groupsData) return;

  // Reconstruct Groups
  const reconstructedGroups: Group[] = groupsData.map((g: any) => {
    const memberIds = groupMembers?.filter((gm: any) => gm.group_id === g.id).map((gm: any) => gm.user_id) || [];
    const members: Member[] = memberIds.map((id: string) => {
      const u = users?.find((u: any) => u.id === id);
      return { id, name: u?.name || "Unknown", color: u?.color || "#ccc", upi: u?.upi, isMe: u?.is_me };
    });
    return { id: g.id, name: g.name, emoji: g.emoji, bg: g.bg, accent: g.accent, members, createdAt: g.created_at };
  });

  // Reconstruct Bills
  const reconstructedBills: Bill[] = (billsData || []).map((b: any) => {
    const payersObj: Record<string, number> = {};
    const payersForBill = billPayers?.filter((bp: any) => bp.bill_id === b.id) || [];
    for (const p of payersForBill) {
      payersObj[p.user_id] = Number(p.amount_paid);
    }
    const splitAmong = billSplits?.filter((bs: any) => bs.bill_id === b.id).map((bs: any) => bs.user_id) || [];
    
    return {
      id: b.id,
      groupId: b.group_id,
      title: b.title,
      category: b.category,
      amount: Number(b.amount),
      date: b.date,
      payers: payersObj,
      splitAmong,
      flag: b.flag_reason ? { by: b.flag_by || "me", reason: String(b.flag_reason) } : undefined,
    };
  });

  // Reconstruct Settlements
  const reconstructedSettlements: Settlement[] = (settlementsData || []).map((s: any) => ({
    id: s.id,
    groupId: s.group_id,
    from: s.from_user,
    to: s.to_user,
    amount: Number(s.amount),
    date: s.date,
  }));

  // Reconstruct Recurring
  const reconstructedRecurring: RecurringBill[] = (recurringData || []).map((r: any) => ({
    id: r.id,
    groupId: r.group_id,
    title: r.title,
    category: r.category,
    amount: Number(r.amount),
    frequency: r.frequency as any,
    day: r.day,
    paused: r.paused,
    payerId: r.payer_id,
  }));

  // Find the 'me' user
  const meUser = users?.find(u => u.is_me);

  const hydrateData: Partial<any> = {
    groups: reconstructedGroups,
    bills: reconstructedBills,
    settlements: reconstructedSettlements,
    recurring: reconstructedRecurring,
  };

  if (meUser) {
    hydrateData.me = { id: meUser.id, name: meUser.name, color: meUser.color, upi: meUser.upi, isMe: true, karma: meUser.karma, streak: meUser.streak };
  } else {
    // If 'me' is missing in Supabase, let's insert it so future operations work!
    supabase.from("users").insert({ id: "me", name: "You", color: "#FFD84D", upi: "aarav@okhdfc", is_me: true }).then();
  }

  // Dispatch all to store
  actions.hydrateStore(hydrateData);
}
