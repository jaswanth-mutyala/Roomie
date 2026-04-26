import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Avatar } from "./Avatar";
import { useStore, type Notification } from "../store";

export function PushBanner({ onClick }: { onClick?: (action: any) => void }) {
  const notifications = useStore((s) => s.notifications);
  const [activeNotif, setActiveNotif] = useState<Notification | null>(null);
  const lastShownRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const latest = notifications[0];
    if (latest && latest.unread && latest.id !== lastShownRef.current) {
      // Clear any existing timer
      if (timerRef.current) clearTimeout(timerRef.current);

      lastShownRef.current = latest.id;
      setActiveNotif(latest);

      timerRef.current = setTimeout(() => {
        setActiveNotif(null);
        timerRef.current = null;
      }, 4000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notifications]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[100] flex flex-col items-center px-4 pt-10">
      <AnimatePresence>
        {activeNotif && (
          <motion.div
            key={activeNotif.id}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto w-full rounded-[24px] border-2 border-black bg-white p-3 cursor-pointer"
            style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
            onClick={() => {
              if (activeNotif.action && onClick) {
                onClick(activeNotif.action);
              }
              if (timerRef.current) clearTimeout(timerRef.current);
              setActiveNotif(null);
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar name={activeNotif.name} color={activeNotif.color} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>
                    {activeNotif.name}
                  </span>
                  <span className="text-black/50 truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                    {activeNotif.title}
                  </span>
                </div>
                <div className="text-black mt-0.5 truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500 }}>
                  {activeNotif.sub}
                </div>
              </div>
              {/* Kind indicator */}
              {activeNotif.kind === "success" && (
                <div className="h-2 w-2 rounded-full bg-[#74FF5A] border border-black shrink-0 mr-1" />
              )}
              {activeNotif.kind === "info" && (
                <div className="h-2 w-2 rounded-full bg-[#B5A8FF] border border-black shrink-0 mr-1" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
