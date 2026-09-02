import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  FileCheck2,
  Lock,
  Search,
  Eye,
  GitBranch,
  ArrowRight,
  Sparkles,
  Server,
  Layers,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AppRole } from '../types';
import { LiquidMetalButton } from '../components/ui/liquid-metal-button';
import ParticleDrift from '../components/ui/particle-drift';
import { GlowCard } from '../components/ui/spotlight-card';

export const LandingPage: React.FC = () => {
  const { switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleQuickLaunch = async (role: AppRole) => {
    await switchDemoRole(role);
  };

  return (
    <div className="space-y-16 py-6 max-w-6xl mx-auto font-sans relative z-10">
      {/* Cryptographic Matrix & Upward Laser Drift Background (Balanced Ambient Visibility) */}
      <ParticleDrift
        mode="light"
        speed={0.7}
        density={0.85}
        opacity={0.58}
        length={1.1}
        strokeWidth={0.95}
      />

      {/* Hero Section */}
      <div className="relative z-10 text-center space-y-6 pt-8 pb-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
          Secure drafting. Controlled access. <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00236f] via-blue-700 to-indigo-600">
            Traceable forensic accountability.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
          ExamVault is a secure examination-content lifecycle platform designed to make exam-paper leaks harder, make suspicious unauthorized access visible in real-time, and give examination authorities cryptographic evidence for rapid forensic investigation.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <LiquidMetalButton
            label="Enter Secure Portal"
            theme="navy"
            icon={<ArrowRight className="w-4 h-4 text-blue-200" />}
            onClick={() => navigate('/login')}
          />
          <Link
            to="/about-security-limits"
            className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-full shadow-xs transition-colors text-sm flex items-center h-[44px]"
          >
            Security Boundaries
          </Link>
        </div>
      </div>

      {/* Interactive Lifecycle Diagram Spotlight Card */}
      <GlowCard glowColor="blue" className="p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Protected Examination Lifecycle</h2>
          <p className="text-xs text-slate-500 max-w-2xl mx-auto">
            ExamVault safeguards sensitive content before it ever reaches printing presses, transit couriers, or CBT terminals.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { step: '01', title: 'Draft', desc: 'Versioned setter workspace', icon: FileCheck2, color: 'text-blue-600', bg: 'bg-blue-50' },
            { step: '02', title: 'Review', desc: 'Assigned moderation queue', icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
            { step: '03', title: 'Approve', desc: 'Package assembly checks', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { step: '04', title: 'Dual Lock', desc: 'Immutable master hash', icon: Lock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { step: '05', title: 'Deliver', desc: 'Print & CBT export handoff', icon: Server, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { step: '06', title: 'Investigate', desc: 'Forensic leak correlation', icon: Search, color: 'text-rose-600', bg: 'bg-rose-50' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{item.step}</span>
                  <div className={`p-1.5 rounded-lg ${item.bg}`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm font-bold text-slate-800">{item.title}</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-1">{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </GlowCard>

      {/* Six Feature Pillars with Cursor Spotlight Illumination */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">Core Security Innovations</h2>
          <p className="text-xs text-slate-500">Technical defense mechanisms designed for strict auditability and transparency</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlowCard glowColor="blue" className="p-6 space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 w-fit">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Least-Privilege RBAC & RLS</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Strict PostgreSQL Row Level Security guarantees Setters only see their own drafts, Reviewers only view assigned items, and Approvers cannot confirm their own final locks.
            </p>
          </GlowCard>

          <GlowCard glowColor="purple" className="p-6 space-y-3">
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-600 w-fit">
              <Fingerprint className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Dynamic Watermark & Fingerprinting</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every sensitive view renders user/session/time overlays and deterministically permutes option order via cryptographic seed without altering answer correctness.
            </p>
          </GlowCard>

          <GlowCard glowColor="amber" className="p-6 space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600 w-fit">
              <GitBranch className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">SHA-256 Hash-Chained Audit Logs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Audit events form an unbroken cryptographic ledger where any historical metadata modification triggers an immediate <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded font-mono text-[11px]">INTEGRITY ALERT</code>.
            </p>
          </GlowCard>

          <GlowCard glowColor="rose" className="p-6 space-y-3">
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Explainable Risk Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent point-based scoring flags unknown devices (+35), outside-hours access (+25), and rapid high-volume views (+30) without opaque black-box AI claims.
            </p>
          </GlowCard>

          <GlowCard glowColor="blue" className="p-6 space-y-3">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 w-fit">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Forensic Leak Investigation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload suspected leak screenshots to match session tokens, inspect suspicious activity timelines, and produce formal non-accusatory evidentiary reports.
            </p>
          </GlowCard>

          <GlowCard glowColor="emerald" className="p-6 space-y-3">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 w-fit">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Dual Authorization Gate</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Separation of duties requires two distinct authority roles (Approver + Admin_2) to calculate the master SHA-256 package hash before release.
            </p>
          </GlowCard>
        </div>
      </div>

      {/* Fast Demo Launcher Box Spotlight Card */}
      <GlowCard glowColor="blue" className="p-8 space-y-6 text-center">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900">1-Click Role Workspace Launcher</h3>
          <p className="text-xs text-slate-500">
            For evaluation, click any demo persona below to instantly authenticate and test that exact role's dashboard:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-4xl mx-auto">
          {[
            { role: 'SETTER' as AppRole, name: 'Setter_A', desc: 'Drafts & Edits', color: 'border-blue-200 hover:border-blue-400 bg-blue-50/40 text-[#00236f]' },
            { role: 'REVIEWER' as AppRole, name: 'Reviewer_B', desc: 'Moderates & Approves', color: 'border-purple-200 hover:border-purple-400 bg-purple-50/40 text-purple-900' },
            { role: 'APPROVER' as AppRole, name: 'Approver_C', desc: 'Package Assembler', color: 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 text-indigo-900' },
            { role: 'ADMIN_2' as AppRole, name: 'Admin_2', desc: 'Dual Gatekeeper', color: 'border-amber-200 hover:border-amber-400 bg-amber-50/40 text-amber-900' },
            { role: 'INVESTIGATOR' as AppRole, name: 'Investigator', desc: 'Audit & Leak Analysis', color: 'border-rose-200 hover:border-rose-400 bg-rose-50/40 text-rose-900' },
          ].map((persona) => (
            <button
              key={persona.role}
              type="button"
              onClick={() => handleQuickLaunch(persona.role)}
              className={`p-3.5 rounded-xl border text-left transition-all hover:scale-[1.02] shadow-2xs ${persona.color}`}
            >
              <div className="font-bold text-sm">{persona.name}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider font-semibold opacity-75">{persona.role}</div>
              <div className="text-[11px] text-slate-600 mt-1">{persona.desc}</div>
            </button>
          ))}
        </div>
      </GlowCard>
    </div>
  );
};
