"use client";

import { motion } from "framer-motion";
import { X, ShieldCheck, Zap, Crown } from "lucide-react";

type Tier = {
  name: string;
  price: string;
  status: string;
  features: string[];
  icon: any;
  highlight?: boolean;
};

const tiers: Tier[] = [
  {
    name: "Free Tier",
    price: "Active",
    status: "Testing Mode",
    features: ["Standard execution", "Limited tool access", "Community support"],
    icon: ShieldCheck,
  },
  {
    name: "Pro Autonomous Tier",
    price: "$29/mo",
    status: "Coming Soon",
    features: ["Full multi-agent execution", "Unlimited Groq LPU calls", "Email & app automation", "Priority inference"],
    icon: Zap,
    highlight: true,
  },
  {
    name: "Enterprise Matrix",
    price: "$99/mo",
    status: "Coming Soon",
    features: ["Custom local models", "Dedicated neural links", "Priority latency", "SLA guaranteed uptime"],
    icon: Crown,
  },
];

export default function SubscriptionModal({ onClose, onJoinWaitlist }: { onClose: () => void; onJoinWaitlist: (tier: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0f] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500" />

        <div className="p-8 md:p-12">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Subscription Matrix</h2>
              <p className="text-white/40 mono text-xs uppercase tracking-widest mt-2">Select your neural access level</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative group p-8 rounded-2xl border transition-all duration-300 ${
                  tier.highlight
                    ? "bg-cyan-200/[0.03] border-cyan-200/30 shadow-[0_0_30px_rgba(114,227,223,0.05)]"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-6 ${
                  tier.highlight ? "bg-cyan-200 text-black" : "bg-white/10 text-cyan-100"
                }`}>
                  <tier.icon size={24} />
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-2xl font-bold text-white">{tier.price}</span>
                  <span className="text-xs text-white/40 mono">{tier.status}</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-white/60">
                      <div className="mt-1 h-1 w-1 rounded-full bg-cyan-200/50" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {tier.name === "Free Tier" ? (
                  <div className="w-full py-3 text-center rounded-xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100 text-sm font-medium mono">
                    Current Access
                  </div>
                ) : (
                  <button
                    onClick={() => onJoinWaitlist(tier.name)}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      tier.highlight
                        ? "bg-cyan-200 text-black hover:bg-cyan-100 shadow-[0_0_20px_rgba(114,227,223,0.3)]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    Join Waitlist / Pre-Order
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
