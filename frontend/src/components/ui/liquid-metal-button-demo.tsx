import React from "react";
import { LiquidMetalButton } from "./liquid-metal-button";
import { ShieldCheck, KeyRound } from "lucide-react";

export function LiquidMetalButtonDemo() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
      <div className="text-center space-y-1">
        <h4 className="text-sm font-bold text-slate-900">Liquid Chrome Tactical Buttons</h4>
        <p className="text-xs text-slate-500">Real-time WebGL liquid metal fragment shaders with 3D perspective layers</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <LiquidMetalButton label="Enter Secure Portal" theme="navy" icon={<ShieldCheck className="w-4 h-4 text-blue-300" />} />
        <LiquidMetalButton label="Authorize Dual-Lock" theme="dark" icon={<KeyRound className="w-4 h-4 text-amber-300" />} />
        <LiquidMetalButton viewMode="icon" theme="navy" />
      </div>
    </div>
  );
}

export default LiquidMetalButtonDemo;
