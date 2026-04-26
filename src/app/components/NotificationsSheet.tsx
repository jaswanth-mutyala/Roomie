import { motion, AnimatePresence } from "motion/react";
import { X, Bell, CheckCheck } from "lucide-react";
import { Avatar } from "./Avatar";
import { useStore, actions } from "../store";

export function NotificationsSheet({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate?: (action: any) => void }) {
  const notifs = useStore((s) => s.notifications);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="absolute bottom-0 left-0 right-0 z-50 bg-[#FFFBF2] rounded-t-[36px] border-t-2 border-black overflow-hidden"
            style={{ height: "80%" }}
          >
            <div className="flex flex-col h-full">
              <div className="pt-3 pb-2 flex flex-col items-center">
                <div className="h-1.5 w-12 rounded-full bg-black/30" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-10 w-10 rounded-2xl border-2 border-black flex items-center justify-center"
                    style={{ backgroundColor: "#FFD84D", boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
                  >
                    <Bell size={16} />
                  </div>
                  <div>
                    <div className="text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.1em" }}>
                      ACTIVITY
                    </div>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", lineHeight: 1 }}>
                      Inbox
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => actions.markNotifsRead()}
                    className="h-9 px-3 rounded-full bg-white border-2 border-black flex items-center gap-1"
                    style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 11 }}
                  >
                    <CheckCheck size={12} /> Mark read
                  </button>
                  <button
                    onClick={onClose}
                    className="h-9 w-9 rounded-full bg-white border-2 border-black flex items-center justify-center"
                    style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
                {notifs.map((n, i) => (
                  <motion.div
                    key={n.id}
                    onClick={() => {
                      if (n.action && onNavigate) {
                        onNavigate(n.action);
                      }
                    }}
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.04 * i }}
                    className={`rounded-[20px] border-2 border-black p-3 flex items-center gap-3 relative ${n.action ? "cursor-pointer" : ""} ${n.unread ? "bg-white" : "bg-black/[0.02]"}`}
                    style={{ boxShadow: n.unread ? "3px 3px 0 0 rgba(0,0,0,1)" : "none" }}
                  >
                    {n.unread && (
                      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#FF5C39] border-2 border-black" />
                    )}
                    <Avatar name={n.name} color={n.color} size={46} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>
                          {n.name}
                        </span>
                        <span className="text-black/60 truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                          {n.title}
                        </span>
                      </div>
                      <div className="text-black/80 mt-0.5 truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: n.unread ? 500 : 400 }}>
                        {n.sub}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between h-full py-1">
                      {n.kind === "success" && (
                        <div className="h-2 w-2 rounded-full bg-[#74FF5A] border border-black" />
                      )}
                      {n.kind === "info" && (
                        <div className="h-2 w-2 rounded-full bg-[#B5A8FF] border border-black" />
                      )}
                      <span className="text-black/40 mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 11 }}>
                        {n.time}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
