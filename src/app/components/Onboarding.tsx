import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { ArrowRight, Home, Users, Copy, Sparkles, Check } from "lucide-react";
import { Avatar } from "./Avatar";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"create" | "join" | null>(null);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const pgCode = "404-BOYS";

  const go = (n: number) => setStep(n);

  return (
    <div className="absolute inset-0 z-[70] bg-[#FFFBF2] overflow-hidden">
      {/* Background marquee text */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-4 left-0 right-0 whitespace-nowrap overflow-hidden opacity-[0.06]"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 120, letterSpacing: "-0.06em", lineHeight: 1 }}
      >
        ROOMIE · ROOMIE · ROOMIE
      </div>

      {/* Progress dots */}
      <div className="absolute top-6 left-0 right-0 flex items-center justify-center gap-1.5 z-30">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 rounded-full border border-black transition-all"
            style={{
              width: i === step ? 26 : 10,
              backgroundColor: i <= step ? "#000" : "#FFFBF2",
            }}
          />
        ))}
      </div>

      {/* Skip */}
      <button
        onClick={onDone}
        className="absolute top-5 right-5 z-30 text-black/50 px-3 py-1"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12 }}
      >
        Skip →
      </button>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="s0"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="absolute inset-0 px-6 pt-24 flex flex-col"
          >
            <div className="flex items-baseline gap-1">
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 60, letterSpacing: "-0.04em", lineHeight: 0.95 }}>
                Split
                <br />
                rent. Not
                <br />
                vibes.
              </h1>
              <span className="inline-block h-3 w-3 rounded-full bg-[#74FF5A] border-2 border-black" />
            </div>
            <p className="text-black/60 mt-4" style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, lineHeight: 1.5 }}>
              The no-drama way to split mess, maid, wifi & rent with your crew. Zero math. Zero awkward texts.
            </p>

            {/* Floating hero card */}
            <div className="relative flex-1 flex items-center justify-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div
                  className="rounded-[28px] border-2 border-black p-5 w-[260px]"
                  style={{ backgroundColor: "#7B61FF", boxShadow: "6px 6px 0 0 rgba(0,0,0,1)", transform: "rotate(-4deg)" }}
                >
                  <div className="text-white/70" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.14em" }}>
                    THIS MONTH
                  </div>
                  <div className="flex items-baseline gap-1 text-white mt-1">
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22 }}>₹</span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 48, letterSpacing: "-0.04em", lineHeight: 1 }}>
                      14,250
                    </span>
                  </div>
                  <div className="flex -space-x-2 mt-4">
                    {["#74FF5A", "#FF5C39", "#FFD84D", "#B5A8FF"].map((c, i) => (
                      <Avatar key={i} name={["R", "A", "K", "D"][i]} color={c} size={28} />
                    ))}
                  </div>
                </div>
                {/* mini cards */}
                <div
                  className="absolute -right-6 -top-6 rounded-2xl border-2 border-black p-2.5 bg-[#74FF5A]"
                  style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", transform: "rotate(8deg)" }}
                >
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11 }}>Mess · ₹450</div>
                </div>
                <div
                  className="absolute -left-8 -bottom-4 rounded-2xl border-2 border-black p-2.5 bg-[#FF5C39] text-white"
                  style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", transform: "rotate(-10deg)" }}
                >
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11 }}>Rahul owes ₹1,240</div>
                </div>
              </motion.div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => go(1)}
              className="w-full h-[64px] rounded-full border-2 border-black flex items-center justify-center gap-2 text-white"
              style={{
                backgroundColor: "#000",
                boxShadow: "5px 5px 0 0 rgba(0,0,0,1)",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              Let's go <ArrowRight size={18} />
            </motion.button>
            <div className="text-center mt-4 text-black/40 mb-4" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
              Free forever · Made for Indian PGs
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="absolute inset-0 px-6 pt-24 flex flex-col"
          >
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 36, letterSpacing: "-0.03em", lineHeight: 1 }}>
              Create your crew
            </h1>
            <p className="text-black/60 mt-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
              Start a new group or join one with a code.
            </p>

            <div className="mt-6 space-y-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("create")}
                className="w-full rounded-[24px] border-2 border-black p-4 flex items-center gap-3 text-left"
                style={{
                  backgroundColor: mode === "create" ? "#74FF5A" : "#fff",
                  boxShadow: "5px 5px 0 0 rgba(0,0,0,1)",
                }}
              >
                <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center shrink-0">
                  <Home size={20} className="text-[#74FF5A]" />
                </div>
                <div className="flex-1">
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}>
                    Create a new group
                  </div>
                  <div className="text-black/60" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                    You'll be the admin · get a shareable code
                  </div>
                </div>
                {mode === "create" && <Check size={20} />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("join")}
                className="w-full rounded-[24px] border-2 border-black p-4 flex items-center gap-3 text-left"
                style={{
                  backgroundColor: mode === "join" ? "#FF5C39" : "#fff",
                  color: mode === "join" ? "#fff" : "#000",
                  boxShadow: "5px 5px 0 0 rgba(0,0,0,1)",
                }}
              >
                <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center shrink-0">
                  <Users size={20} className="text-[#FF5C39]" />
                </div>
                <div className="flex-1">
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}>
                    Join with a code
                  </div>
                  <div className={mode === "join" ? "text-white/70" : "text-black/60"} style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                    Ask your roomie for the 6-digit code
                  </div>
                </div>
                {mode === "join" && <Check size={20} />}
              </motion.button>

              {mode === "join" && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="pt-1"
                >
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-14 rounded-xl border-2 border-black bg-white flex items-center justify-center"
                        style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22 }}
                      >
                        {code[i] || <span className="text-black/20">•</span>}
                      </div>
                    ))}
                  </div>
                  <input
                    autoFocus
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    className="absolute inset-0 opacity-0"
                  />
                </motion.div>
              )}
            </div>

            <div className="mt-auto mb-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!mode}
                onClick={() => go(2)}
                className="w-full h-[64px] rounded-full border-2 border-black flex items-center justify-center gap-2"
                style={{
                  backgroundColor: mode ? "#000" : "#ccc",
                  color: "#fff",
                  boxShadow: mode ? "5px 5px 0 0 rgba(0,0,0,1)" : "none",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  opacity: mode ? 1 : 0.5,
                }}
              >
                Continue <ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="s2"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="absolute inset-0 px-6 pt-24 flex flex-col"
          >
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 36, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {mode === "join" ? "You're in." : "You're the admin."}
            </h1>
            <p className="text-black/60 mt-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
              {mode === "join"
                ? "Your crew can now split bills with you."
                : "Share this code with your roomies — they join in seconds."}
            </p>

            {mode !== "join" && (
              <div className="mt-6">
                <div
                  className="rounded-[28px] border-2 border-black p-5 relative overflow-hidden"
                  style={{ backgroundColor: "#1A1A1A", boxShadow: "6px 6px 0 0 rgba(0,0,0,1)" }}
                >
                  <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full" style={{ backgroundColor: "#7B61FF", opacity: 0.5 }} />
                  <div className="relative">
                    <div className="text-white/60" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.2em" }}>
                      ROOMIE CODE
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className="text-white"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 42, letterSpacing: "-0.03em", lineHeight: 1 }}
                      >
                        {pgCode}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(pgCode);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }}
                        className="h-11 w-11 rounded-full bg-[#74FF5A] border-2 border-black flex items-center justify-center"
                        style={{ boxShadow: "3px 3px 0 0 rgba(255,255,255,0.2)" }}
                      >
                        {copied ? <Check size={18} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <div className="text-white/50 mt-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                      Valid for 7 days · expires after joined
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2">
              <Sparkles size={16} className="text-black/50" />
              <span className="text-black/60" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.08em" }}>
                WHAT YOU'LL GET
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {[
                { t: "Zero-math splits", s: "Just type, swipe, done." },
                { t: "AI bill scanner", s: "Snap the receipt, we do OCR." },
                { t: "Auto-nudge defaulters", s: "With just the right amount of roast." },
                { t: "Monthly Wrapped", s: "Share your PG stats to the group." },
              ].map((x, i) => (
                <motion.div
                  key={x.t}
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center gap-3 p-3 rounded-[18px] bg-white border-2 border-black"
                  style={{ boxShadow: "3px 3px 0 0 rgba(0,0,0,1)" }}
                >
                  <div
                    className="h-9 w-9 rounded-xl border-2 border-black flex items-center justify-center"
                    style={{ backgroundColor: ["#74FF5A", "#FFD84D", "#FF5C39", "#B5A8FF"][i] }}
                  >
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, lineHeight: 1 }}>
                      {x.t}
                    </div>
                    <div className="text-black/55 mt-0.5" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                      {x.s}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-auto mb-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onDone}
                className="w-full h-[64px] rounded-full border-2 border-black flex items-center justify-center gap-2 text-black"
                style={{
                  backgroundColor: "#74FF5A",
                  boxShadow: "5px 5px 0 0 rgba(0,0,0,1)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                Open my dashboard <ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
