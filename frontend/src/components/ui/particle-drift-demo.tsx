import React from "react";
import ParticleDrift from "./particle-drift";
import { Cpu, Activity } from "lucide-react";

export function ParticleDriftDemo() {
  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 flex flex-col justify-between shadow-xl">
      <ParticleDrift mode="dark" speed={0.9} density={1.2} opacity={0.8} />

      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
          <Cpu className="w-3.5 h-3.5" />
          <span>CRYPTOGRAPHIC DRIFT ENGINE</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>MESH SYNC ACTIVE</span>
        </div>
      </div>

      <div className="relative z-10 max-w-md space-y-2">
        <h3 className="text-2xl font-bold text-white tracking-tight">Deterministic Matrix Stream</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Distributed entropy nodes streaming real-time watermark tokens across client sessions with sub-millisecond mesh verification.
        </p>
      </div>
    </div>
  );
}

export default ParticleDriftDemo;
