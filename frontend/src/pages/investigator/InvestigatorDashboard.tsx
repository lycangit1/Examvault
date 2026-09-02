import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, History, AlertTriangle, Search, Cpu, CheckCircle2, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AuditLog, AppSession, LeakReport } from '../../types';
import { RiskBadge } from '../../components/common/Badge';
import { GlowCard } from '../../components/ui/spotlight-card';

export const InvestigatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [sessions, setSessions] = useState<AppSession[]>([]);
  const [leaks, setLeaks] = useState<LeakReport[]>([]);
  const [integrityStatus, setIntegrityStatus] = useState<'VERIFIED' | 'INTEGRITY_ALERT' | 'CHECKING'>('CHECKING');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvestigatorData() {
      try {
        setLoading(true);
        const { data: lData } = await supabase
          .from('audit_logs')
          .select('*')
          .order('id', { ascending: false })
          .limit(10);
        if (lData) setLogs(lData as AuditLog[]);

        const { data: sData } = await supabase
          .from('app_sessions')
          .select('*')
          .order('risk_score', { ascending: false });
        if (sData) setSessions(sData as AppSession[]);

        const { data: leakData } = await supabase
          .from('leak_reports')
          .select('*')
          .order('created_at', { ascending: false });
        if (leakData) setLeaks(leakData as LeakReport[]);

        const { data: verifyRes } = await supabase.rpc('verify_audit_integrity');
        if (verifyRes?.status) {
          setIntegrityStatus(verifyRes.status);
        }
      } catch (err) {
        console.error('Error loading investigator dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInvestigatorData();
  }, [user]);

  const highRiskSessions = sessions.filter(s => s.risk_level === 'HIGH_RISK' || s.risk_score >= 70);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching Stitch */}
      <GlowCard glowColor="blue" className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[#00236f] font-bold uppercase tracking-wider">
            FORENSIC INTELLIGENCE HUB
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {user?.name || 'Investigator'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Live behavioral anomaly scoring, immutable SHA-256 ledger integrity checking, and OCR forensic leak attribution.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Ledger Hash Chain: {integrityStatus}</span>
        </div>
      </GlowCard>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlowCard glowColor="blue" className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Live Sessions</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{sessions.length}</div>
        </GlowCard>

        <GlowCard glowColor="rose" className="border-l-4 border-l-red-600 p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">High-Risk / Suspended</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{highRiskSessions.length}</div>
        </GlowCard>

        <GlowCard glowColor="amber" className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Audit Events Logged</span>
            <History className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{logs.length > 0 ? `${logs.length}+` : 0}</div>
        </GlowCard>

        <GlowCard glowColor="purple" className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wide">Leak Analyses</span>
            <Search className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{leaks.length}</div>
        </GlowCard>
      </div>

      {/* Modules Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlowCard glowColor="rose" className="p-5">
          <Link
            to="/investigator/risk-sessions"
            className="block space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">Session Risk &amp; Triage</div>
              <ArrowRight className="w-4 h-4 text-[#00236f]" />
            </div>
            <p className="text-xs text-slate-500">
              Real-time candidate telemetry, auto-suspension reviews, and reinstatement console.
            </p>
          </Link>
        </GlowCard>

        <GlowCard glowColor="amber" className="p-5">
          <Link
            to="/investigator/audit-logs"
            className="block space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">Audit Ledger &amp; Hashes</div>
              <ArrowRight className="w-4 h-4 text-[#00236f]" />
            </div>
            <p className="text-xs text-slate-500">
              Cryptographic SHA-256 verification of immutable event records.
            </p>
          </Link>
        </GlowCard>

        <GlowCard glowColor="purple" className="p-5">
          <Link
            to="/investigator/leaks"
            className="block space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">Leak Investigation Lab</div>
              <ArrowRight className="w-4 h-4 text-[#00236f]" />
            </div>
            <p className="text-xs text-slate-500">
              Forensic OCR image watermarking and candidate fingerprint attribution.
            </p>
          </Link>
        </GlowCard>
      </div>
    </div>
  );
};
