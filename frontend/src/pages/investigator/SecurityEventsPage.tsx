import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Lock, Unlock, RefreshCw, Zap, Clock, Activity, FileText, CheckCircle2, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AuditLog, SystemLockdownState } from '../../types';

export const SecurityEventsPage: React.FC = () => {
  const { user, lockdownState, refreshLockdownState } = useAuth();
  const [securityLogs, setSecurityLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [isLiftModalOpen, setIsLiftModalOpen] = useState(false);
  const [liftJustification, setLiftJustification] = useState('');

  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [customReason, setCustomReason] = useState('Coordinated anomaly spike detected across multiple sessions');

  const loadSecurityLogs = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .in('action', [
          'SESSION_AUTO_SUSPENDED',
          'SESSION_SUSPENSION_CLEARED',
          'PRE_LOCKDOWN_WARNING',
          'LOCKDOWN_TRIGGERED',
          'LOCKDOWN_LIFTED',
          'RISK_EVENT_RECORDED',
        ])
        .order('id', { ascending: false })
        .limit(30);

      if (data) setSecurityLogs(data as AuditLog[]);
      await refreshLockdownState();
    } catch (err) {
      console.error('Failed to load security logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityLogs();
  }, [user]);

  const handleSimulatePreLockdown = async () => {
    setActionLoading(true);
    setMsg('');
    setError('');
    try {
      const { data, error: rpcErr } = await supabase.rpc('trigger_pre_lockdown_warning', {
        p_reason: 'Automated anomaly cluster detected: 3 sessions scored above 50 risk threshold within 15 minutes',
        p_triggered_by: user?.id,
      });

      if (rpcErr || !data?.success) {
        setError(rpcErr?.message || 'Failed to trigger pre-lockdown');
      } else {
        setMsg('Pre-Lockdown Threat Warning issued. Header warning banner activated.');
        await loadSecurityLogs();
      }
    } catch (err: any) {
      setError(err.message || 'Error triggering warning');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerLockdown = async (reason: string) => {
    setActionLoading(true);
    setMsg('');
    setError('');
    try {
      const { data, error: rpcErr } = await supabase.rpc('trigger_system_lockdown', {
        p_reason: reason,
        p_triggered_by: user?.id,
        p_metadata: { manual_trigger: true, admin_email: user?.email }
      });

      if (rpcErr || !data?.success) {
        setError(rpcErr?.message || 'Failed to engage system lockdown');
      } else {
        setMsg('🚨 SYSTEM-WIDE EMERGENCY LOCKDOWN ENGAGED. Write operations frozen.');
        setIsLockModalOpen(false);
        await loadSecurityLogs();
      }
    } catch (err: any) {
      setError(err.message || 'Error engaging lockdown');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLiftLockdown = async () => {
    if (!liftJustification.trim()) {
      setError('Justification is mandatory to lift lockdown.');
      return;
    }
    setActionLoading(true);
    setMsg('');
    setError('');
    try {
      const { data, error: rpcErr } = await supabase.rpc('lift_system_lockdown', {
        p_justification: liftJustification.trim(),
        p_lifted_by: user?.id,
      });

      if (rpcErr || !data?.success) {
        setError(rpcErr?.message || 'Failed to lift lockdown');
      } else {
        setMsg('System lockdown lifted. Normal platform workflows restored.');
        setIsLiftModalOpen(false);
        setLiftJustification('');
        await loadSecurityLogs();
      }
    } catch (err: any) {
      setError(err.message || 'Error lifting lockdown');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching Stitch */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[#00236f] font-bold uppercase tracking-wider">
            THREAT INTELLIGENCE &amp; DEFENSE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Emergency Threat Response Center
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Real-time platform defense control. Trigger pre-lockdown alerts or freeze all examination writes across the system.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lockdownState?.is_locked ? (
            <span className="px-3 py-1.5 bg-red-100 border border-red-200 text-red-800 rounded-md text-xs font-mono font-bold">
              🚨 LOCKDOWN ACTIVE
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-mono font-bold">
              ✓ SYSTEM NORMAL
            </span>
          )}
        </div>
      </div>

      {msg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Actions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pre-Lockdown Warning Trigger */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Pre-Lockdown Warning</span>
          </div>
          <p className="text-xs text-slate-500">
            Broadcast an amber threat warning without freezing application writes.
          </p>
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleSimulatePreLockdown}
            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold shadow-xs"
          >
            Issue Threat Warning
          </button>
        </div>

        {/* Emergency System Lockdown */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-red-600 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-red-600 text-sm">
            <Lock className="w-4 h-4" />
            <span>System Lockdown (Kill Switch)</span>
          </div>
          <p className="text-xs text-slate-500">
            Instantly freeze all question authoring, reviews, and package assemblies platform-wide.
          </p>
          <button
            type="button"
            disabled={actionLoading || lockdownState?.is_locked}
            onClick={() => setIsLockModalOpen(true)}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            Engage System Lockdown
          </button>
        </div>

        {/* Lift Lockdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-700 text-sm">
            <Unlock className="w-4 h-4" />
            <span>Lift System Lockdown</span>
          </div>
          <p className="text-xs text-slate-500">
            Restore standard operational clearance with cryptographic justification note.
          </p>
          <button
            type="button"
            disabled={actionLoading || !lockdownState?.is_locked}
            onClick={() => setIsLiftModalOpen(true)}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            Lift Lockdown &amp; Restore
          </button>
        </div>
      </div>

      {/* Lift Lockdown Modal */}
      {isLiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Lift System Lockdown</h3>
            <p className="text-xs text-slate-500">Enter forensic justification for restoring normal operations:</p>
            <textarea
              rows={3}
              value={liftJustification}
              onChange={(e) => setLiftJustification(e.target.value)}
              placeholder="e.g. Investigation completed, malicious node quarantined..."
              className="w-full p-2.5 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#00236f]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLiftModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-md text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLiftLockdown}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold"
              >
                Confirm Lift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Lockdown Modal */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-red-600">Engage Emergency Lockdown</h3>
            <p className="text-xs text-slate-500">Provide official reason for triggering emergency freeze:</p>
            <textarea
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Reason for lockdown..."
              className="w-full p-2.5 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-red-600"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-md text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTriggerLockdown(customReason)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold"
              >
                Execute Freeze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
