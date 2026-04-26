import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Mail, ArrowRight, Shield, Lock, Chrome } from "lucide-react";
import { Logo } from "./Logo";
import { supabase } from "../../lib/supabase";
import { toast } from "../store";
import type { Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";

export function LoginPage({ onLogin }: { onLogin: (session: Session | null) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  const submit = async () => {
    if (loading) return;
    if (email.trim().length < 5 || password.length < 6) {
      toast("Please enter a valid email and 6+ char password", "#FF5C39");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) {
          toast(error.message, "#FF5C39");
        } else if (data.session) {
          onLogin(data.session);
        } else {
          toast("Account created. Check your email, then log in.", "#74FF5A");
          setMode("login");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          toast(error.message, "#FF5C39");
        } else {
          onLogin(data.session);
        }
      }
    } catch {
      toast("Something went wrong", "#FF5C39");
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: "google" | "apple") => {
    if (oauthLoading) return;
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast(error.message, "#FF5C39");
      setOauthLoading(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[60] flex flex-col"
        style={{ backgroundColor: "#FFFBF2" }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ y: -60, rotate: -16, opacity: 0 }}
            animate={{ y: 0, rotate: -16, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 18 }}
            className="absolute -top-10 -left-10 h-40 w-44 rounded-[28px] border-2 border-black"
            style={{ backgroundColor: "#FFD84D", boxShadow: "5px 5px 0 0 rgba(0,0,0,1)" }}
          />
          <motion.div
            initial={{ y: -40, rotate: 14, opacity: 0 }}
            animate={{ y: 0, rotate: 14, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 180, damping: 18 }}
            className="absolute -top-8 -right-12 h-36 w-40 rounded-[28px] border-2 border-black"
            style={{ backgroundColor: "#74FF5A", boxShadow: "5px 5px 0 0 rgba(0,0,0,1)" }}
          />
          <motion.div
            initial={{ y: 60, rotate: 8, opacity: 0 }}
            animate={{ y: 0, rotate: 8, opacity: 1 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 180, damping: 18 }}
            className="absolute -bottom-16 -left-8 h-44 w-44 rounded-[28px] border-2 border-black"
            style={{ backgroundColor: "#B5A8FF", boxShadow: "5px 5px 0 0 rgba(0,0,0,1)" }}
          />
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center px-6">
          <Logo size={84} />
          <motion.h1
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-5 text-black text-center"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 40, letterSpacing: "-0.04em", lineHeight: 1 }}
          >
            Roomie.
          </motion.h1>
          <motion.p
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-black/60 text-center"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: 13 }}
          >
            Splits without the awkward.
          </motion.p>

          <motion.form
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 220, damping: 22 }}
            className="mt-8 w-full max-w-[360px] rounded-[28px] border-2 border-black bg-white p-5"
            style={{ boxShadow: "6px 6px 0 0 rgba(0,0,0,1)" }}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="grid grid-cols-2 gap-1 p-1 rounded-full border-2 border-black bg-[#FFFBF2]">
              <Tab active={mode === "login"} onClick={() => setMode("login")} label="Login" />
              <Tab active={mode === "signup"} onClick={() => setMode("signup")} label="Sign up" />
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-black/55 mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em" }}>
                  EMAIL ADDRESS
                </div>
                <div className="flex items-center gap-2 h-12 rounded-full border-2 border-black px-4 bg-[#FFFBF2]">
                  <Mail size={16} className="text-black/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    autoComplete="email"
                    className="flex-1 bg-transparent outline-none"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14 }}
                  />
                </div>
              </div>

              <div>
                <div className="text-black/55 mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em" }}>
                  PASSWORD
                </div>
                <div className="flex items-center gap-2 h-12 rounded-full border-2 border-black px-4 bg-[#FFFBF2]">
                  <Lock size={16} className="text-black/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="flex-1 bg-transparent outline-none"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14 }}
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="mt-5 w-full h-14 rounded-full border-2 border-black bg-[#74FF5A] flex items-center justify-center gap-2"
              style={{
                boxShadow: "4px 4px 0 0 rgba(0,0,0,1)",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (mode === "login" ? "Logging in..." : "Signing up...") : (
                <>
                  {mode === "login" ? "Log In" : "Sign Up"} <ArrowRight size={16} />
                </>
              )}
            </motion.button>

            <div className="mt-5 flex items-center gap-2 text-black/50">
              <div className="flex-1 h-px bg-black/20" />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em" }}>OR</span>
              <div className="flex-1 h-px bg-black/20" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <SocialBtn
                label={oauthLoading === "google" ? "Opening..." : "Google"}
                icon={<Chrome size={14} />}
                disabled={!!oauthLoading}
                onClick={() => signInWithProvider("google")}
              />
              <SocialBtn
                label={oauthLoading === "apple" ? "Opening..." : "Apple"}
                icon={<span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>A</span>}
                disabled={!!oauthLoading}
                onClick={() => signInWithProvider("apple")}
              />
            </div>
          </motion.form>

          <div className="mt-6 flex items-center gap-1.5 text-black/55">
            <Shield size={11} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11 }}>Private groups with Supabase Auth</span>
          </div>
        </div>

        <div className="relative pb-6 px-8 text-center text-black/45" style={{ fontFamily: "'Inter', sans-serif", fontSize: 10 }}>
          Roomie never touches your money. It only tracks the math.
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 rounded-full flex items-center justify-center gap-1.5"
      style={{
        backgroundColor: active ? "#000" : "transparent",
        color: active ? "#fff" : "#000",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      {label}
    </button>
  );
}

function SocialBtn({ label, icon, disabled, onClick }: { label: string; icon: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-12 rounded-full border-2 border-black bg-white flex items-center justify-center gap-2"
      style={{
        boxShadow: "3px 3px 0 0 rgba(0,0,0,1)",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: 12,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {icon}
      {label}
    </motion.button>
  );
}
