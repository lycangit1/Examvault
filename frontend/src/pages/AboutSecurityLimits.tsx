import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle, Info, Scale, Lock, Server, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GlowCard } from '../components/ui/spotlight-card';

export const AboutSecurityLimits: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (user) {
      switch (user.role) {
        case 'SETTER': navigate('/setter/dashboard'); break;
        case 'REVIEWER': navigate('/reviewer/dashboard'); break;
        case 'APPROVER': navigate('/approver/dashboard'); break;
        case 'ADMIN_2': navigate('/admin2/dashboard'); break;
        case 'INVESTIGATOR': navigate('/investigator/dashboard'); break;
        default: navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const getBackLabel = () => {
    if (user) {
      return `Back to ${user.role.replace('_', ' ')} Workspace`;
    }
    return 'Back to Overview';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Navigation Button */}
      <div>
        <button
          type="button"
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#00236f]" />
          <span>{getBackLabel()}</span>
        </button>
      </div>

      {/* Header matching Stitch */}
      <GlowCard glowColor="blue" className="p-6 sm:p-8 space-y-2">
        <div className="text-[11px] font-mono text-[#00236f] font-bold uppercase tracking-wider">
          TRANSPARENT SECURITY DISCLOSURES
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Security Limits &amp; System Boundaries
        </h1>
        <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
          ExamVault is built on the engineering principle of <em>Honesty over spectacle</em>. A dependable examination-security platform must clearly communicate what it guarantees and where physical limits exist.
        </p>
      </GlowCard>

      {/* 6 Core Principles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: '1. External Screen Capture',
            desc: 'ExamVault cannot physically prevent an individual from capturing a screen display with an external phone camera. Instead, dynamic forensic watermarks link any leaked capture back to the specific viewing session.',
            icon: ShieldAlert,
            color: 'blue' as const,
          },
          {
            title: '2. Watermark Resilience & Cropping',
            desc: 'Watermarks and content fingerprints provide evidentiary signals. Forensic attribution combines multiple independent telemetry vectors (hash logs + session tokens + deterministic option permutations).',
            icon: Scale,
            color: 'purple' as const,
          },
          {
            title: '3. Evidentiary Attribution vs Guilt',
            desc: 'A detected watermark identifies an authorised session and account credentials. It provides evidentiary material for institutional inquiry rather than automated legal sentencing.',
            icon: Lock,
            color: 'amber' as const,
          },
          {
            title: '4. Explainable Risk vs Determinism',
            desc: 'Risk scoring evaluates anomalies (unregistered devices, off-hours access, rapid velocity). It surfaces suspicious patterns for human investigators rather than opaque automated bans.',
            icon: CheckCircle,
            color: 'rose' as const,
          },
          {
            title: '5. Hardware Trust & 2FA Posture',
            desc: 'Hardware trust evaluates device posture and multi-factor validation. Production deployments integrate hardware FIDO2 security keys, managed corporate MDMs, and TOTP authenticators.',
            icon: Sparkles,
            color: 'blue' as const,
          },
          {
            title: '6. Integration Boundaries',
            desc: 'ExamVault safeguards confidential exam content throughout authoring, moderation, and dual-lock packaging. It issues cryptographic handoff manifests to CBT vendors and secure print facilities.',
            icon: Server,
            color: 'emerald' as const,
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <GlowCard key={idx} glowColor={item.color} className="p-5 space-y-2">
              <div className="flex items-center gap-2.5 text-[#00236f] font-bold text-sm">
                <Icon className="w-4 h-4 shrink-0 text-[#00236f]" />
                <span>{item.title}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
};

export default AboutSecurityLimits;
