import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Trash2, Users, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useStore, actions, groupBurn, simplifyDebts, toast } from "../store";
import { Avatar } from "./Avatar";
import { GroupIcon, GROUP_ICONS } from "./GroupIcon";

const PALETTES = [
  { bg: "#7B61FF", accent: "#9F8BFF" }, // Deep Purple
  { bg: "#FF5C39", accent: "#FF8A6A" }, // Bright Orange
  { bg: "#1A1A1A", accent: "#74FF5A" }, // Black
  { bg: "#FFD84D", accent: "#FFE88A" }, // Bright Yellow
  { bg: "#FF2E93", accent: "#FF66AF" }, // Vibrant Magenta
  { bg: "#0047FF", accent: "#4D82FF" }, // Electric Blue
  { bg: "#39FF14", accent: "#7CFF63" }, // Neon Lime
  { bg: "#00F0FF", accent: "#66F6FF" }, // Vibrant Cyan
  { bg: "#FF0055", accent: "#FF4D88" }, // Bold Red
];

export function GroupsSheet({
  open,
  onClose,
  onOpenGroup,
}: {
  open: boolean;
  onClose: () => void;
  onOpenGroup: (id: string) => void;
}) {
  const groups = useStore((s) => s.groups);
  // Subscribe to settlements so we re-render when debts change
  useStore((s) => s.settlements.length);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(GROUP_ICONS[0]);
  const [palette, setPalette] = useState(0);

  const createGroup = async () => {
    if (!name.trim()) return;
    const id = await actions.addGroup({
      name: name.trim(),
      emoji,
      bg: PALETTES[palette].bg,
      accent: PALETTES[palette].accent,
      members: [],
    });
    setName("");
    setCreating(false);
    if (id) onOpenGroup(id);
  };

  const [joining, setJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const submitJoin = async () => {
    if (!joinCode.trim()) return;
    const id = await actions.joinGroup(joinCode.trim());
    if (id) {
      setJoinCode("");
      setJoining(false);
      onOpenGroup(id);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 z-40" />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="absolute inset-0 z-50 bg-[#FFFBF2] overflow-hidden"
          >
            <div className="flex flex-col h-full pt-4">
              <div className="flex items-center justify-between px-5 pb-3">
                <div>
                  <div className="text-black/50" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.1em" }}>GROUPS</div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                    My Crews
                  </h2>
                </div>
                <button onClick={onClose} className="h-9 w-9 rounded-full bg-white border-2 border-black flex items-center justify-center" style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}>
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2.5 mt-2">
                <button
                  onClick={() => setCreating(true)}
                  className="w-full h-16 rounded-[20px] bg-[#B5A8FF] border-2 border-black flex items-center justify-between px-5 mb-3 group"
                  style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white">
                      <Plus size={16} />
                    </div>
                    <span className="text-black" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}>Create new group</span>
                  </div>
                  <ArrowRight size={18} className="text-black group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setJoining(true)}
                  className="w-full h-14 rounded-[20px] bg-white border-2 border-black border-dashed flex items-center justify-center px-5 mb-5 group text-black/60 hover:text-black hover:border-solid hover:bg-black/5 transition-all"
                >
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15 }}>Enter invite code or link</span>
                </button>

                {groups.map((g) => {
                  const burn = groupBurn(g.id);
                  return (
                    <div
                      key={g.id}
                      className="rounded-[22px] border-2 border-black bg-white p-3 flex items-center gap-3"
                      style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
                    >
                      <button onClick={() => onOpenGroup(g.id)} className="flex items-center gap-3 flex-1 text-left">
                        <div className="h-12 w-12 rounded-2xl border-2 border-black flex items-center justify-center text-white" style={{ backgroundColor: g.bg }}>
                          <GroupIcon icon={g.emoji} size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, lineHeight: 1.1 }}>
                            {g.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Users size={11} className="text-black/50" />
                            <span className="text-black/55" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                              {g.members.length} · burn ₹{burn.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-black/50" />
                      </button>
                      <button
                        onClick={() => {
                          if (simplifyDebts(g.id).length > 0) {
                            toast("Please settle all debts in the group first", "#FF5C39");
                            return;
                          }
                          if (confirm(`Delete ${g.name}? All bills will be removed.`)) actions.deleteGroup(g.id);
                        }}
                        className="h-9 w-9 rounded-full border-2 border-black bg-[#FF5C39] flex items-center justify-center shrink-0"
                        style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
                      >
                        <Trash2 size={13} className="text-black" />
                      </button>
                    </div>
                  );
                })}

                {!creating && !joining && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setCreating(true)}
                    className="w-full rounded-[22px] border-2 border-dashed border-black/40 bg-white/50 p-4 flex items-center gap-3 justify-center text-black/60 hidden hidden" // kept hidden here because it's available at the top now
                  >
                    <Plus size={18} />
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>Create a new group</span>
                  </motion.button>
                )}

                {joining && (
                  <motion.div
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="rounded-[22px] border-2 border-black bg-white p-5 space-y-4"
                    style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
                  >
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>Join a Group</h3>
                    <input
                      autoFocus
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="Paste code or link here..."
                      className="w-full h-[52px] rounded-2xl border-2 border-black px-4 bg-[#FFFBF2] outline-none placeholder:text-black/30"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={submitJoin}
                        disabled={!joinCode.trim()}
                        className="w-full h-12 rounded-full border-2 border-black transition-all"
                        style={{
                          backgroundColor: joinCode.trim() ? "#74FF5A" : "#eee",
                          boxShadow: joinCode.trim() ? "3px 3px 0 0 rgba(0,0,0,1)" : "none",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: 14,
                          opacity: joinCode.trim() ? 1 : 0.6,
                        }}
                      >
                        Join Roomie Group
                      </button>
                      <button
                        onClick={() => {
                          setJoining(false);
                          setJoinCode("");
                        }}
                        className="w-full h-12 rounded-full border-2 border-transparent hover:border-black/10 bg-black/5"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {creating && (
                  <motion.div
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="rounded-[22px] border-2 border-black bg-white p-4 space-y-3"
                    style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl border-2 border-black flex items-center justify-center text-white" style={{ backgroundColor: PALETTES[palette].bg }}>
                        <GroupIcon icon={emoji} size={26} />
                      </div>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Group name"
                        className="flex-1 h-11 rounded-full border-2 border-black px-4 bg-[#FFFBF2] outline-none"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}
                      />
                    </div>
                    <div>
                      <div className="text-black/50 mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em" }}>EMOJI</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {GROUP_ICONS.map((e) => (
                          <button key={e} onClick={() => setEmoji(e)} className="h-9 w-9 rounded-xl border-2 border-black flex items-center justify-center text-black" style={{ backgroundColor: e === emoji ? "#FFD84D" : "#fff" }}>
                            <GroupIcon icon={e} size={18} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-black/50 mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em" }}>COLOR</div>
                      <div className="flex gap-2">
                        {PALETTES.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => setPalette(i)}
                            className="h-8 w-8 rounded-full border-2 border-black"
                            style={{
                              backgroundColor: p.bg,
                              boxShadow: i === palette ? "0 0 0 3px #000" : "none",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCreating(false);
                          setName("");
                        }}
                        className="flex-1 h-12 rounded-full border-2 border-black bg-white"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createGroup}
                        disabled={!name.trim()}
                        className="flex-1 h-12 rounded-full border-2 border-black"
                        style={{
                          backgroundColor: name.trim() ? "#74FF5A" : "#ddd",
                          boxShadow: name.trim() ? "3px 3px 0 0 rgba(0,0,0,1)" : "none",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: 13,
                          opacity: name.trim() ? 1 : 0.6,
                        }}
                      >
                        Create ✨
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
