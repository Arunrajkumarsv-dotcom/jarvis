"use client";

import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AuthUser = { email: string; token: string };
type AuthModalProps = { initialMode?: "signup" | "login"; onSuccess: (user: AuthUser) => void; onCancel: () => void };

function playUnlockSound() {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(420, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(920, context.currentTime + 0.18);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.25);
  window.setTimeout(() => void context.close(), 400);
}

export default function AuthModal({ initialMode = "login", onSuccess, onCancel }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setError("");
    setBusy(true);

    try {
      if (mode === "signup") {
        if (!username.trim()) throw new Error("Please enter a unique operator handle.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error("Valid operator email required.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: { username: username.trim() },
          },
        });

        if (signUpError) throw signUpError;
        if (!data.session) throw new Error("Authentication successful. Please check your email to verify your account.");
      } else {
        if (!email.trim() || !password.trim()) throw new Error("Email and password are required.");

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (signInError) throw signInError;
        if (!data.session) throw new Error("Session initialization failed.");

        playUnlockSound();
        onSuccess({
          email: data.user.email!,
          token: data.session.access_token
        });
      }
    } catch (e: any) {
      setError(e.message || "An unexpected authentication error occurred.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#02070b]/80 p-5 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Jarvis authentication">
      <div className={`glass relative w-full max-w-md rounded-2xl border-cyan-300/30 bg-black/80 p-6 shadow-[0_0_50px_rgba(0,240,255,0.15)] sm:p-8 ${error ? "auth-shake" : ""}`}>
        <button onClick={onCancel} className="absolute left-4 top-4 rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Return to portal">
          <ArrowRight size={16} className="rotate-180"/>
        </button>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-cyan-200/30 bg-cyan-200/10 text-cyan-200">
            <LockKeyhole size={21}/>
          </div>
          <div className="mono text-[10px] uppercase tracking-[.25em] text-cyan-200/65">Quantum access layer</div>
          <h2 className="mt-2 text-2xl font-medium text-white">{mode === "login" ? "Identify operator" : "Initialize account"}</h2>
          <p className="mt-2 text-sm text-white/40">{mode === "login" ? "Your private console is waiting." : "Join the JARVIS neural network."}</p>
        </div>

        <div className="mb-6 flex rounded-xl border border-white/10 bg-white/[.03] p-1">
          <button onClick={() => { setMode("login"); setError(""); }} className={`flex-1 rounded-lg py-2 text-xs uppercase tracking-widest transition ${mode === "login" ? "bg-cyan-200/15 text-cyan-100" : "text-white/35"}`}>Sign in</button>
          <button onClick={() => { setMode("signup"); setError(""); }} className={`flex-1 rounded-lg py-2 text-xs uppercase tracking-widest transition ${mode === "signup" ? "bg-cyan-200/15 text-cyan-100" : "text-white/35"}`}>Create account</button>
        </div>

        <div className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="mono block text-[10px] uppercase tracking-[.2em] text-white/40" htmlFor="auth-username">Operator Handle</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-4 focus-within:border-cyan-200/60 focus-within:ring-2 focus-within:ring-cyan-300/10">
                <User size={16} className="text-cyan-200/60"/>
                <input id="auth-username" value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="e.g. TonyStark" className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-white/25"/>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="mono block text-[10px] uppercase tracking-[.2em] text-white/40" htmlFor="auth-email">Operator email</label>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-4 focus-within:border-cyan-200/60 focus-within:ring-2 focus-within:ring-cyan-300/10">
              <Mail size={16} className="text-cyan-200/60"/>
              <input id="auth-email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAuth()} type="email" autoComplete="email" placeholder="operator@domain.com" className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-white/25"/>
            </div>
          </div>

          <div className="space-y-2">
            <label className="mono block text-[10px] uppercase tracking-[.2em] text-white/40" htmlFor="auth-password">Access Key</label>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-4 focus-within:border-cyan-200/60 focus-within:ring-2 focus-within:ring-cyan-300/10">
              <LockKeyhole size={16} className="text-cyan-200/60"/>
              <input id="auth-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAuth()} type="password" placeholder="••••••••" className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-white/25"/>
            </div>
          </div>
        </div>

        <button
          onClick={handleAuth}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-200 py-4 text-sm font-semibold text-[#061014] transition hover:bg-cyan-100 disabled:cursor-wait disabled:opacity-50"
        >
          {busy ? "Establishing secure link..." : mode === "login" ? "Authorize Access" : "Initialize Neural Link"}
          <ArrowRight size={16}/>
        </button>

        {error && <p role="alert" className="mt-4 text-center text-xs text-rose-200">{error}</p>}

        <div className="mt-7 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-white/25">
          <ShieldCheck size={13}/> Encrypted session handshake <Sparkles size={12}/>
        </div>
      </div>
    </div>
  );
}
