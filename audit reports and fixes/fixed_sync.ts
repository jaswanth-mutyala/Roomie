import { supabase } from "./supabase";
import { actions, Group, Bill, Settlement, RecurringBill, Member, useStore } from "../app/store";
import { toast } from "sonner";

let notificationChannel: ReturnType<typeof supabase.channel> | null = null;

export async function initialFetch() {
  console.log("Fetching data from Supabase...");

  useStore.setState(s => ({ ...s, isLoading: true, error: null }));

  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      throw new Error("Authentication required. Please sign in.");
    }

    const currentUserId = session.user.id;

    const [
      { data: users, error: usersError },
      { data: groupsData, error: groupsError },
      { data: groupMembers, error: membersError },
      { data: billsData, error: billsError },
      { data: billPayers, error: payersError },
      { data: billSplits, error: splitsError },
      { data: settlementsData, error: settlementsError },
      { data: recurringData, error: recurringError },
      { data: notificationsData, error: notifError }
    ] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("groups").select("*"),
      supabase.from("group_members").select("*"),
      supabase.from("bills").select("*"),
      supabase.from("bill_payers").select("*"),
      supabase.from("bill_splits").select("*"),
      supabase.from("settlements").select("*"),
      supabase.from("recurring_bills").select("*"),
      supabase.from("notifications").select("*").order("created_at", { ascending: false })
    ]);

    if (usersError) throw new Error(`Users fetch failed: ${usersError.message}`);
    if (groupsError) throw new Error(`Groups fetch failed: ${groupsError.message}`);
    if (membersError) throw new Error(`Members fetch failed: ${membersError.message}`);
    if (billsError) throw new Error(`Bills fetch failed: ${billsError.message}`);
    if (payersError) throw new Error(`Payers fetch failed: ${payersError.message}`);
    if (splitsError) throw new Error(`Splits fetch failed: ${splitsError.message}`);
    if (settlementsError) throw new Error(`Settlements fetch failed: ${settlementsError.message}`);
    if (recurringError) throw new Error(`Recurring fetch failed: ${recurringError.message}`);
    if (notifError) throw new Error(`Notifications fetch failed: ${notifError.message}`);

    if (!groupsData) {
      useStore.setState(s => ({ ...s, isLoading: false }));
      return;
    }

    const reconstructedGroups: Group[] = groupsData.map((g: any) => {
      const memberIds = groupMembers?.filter((gm: any) => gm.group_id === g.id).map((gm: any) => gm.user_id) || [];
      const members: Member[] = memberIds.map((id: string) => {
        const u = users?.find((u: any) => u.id === id);
        return { 
          id, 
          name: u?.name || "Unknown", 
          color: u?.color || "#ccc", 
          upi: u?.upi, 
          isMe: u?.id === currentUserId 
        };
      });
      return { id: g.id, name: g.name, emoji: g.emoji, bg: g.bg, accent: g.accent, members, createdAt: g.created_at };
    });

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
        flag: b.flag_reason ? { by: b.flag_by || currentUserId, reason: String(b.flag_reason) } : undefined,
      };
    });

    const reconstructedSettlements: Settlement[] = (settlementsData || []).map((s: any) => ({
      id: s.id,
      groupId: s.group_id,
      from: s.from_user,
      to: s.to_user,
      amount: Number(s.amount),
      date: s.date,
    }));

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

    const reconstructedNotifications = (notificationsData || []).map((n: any) => ({
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

    const meUser = users?.find(u => u.id === currentUserId);

    if (notificationChannel) {
      await supabase.removeChannel(notificationChannel);
      notificationChannel = null;
    }

    if (meUser) {
      notificationChannel = supabase
        .channel("my_notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${meUser.id}` },
          (payload) => {
            const n = payload.new;
            const notif = {
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
            useStore.setState(s => ({ 
              ...s, 
              notifications: [notif, ...s.notifications],
              unreadCount: (s.unreadCount || 0) + 1
            }));
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") console.log("Realtime notifications subscribed");
          if (status === "CHANNEL_ERROR") {
            console.error("Realtime subscription error");
            toast.error("Notification connection failed");
          }
        });
    }

    const hydrateData: Partial<any> = {
      groups: reconstructedGroups,
      bills: reconstructedBills,
      settlements: reconstructedSettlements,
      recurring: reconstructedRecurring,
      notifications: reconstructedNotifications,
      isLoading: false,
      error: null,
    };

    if (meUser) {
      hydrateData.me = { 
        id: meUser.id, 
        name: meUser.name, 
        color: meUser.color, 
        upi: meUser.upi, 
        isMe: true, 
        karma: meUser.karma, 
        streak: meUser.streak 
      };
    }

    actions.hydrateStore(hydrateData);

  } catch (error) {
    console.error("Initial fetch failed:", error);
    useStore.setState(s => ({ 
      ...s, 
      isLoading: false, 
      error: error instanceof Error ? error.message : "Failed to load data" 
    }));
    toast.error(error instanceof Error ? error.message : "Failed to load data");
  }
}

export function cleanupSync() {
  if (notificationChannel) {
    supabase.removeChannel(notificationChannel);
    notificationChannel = null;
  }
}
