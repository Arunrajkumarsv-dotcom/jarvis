"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";

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
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const digitRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { if (!countdown) return; const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [countdown]);
  const sendCode = async () => {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Enter a valid operator email address."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, mode }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "OTP dispatch failed");
      setDigits(["", "", "", "", "", ""]); setStep(2); setCountdown(60); window.setTimeout(() => digitRefs.current[0]?.focus(), 50);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "OTP dispatch failed"); }
    finally { setBusy(false); }
  };
  const updateDigit = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits]; nextDigits[index] = nextValue; setDigits(nextDigits);
    if (nextValue && index < 5) digitRefs.current[index + 1]?.focus();
    if (nextDigits.join("").length === 6) void verify(nextDigits.join(""));
  };
  const verify = async (otp: string) => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }) });
      const data = await response.json() as { error?: string; token?: string; user?: { email: string } };
      if (!response.ok || !data.token || !data.user) throw new Error(data.error ?? "Invalid or expired OTP code");
      playUnlockSound(); onSuccess({ email: data.user.email, token: data.token });
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Verification failed"); setDigits(["", "", "", "", "", ""]); digitRefs.current[0]?.focus(); }
    finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#02070b]/80 p-5 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Jarvis authentication">
    <div className={`glass relative w-full max-w-md rounded-2xl border-cyan-300/30 bg-black/80 p-6 shadow-[0_0_50px_rgba(0,240,255,0.15)] sm:p-8 ${error ? "auth-shake" : ""}`}>
      <button onClick={onCancel} className="absolute left-4 top-4 rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Return to portal"><ArrowLeft size={16}/></button>
      <div className="mb-8 text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-cyan-200/30 bg-cyan-200/10 text-cyan-200"><LockKeyhole size={21}/></div><div className="mono text-[10px] uppercase tracking-[.25em] text-cyan-200/65">Quantum access layer</div><h2 className="mt-2 text-2xl font-medium text-white">{step === 1 ? "Identify operator" : "Enter access code"}</h2><p className="mt-2 text-sm text-white/40">{step === 1 ? "Your private console is waiting." : `Code dispatched to ${email}`}</p></div>
      {step === 1 ? <><div className="mb-6 flex rounded-xl border border-white/10 bg-white/[.03] p-1"><button onClick={() => setMode("login")} className={`flex-1 rounded-lg py-2 text-xs uppercase tracking-widest ${mode === "login" ? "bg-cyan-200/15 text-cyan-100" : "text-white/35"}`}>Sign in</button><button onClick={() => setMode("signup")} className={`flex-1 rounded-lg py-2 text-xs uppercase tracking-widest ${mode === "signup" ? "bg-cyan-200/15 text-cyan-100" : "text-white/35"}`}>Create account</button></div><label className="mono mb-2 block text-[10px] uppercase tracking-[.2em] text-white/40" htmlFor="operator-email">Operator email</label><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-4 focus-within:border-cyan-200/60 focus-within:ring-2 focus-within:ring-cyan-300/10"><Mail size={16} className="text-cyan-200/60"/><input id="operator-email" value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void sendCode(); }} type="email" autoComplete="email" placeholder="operator@domain.com" className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-white/25"/></div><button onClick={() => void sendCode()} disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-200 py-4 text-sm font-semibold text-[#061014] transition hover:bg-cyan-100 disabled:cursor-wait disabled:opacity-50">{busy ? "Generating secure channel..." : "Generate Quantum Access Code"}<ArrowRight size={16}/></button></> : <><div className="mb-7 flex justify-center gap-2">{digits.map((digit, index) => <input key={index} ref={(element) => { digitRefs.current[index] = element; }} value={digit} onChange={(event) => updateDigit(index, event.target.value)} onKeyDown={(event) => { if (event.key === "Backspace" && !digits[index] && index > 0) digitRefs.current[index - 1]?.focus(); }} onPaste={(event) => { event.preventDefault(); const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split(""); const next = ["", "", "", "", "", ""]; pasted.forEach((value, pastedIndex) => { next[pastedIndex] = value; }); setDigits(next); digitRefs.current[Math.min(pasted.length, 5)]?.focus(); if (pasted.length === 6) void verify(pasted.join("")); }} inputMode="numeric" maxLength={1} aria-label={`Access code digit ${index + 1}`} className="h-14 w-11 rounded-xl border border-white/15 bg-white/[.04] text-center font-mono text-xl text-cyan-100 outline-none transition focus:border-cyan-200 focus:bg-cyan-200/10 focus:ring-2 focus:ring-cyan-300/20 sm:w-12"/> )}</div><div className="mb-6 text-center"><p className="mono text-[10px] uppercase tracking-[.16em] text-cyan-200/65">{busy ? "Authenticating neural credentials..." : "Awaiting six-symbol handshake"}</p><button onClick={() => void sendCode()} disabled={countdown > 0 || busy} className="mt-3 text-xs text-white/40 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40">{countdown ? `Resend access code in ${countdown}s` : "Resend access code"}</button></div><button onClick={() => setStep(1)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-xs text-white/50 hover:bg-white/5 hover:text-white"><ArrowLeft size={14}/> Change email</button></>}
      {error && <p role="alert" className="mt-4 text-center text-xs text-rose-200">{error}</p>}
      <div className="mt-7 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-white/25"><ShieldCheck size={13}/> End-to-end session handshake <Sparkles size={12}/></div>
    </div>
  </div>;
}