"use client";

import { useState } from "react";
import { Volume2, User, Sparkles, X } from "lucide-react";

type Profile = {
  fullName: string;
  gender: string;
  preferredVoice: string;
};

type SettingsModalProps = {
  profile: Profile | null;
  onUpdateProfile: (updates: Partial<Profile>) => void;
  onClose: () => void;
};

export default function SettingsModal({ profile, onUpdateProfile, onClose }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#02070b]/80 p-5 backdrop-blur-md" role="dialog" aria-modal="true">
      <div className="glass relative w-full max-w-md rounded-2xl border-cyan-300/30 bg-black/80 p-6 shadow-[0_0_50px_rgba(0,240,255,0.15)] sm:p-8">
        <button onClick={onClose} className="absolute left-4 top-4 rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-cyan-200/30 bg-cyan-200/10 text-cyan-200">
            <Sparkles size={21} />
          </div>
          <h2 className="text-2xl font-medium text-white">System Settings</h2>
          <p className="mt-2 text-sm text-white/40">Refine your interaction parameters.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="mono text-[10px] uppercase tracking-[.2em] text-white/40 flex items-center gap-2">
              <User size={12} className="text-cyan-200/60" /> Display Name
            </label>
            <input
              value={profile?.fullName || ""}
              onChange={(e) => onUpdateProfile({ fullName: e.target.value })}
              type="text"
              className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-200/60 focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>

          <div className="space-y-2">
            <label className="mono text-[10px] uppercase tracking-[.2em] text-white/40 flex items-center gap-2">
              <Volume2 size={12} className="text-cyan-200/60" /> Voice Interface
            </label>
            <div className="grid grid-cols-1 gap-2">
              {["Jarvis Classic - Male", "Friday / Nova - Female", "System Default"].map((option) => (
                <button
                  key={option}
                  onClick={() => onUpdateProfile({ preferredVoice: option })}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-xs transition ${
                    profile?.preferredVoice === option
                      ? "border-cyan-200 bg-cyan-200/15 text-cyan-100"
                      : "border-white/10 bg-white/[.03] text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {option}
                  {profile?.preferredVoice === option && <div className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_#72e3df]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
