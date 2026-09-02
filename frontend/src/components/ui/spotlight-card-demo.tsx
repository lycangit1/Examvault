import React from "react";
import { GlowCard } from "./spotlight-card";
import { ShieldCheck, Lock, Fingerprint } from "lucide-react";

export function SpotlightCardDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-5xl mx-auto">
      <GlowCard glowColor="blue" className="p-6 space-y-3">
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 w-fit">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-900">Zero-Trust Access</h4>
        <p className="text-xs text-slate-600">Dynamic pointer illumination with Deep Navy spotlight.</p>
      </GlowCard>

      <GlowCard glowColor="purple" className="p-6 space-y-3">
        <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-600 w-fit">
          <Fingerprint className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-900">Forensic Attribution</h4>
        <p className="text-xs text-slate-600">Deterministic watermark with Violet spotlight reflection.</p>
      </GlowCard>

      <GlowCard glowColor="emerald" className="p-6 space-y-3">
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 w-fit">
          <Lock className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-900">Dual Cryptographic Lock</h4>
        <p className="text-xs text-slate-600">2-man rule package assembly with Emerald spotlight reflection.</p>
      </GlowCard>
    </div>
  );
}

export default SpotlightCardDemo;
