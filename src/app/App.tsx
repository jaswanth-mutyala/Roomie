import { lazy, Suspense, useEffect, useState } from "react";
import "../styles/fonts.css";
import { Dashboard } from "./components/Dashboard";
import { WelcomeTour } from "./components/WelcomeTour";
import { Toasts } from "./components/Toasts";
import { PushBanner } from "./components/PushBanner";
import { LoginPage } from "./components/LoginPage";
import { supabase } from "../lib/supabase";
import { actions } from "./store";
import type { Session } from "@supabase/supabase-js";
import type { BurstKind } from "./components/SuccessBurst";

const SplitSheet = lazy(() => import("./components/SplitSheet").then((m) => ({ default: m.SplitSheet })));
const SettleSheet = lazy(() => import("./components/SettleSheet").then((m) => ({ default: m.SettleSheet })));
const HistorySheet = lazy(() => import("./components/HistorySheet").then((m) => ({ default: m.HistorySheet })));
const ScanSheet = lazy(() => import("./components/ScanSheet").then((m) => ({ default: m.ScanSheet })));
const WrapUpSheet = lazy(() => import("./components/WrapUpSheet").then((m) => ({ default: m.WrapUpSheet })));
const Onboarding = lazy(() => import("./components/Onboarding").then((m) => ({ default: m.Onboarding })));
const ProfileSheet = lazy(() => import("./components/ProfileSheet").then((m) => ({ default: m.ProfileSheet })));
const RecurringSheet = lazy(() => import("./components/RecurringSheet").then((m) => ({ default: m.RecurringSheet })));
const NudgeSheet = lazy(() => import("./components/NudgeSheet").then((m) => ({ default: m.NudgeSheet })));
const NotificationsSheet = lazy(() => import("./components/NotificationsSheet").then((m) => ({ default: m.NotificationsSheet })));
const GroupsSheet = lazy(() => import("./components/GroupsSheet").then((m) => ({ default: m.GroupsSheet })));
const GroupDetailSheet = lazy(() => import("./components/GroupDetailSheet").then((m) => ({ default: m.GroupDetailSheet })));
const SuccessBurst = lazy(() => import("./components/SuccessBurst").then((m) => ({ default: m.SuccessBurst })));

type SheetKey =
  | "split"
  | "history"
  | "scan"
  | "wrap"
  | "profile"
  | "recurring"
  | "nudge"
  | "notifications"
  | "groups"
  | null;

function readStoredBool(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeStoredBool(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value ? "true" : "false");
  } catch {
    // Non-critical preference persistence can fail in private or restricted contexts.
  }
}

export default function App() {
  const [tourDone, setTourDone] = useState(() => readStoredBool("roomie.tourDone.v1"));
  const [onboarded, setOnboarded] = useState(false);
  const [sheet, setSheet] = useState<SheetKey>(null);
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null);
  const [settleCtx, setSettleCtx] = useState<{ groupId: string; memberId: string } | null>(null);
  const [splitGroupId, setSplitGroupId] = useState<string | null>(null);
  const [editBillId, setEditBillId] = useState<string | null>(null);
  const [nudgeCtx, setNudgeCtx] = useState<{ memberId: string; amount: number } | null>(null);
  const [burst, setBurst] = useState<BurstKind | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = (nextSession: Session | null) => {
    setSession(nextSession);
    setOnboarded(nextSession?.user ? readStoredBool(`roomie.onboarded.${nextSession.user.id}.v1`) : false);
    if (nextSession?.user) {
      actions.setMe(nextSession.user.id, nextSession.user.email);
      actions.sync();
    }
  };

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      applySession(session);
      setLoading(false);
      
      // Check if we came from a password recovery link
      if (window.location.search.includes("mode=recovery") || window.location.hash.includes("type=recovery")) {
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          const newPassword = prompt("Please enter your new password to complete the reset (min 6 characters):");
          if (newPassword && newPassword.length >= 6) {
            supabase.auth.updateUser({ password: newPassword }).then(({ error }) => {
              if (error) {
                alert("Error updating password: " + error.message);
              } else {
                alert("Password updated successfully!");
              }
            });
          } else {
            alert("Password change canceled or invalid. You can update it later in your Profile.");
            setSheet("profile");
          }
        }, 500);
      }

      // Check for ?join= code
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const joinCode = urlParams.get("join");
        if (joinCode && session) {
          setTimeout(async () => {
            const groupId = await actions.joinGroup(joinCode);
            if (groupId) {
              setDetailGroupId(groupId);
            }
            window.history.replaceState({}, document.title, window.location.pathname);
          }, 500);
        }
      } catch (e) {
        // ignore
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      applySession(session);
      
      if (event === "PASSWORD_RECOVERY") {
        setTimeout(() => {
          const newPassword = prompt("Please enter your new password to complete the reset (min 6 characters):");
          if (newPassword && newPassword.length >= 6) {
            supabase.auth.updateUser({ password: newPassword }).then(({ error }) => {
              if (error) {
                alert("Error updating password: " + error.message);
              } else {
                alert("Password updated successfully!");
              }
            });
          } else {
            alert("Password change canceled or invalid. You can update it later in your Profile.");
            setSheet("profile");
          }
        }, 500);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setOnboarded(false);
      return;
    }
    setOnboarded(readStoredBool(`roomie.onboarded.${session.user.id}.v1`));
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (window.Notification.permission === 'default') {
          window.Notification.requestPermission();
        }
      }
      const unsubscribe = actions.subscribeNotifications(session.user.id);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [session?.user?.id]);

  const finishTour = () => {
    writeStoredBool("roomie.tourDone.v1", true);
    setTourDone(true);
  };

  const finishOnboarding = () => {
    if (session?.user?.id) {
      writeStoredBool(`roomie.onboarded.${session.user.id}.v1`, true);
    }
    setOnboarded(true);
  };

  const closeAll = () => {
    setSheet(null);
    setDetailGroupId(null);
    setSettleCtx(null);
    setSplitGroupId(null);
    setEditBillId(null);
    setNudgeCtx(null);
  };

  const open = (k: SheetKey) => {
    closeAll();
    setSheet(k);
  };

  const openGroup = (id: string) => {
    closeAll();
    setDetailGroupId(id);
  };

  const openSplitForGroup = (id?: string, editBillId?: string) => {
    closeAll();
    setSplitGroupId(id ?? null);
    setEditBillId(editBillId ?? null);
    setSheet("split");
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: "#F2EADA" }}>
        <div style={{ color: "#888", fontFamily: "'Inter', sans-serif", fontSize: "1.1rem", fontWeight: 500, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black opacity-50"></div>
          Loading Roomie...
        </div>
      </div>
    );
  }

  const isAuthed = !!session?.user;

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar,
        .app-shell *::-webkit-scrollbar { display: none; width: 0; height: 0; }
        .no-scrollbar, .app-shell * { -ms-overflow-style: none; scrollbar-width: none; }
        body { overscroll-behavior: none; }
      `}</style>
      <div className="min-h-screen w-full flex items-stretch justify-center" style={{ backgroundColor: "#F2EADA", fontFamily: "'Inter', sans-serif" }}>
        <div className="app-shell relative w-full bg-[#FFFBF2] overflow-hidden" style={{ maxWidth: 430, minHeight: "100vh", height: "100vh" }}>
          {isAuthed && (
            <Dashboard
              onOpenSplit={() => openSplitForGroup()}
              onOpenHistory={() => open("history")}
              onOpenScan={() => open("scan")}
              onOpenWrap={() => open("wrap")}
              onOpenProfile={() => open("profile")}
              onOpenRecurring={() => open("recurring")}
              onOpenNudge={() => open("nudge")}
              onOpenNotifications={() => open("notifications")}
              onOpenGroup={openGroup}
              onOpenGroups={() => open("groups")}
              onOpenSettle={(groupId, memberId) => {
                setDetailGroupId(null);
                setSettleCtx({ groupId, memberId });
              }}
            />
          )}

          <Suspense fallback={null}>
            {isAuthed && (
              <>
                <SplitSheet
                  open={sheet === "split"}
                  onClose={closeAll}
                  onScan={() => open("scan")}
                  initialGroupId={splitGroupId}
                  editBillId={editBillId}
                  onSuccess={() => setBurst("split")}
                />
                <SettleSheet
                  groupId={settleCtx?.groupId ?? null}
                  memberId={settleCtx?.memberId ?? null}
                  onClose={() => setSettleCtx(null)}
                  onOpenNudge={(memberId, amount) => {
                    setSettleCtx(null);
                    setNudgeCtx({ memberId, amount });
                    setSheet("nudge");
                  }}
                  onSuccess={(kind) => setBurst(kind)}
                />
                <HistorySheet open={sheet === "history"} onClose={closeAll} />
                <ScanSheet open={sheet === "scan"} onClose={closeAll} onConfirm={() => openSplitForGroup()} />
                <WrapUpSheet open={sheet === "wrap"} onClose={closeAll} />
                <ProfileSheet open={sheet === "profile"} onClose={closeAll} onOpenWrap={() => open("wrap")} />
                <RecurringSheet open={sheet === "recurring"} onClose={closeAll} onOpenSplit={() => setSheet("split")} />
                <NudgeSheet open={sheet === "nudge"} onClose={closeAll} ctx={nudgeCtx} />
                <NotificationsSheet
                  open={sheet === "notifications"}
                  onClose={closeAll}
                  onNavigate={(action) => {
                    if (action.type === "bill" && action.groupId) {
                      closeAll();
                      setTimeout(() => setDetailGroupId(action.groupId), 10);
                    }
                  }}
                />
                <GroupsSheet open={sheet === "groups"} onClose={closeAll} onOpenGroup={openGroup} />
                <GroupDetailSheet
                  id={detailGroupId}
                  onClose={() => setDetailGroupId(null)}
                  onSplit={() => openSplitForGroup(detailGroupId || undefined)}
                  onOpenSettle={(groupId, memberId) => {
                    setSettleCtx({ groupId, memberId });
                  }}
                  onEditBill={(groupId, billId) => {
                    openSplitForGroup(groupId, billId);
                  }}
                />
              </>
            )}
          </Suspense>

          <Toasts />
          <PushBanner
            onClick={(action) => {
              if (action.type === "bill" && action.groupId) {
                closeAll();
                setTimeout(() => setDetailGroupId(action.groupId), 10);
              }
            }}
          />
          {!tourDone && <WelcomeTour onDone={finishTour} />}
          {tourDone && !isAuthed && <LoginPage onLogin={applySession} />}
          <Suspense fallback={null}>
            {tourDone && isAuthed && !onboarded && <Onboarding onDone={finishOnboarding} />}
            {isAuthed && <SuccessBurst kind={burst} onDone={() => setBurst(null)} />}
          </Suspense>
        </div>
      </div>
    </>
  );
}
