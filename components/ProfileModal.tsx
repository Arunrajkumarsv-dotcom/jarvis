"use client";

import { useState } from "react";
import { User, Mic, Settings2, ArrowRight, Sparkles } from "lucide-react";

type ProfileData = {
  fullName: string;
  gender: "Male" | "Female" | "Other" | "Prefer not to say";
  preferredVoice: "Jarvis Classic - Male" | "Friday / Nova - Female" | "System Default";
};

type ProfileModalProps = {
  onComplete: (profile: ProfileData) => void;
  onCancel: () => void;
};

export default function ProfileModal({ onComplete, onCancel }: ProfileModalProps) {
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    gender: "Prefer not to say",
    preferredVoice: "System Default",
  });
  const [busy, setBusy] = useState(false);

  const handleSubmit = () => {
    if (!profile.fullName.trim()) return;
    setBusy(true);
    // Simulate a brief "neural synchronization" delay for aesthetic effect
    setTimeout(() => {
      onComplete(profile);
      setBusy(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#02070b]/80 p-5 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Jarvis profile configuration">
      <div className="glass relative w-full max-w-md rounded-2xl border-cyan-300/30 bg-black/80 p-6 shadow-[0_0_50px_rgba(0,240,255,0.15)] sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-cyan-200/30 bg-cyan-200/10 text-cyan-200">
            <Settings2 size={21} />
          </div>
          <div className="mono text-[10px] uppercase tracking-[.25em] text-cyan-200/65">Neural Identity Layer</div>
          <h2 className="mt-2 text-2xl font-medium text-white">Configure Operator Profile</h2>
          <p className="mt-2 text-sm text-white/40">Please provide your credentials to synchronize with the system.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="mono text-[10px] uppercase tracking-[.2em] text-white/40 flex items-center gap-2">
              <User size={12} className="text-cyan-200/60" /> Full Name
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-4 focus-within:border-cyan-200/60 focus-within:ring-2 focus-within:ring-cyan-300/10">
              <input
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                type="text"
                placeholder="Enter your display name"
                className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-white/25"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="mono text-[10px] uppercase tracking-[.2em] text-white/40 flex items-center gap-2">
              <Sparkles size={12} className="text-cyan-200/60" /> Gender / Honorific Preference
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["Male", "Female", "Other", "Prefer not to say"].map((option) => (
                <button
                  key={option}
                  onClick={() => setProfile({ ...profile, gender: option as any })}
                  className={`rounded-xl border py-3 text-xs transition ${
                    profile.gender === option
                      ? "border-cyan-200 bg-cyan-200/15 text-cyan-100"
                      : "border-white/10 bg-white/[.03] text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="mono text-[10px] uppercase tracking-[.2em] text-white/40 flex items-center gap-2">
              <Mic size={12} className="text-cyan-200/60" /> Preferred Voice
            </label>
            <div className="space-y-2">
              {["Jarvis Classic - Male", "Friday / Nova - Female", "System Default"].map((option) => (
                <button
                  key={option}
                  onClick={() => setProfile({ ...profile, preferredVoice: option as any })}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-xs transition ${
                    profile.preferredVoice === option
                      ? "border-cyan-200 bg-cyan-200/15 text-cyan-100"
                      : "border-white/10 bg-white/[.03] text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {option}
                  {profile.preferredVoice === option && <div className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_#72e3df]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={!profile.fullName.trim() || busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-200 py-4 text-sm font-semibold text-[#061014] transition hover:bg-cyan-100 disabled:cursor-wait disabled:opacity-50"
          >
            {busy ? "Synchronizing Neural Link..." : "Synchronize Profile"}
            {!busy && <ArrowRight size={16} />}
          </button>
          <button
            onClick={onCancel}
            className="flex w-full items-center justify-center rounded-xl border border-white/10 py-3 text-xs text-white/50 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
