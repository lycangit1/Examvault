import React from 'react';
import GatewayFlow from './gateway-flow';
import { ShieldCheck, Activity, Radio, Cpu } from 'lucide-react';

export interface GatewayFlowDemoProps {
  className?: string;
  mode?: 'light' | 'dark' | 'auto';
  title?: string;
  subtitle?: string;
  showOverlayBadges?: boolean;
}

export const GatewayFlowDemo: React.FC<GatewayFlowDemoProps> = ({
  className = '',
  mode = 'light',
  title = 'Real-Time Neural Security Gateway',
  subtitle = 'Monitoring real-time cryptographically sealed nodes & active tamper detection conduits',
  showOverlayBadges = true,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-[#faf8ff] shadow-sm ${className}`}
      style={{ minHeight: '380px' }}
    >
      {/* Underlying Animated Gateway Flow */}
      <div className="absolute inset-0 z-0 opacity-85 pointer-events-none">
        <GatewayFlow
          mode={mode}
          speed={0.85}
          density={1.1}
          size={1.0}
          strokeWidth={1.2}
          className="w-full h-full"
        />
      </div>

      {/* Subtle Gradient Fog to blend into container edges */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-[#faf8ff]/80 via-transparent to-[#faf8ff]/40" />

      {/* Foreground Contextual Cards & Badges */}
      {showOverlayBadges && (
        <div className="relative z-20 p-6 flex flex-col justify-between h-full pointer-events-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-800 tracking-tight flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00236f]" />
                Neural Perimeter Active
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-white/80 backdrop-blur-sm border border-slate-200 text-[11px] font-mono text-slate-600 flex items-center gap-1">
                <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                DOP Permutations: Synchronized
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/80 backdrop-blur-sm border border-slate-200 text-[11px] font-mono text-slate-600 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-[#00236f]" />
                Zero-Knowledge Proofs: 100%
              </span>
            </div>
          </div>

          {/* Bottom Title & Summary */}
          <div className="mt-auto pt-16">
            <div className="bg-white/85 backdrop-blur-md border border-slate-200/90 rounded-lg p-4 shadow-sm max-w-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00236f] uppercase tracking-wider mb-1">
                <Activity className="w-4 h-4" />
                {title}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatewayFlowDemo;
