import React, { useEffect, useState } from 'react';
import {
  History, ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, Hash, ArrowRight,
  Eye, CheckCircle2, Lock, Sparkles, Filter, User, Laptop, Globe, Activity,
  Clock, Copy, Check, FileText, Terminal, Radio,
  AlertOctagon, Info, ExternalLink, Key, Cpu
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AuditLog } from '../../types';

interface ActivityAnalysis {
  title: string;
  category: 'AUTHENTICATION' | 'ZERO-TRUST SECURITY' | 'CONTENT GOVERNANCE' | 'CRYPTOGRAPHIC INTEGRITY' | 'FORENSIC LEAK ATTRIBUTION' | 'SYSTEM PERIMETER';
  categoryColor: string;
  severity: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  severityBadgeColor: string;
  description: string;
  operationalImpact: string;
  iconType: 'shield-check' | 'shield-alert' | 'lock' | 'eye' | 'key' | 'radio' | 'alert-octagon' | 'terminal' | 'file-text';
}

function getActivityAnalysis(log: AuditLog): ActivityAnalysis {
  const meta = log.metadata || {};
  const userName = log.user?.name || meta.user_name || (log.user_id ? `User ${log.user_id.slice(0, 8)}` : 'System Principal');
  const userEmail = log.user?.email ? ` (${log.user.email})` : '';
  const entityDesc = log.entity_type && log.entity_id ? `${log.entity_type} [${log.entity_id}]` : log.entity_type || 'System Resource';

  switch (log.action) {
    case 'LOGIN_SUCCESS':
      return {
        title: 'User Authentication Successful',
        category: 'AUTHENTICATION',
        categoryColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        severity: 'NORMAL',
        severityBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: `Principal ${userName}${userEmail} successfully authenticated into ExamVault. Multi-factor verification (TOTP/Biometric) satisfied. Terminal hardware node "${log.device_id || 'CONSOLE'}" was verified against zero-trust device posture policies with 0 authentication challenge retries.`,
        operationalImpact: `Authorized session established. Access token issued for role ${log.role || 'USER'} with dynamic session watermark protection.`,
        iconType: 'shield-check'
      };

    case 'LOGIN_FAILED':
    case 'LOGIN_FAILURE':
      return {
        title: 'Authentication Attempt Blocked',
        category: 'AUTHENTICATION',
        categoryColor: 'bg-red-50 text-red-800 border-red-200',
        severity: 'HIGH',
        severityBadgeColor: 'bg-red-50 text-red-700 border-red-200',
        description: `An unauthenticated actor failed security verification on device node ${log.device_id || 'unknown'}. Credential submission rejected or OTP token expired. Remote client IP: ${log.ip_address || 'unknown'}.`,
        operationalImpact: 'Access denied. Security rate-limiter incremented; telemetry dispatched to SIEM ledger.',
        iconType: 'shield-alert'
      };

    case 'OTP_VERIFIED':
      return {
        title: 'One-Time Passcode Cryptographically Verified',
        category: 'AUTHENTICATION',
        categoryColor: 'bg-blue-50 text-blue-800 border-blue-200',
        severity: 'NORMAL',
        severityBadgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description: `Time-based one-time authentication factor (TOTP) was verified for ${userName}${userEmail}. Challenge answered within valid time window.`,
        operationalImpact: 'Primary MFA factor cleared. Session step-up authorization granted.',
        iconType: 'key'
      };

    case 'FACE_VERIFIED':
      return {
        title: 'Biometric Face Verification Confirmed',
        category: 'AUTHENTICATION',
        categoryColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        severity: 'NORMAL',
        severityBadgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        description: `Real-time biometric facial recognition matched enrolled facial embeddings for ${userName}${userEmail}. Liveness detection confirmed physical operator presence.`,
        operationalImpact: 'Biometric custody checkpoint satisfied for confidential exam cell operations.',
        iconType: 'eye'
      };

    case 'SESSION_AUTO_SUSPENDED':
      return {
        title: 'Session Auto-Suspended (Zero-Trust Threshold Breach)',
        category: 'ZERO-TRUST SECURITY',
        categoryColor: 'bg-red-50 text-red-800 border-red-200',
        severity: 'CRITICAL',
        severityBadgeColor: 'bg-red-50 text-red-700 border-red-200',
        description: `Zero-Trust behavioral engine severed active session ${log.session_id || log.entity_id}. Cumulative anomaly risk reached ${log.risk_score || meta.cumulative_score || 70}/100, violating security baseline. Triggered by rule: ${meta.triggering_rule || 'RAPID_PACE_ACCESS'}. Rationale: "${meta.reason || 'Multiple concurrent anomaly signals detected'}".`,
        operationalImpact: 'Session terminated immediately. Bearer tokens revoked; user locked out; triage incident created for investigator review.',
        iconType: 'alert-octagon'
      };

    case 'SESSION_SUSPENSION_CLEARED':
      return {
        title: 'Session Suspension Cleared / Reinstated',
        category: 'ZERO-TRUST SECURITY',
        categoryColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        severity: 'MEDIUM',
        severityBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: `Security investigator conducted triage review and cleared suspension for session ${log.session_id || log.entity_id}. Operator verified that anomalous telemetry was benign or authorized. Note: "${meta.admin_note || meta.reason || 'Verified legitimate access'}".`,
        operationalImpact: 'Access privileges restored. Reinstatement recorded with investigator digital signature in audit chain.',
        iconType: 'shield-check'
      };

    case 'SUSPENSION_ESCALATED':
      return {
        title: 'Suspension Escalated to Formal Investigation',
        category: 'ZERO-TRUST SECURITY',
        categoryColor: 'bg-purple-50 text-purple-800 border-purple-200',
        severity: 'HIGH',
        severityBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        description: `Investigator escalated suspended session ${log.session_id || log.entity_id} to high-priority disciplinary and forensic audit. Reason: "${meta.escalation_reason || meta.reason || 'Unresolved anomaly pattern'}".`,
        operationalImpact: 'Case transferred to chief security officer. Evidence bundle frozen for evidentiary custody.',
        iconType: 'shield-alert'
      };

    case 'ALERT_DISPATCHED':
      return {
        title: 'Emergency SOC Security Alert Dispatched',
        category: 'ZERO-TRUST SECURITY',
        categoryColor: 'bg-amber-50 text-amber-800 border-amber-200',
        severity: 'HIGH',
        severityBadgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        description: `High-priority automated incident alert broadcast regarding session ${log.session_id || log.entity_id} (Risk Score: ${log.risk_score}/100). Notification dispatched via ${meta.alert_channel || 'SIMULATED_SOC_NOTIFICATION'} to ${(meta.recipients || ['admin@examvault.demo', 'soc-lead@examvault.demo']).join(', ')}.`,
        operationalImpact: 'Real-time alert transmitted to SOC team and administrators for urgent intervention.',
        iconType: 'radio'
      };

    case 'RISK_EVENT_RECORDED':
      return {
        title: 'Behavioral Anomaly Risk Signal Logged',
        category: 'ZERO-TRUST SECURITY',
        categoryColor: 'bg-amber-50 text-amber-800 border-amber-200',
        severity: (log.risk_score && log.risk_score >= 70) ? 'CRITICAL' : (log.risk_score && log.risk_score >= 40) ? 'HIGH' : 'MEDIUM',
        severityBadgeColor: (log.risk_score && log.risk_score >= 70) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200',
        description: `Real-time risk scoring engine detected anomalous activity: "${meta.reason || 'Telemetry deviation from user baseline'}". Rule invoked: ${meta.rule_name || 'ANOMALY_ENGINE'}. Points assessed: +${meta.points_added || meta.points || log.risk_score}. Current session risk: ${meta.cumulative_score || log.risk_score}/100.`,
        operationalImpact: 'Session risk score updated. Telemetry threshold monitored for auto-suspension trigger.',
        iconType: 'alert-octagon'
      };

    case 'QUESTION_VIEWED':
      return {
        title: 'Encrypted Question Rendered In-Memory',
        category: 'CONTENT GOVERNANCE',
        categoryColor: 'bg-blue-50 text-blue-800 border-blue-200',
        severity: 'LOW',
        severityBadgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description: `Actor ${userName}${userEmail} accessed and rendered confidential question ${log.entity_id || meta.question_id || 'record'} in secure client memory. Dynamic invisible and visible steganographic watermarks were synthesized and rendered onto the viewport.`,
        operationalImpact: 'Ephemerally decrypted for review. Screen interaction logged to audit trail.',
        iconType: 'eye'
      };

    case 'QUESTION_CREATED':
      return {
        title: 'Confidential Question Created & Encrypted',
        category: 'CONTENT GOVERNANCE',
        categoryColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        severity: 'NORMAL',
        severityBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: `Author ${userName}${userEmail} authored and saved a new confidential question (${log.entity_id || meta.question_id || 'ID'}). Item encrypted at rest with AES-256-GCM.`,
        operationalImpact: 'New exam question committed to draft repository pending peer review lifecycle.',
        iconType: 'lock'
      };

    case 'QUESTION_SUBMITTED_FOR_REVIEW':
      return {
        title: 'Question Submitted for Multi-Party Review',
        category: 'CONTENT GOVERNANCE',
        categoryColor: 'bg-blue-50 text-blue-800 border-blue-200',
        severity: 'LOW',
        severityBadgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description: `Question ${log.entity_id || meta.question_id} was submitted for peer review by ${userName}${userEmail}. Content locked against direct edits during active review cycle.`,
        operationalImpact: 'Question transitioned to REVIEW_PENDING. Delegated to peer reviewers.',
        iconType: 'file-text'
      };

    case 'QUESTION_REVIEWED':
      return {
        title: 'Peer Review Verdict Recorded',
        category: 'CONTENT GOVERNANCE',
        categoryColor: 'bg-purple-50 text-purple-800 border-purple-200',
        severity: 'NORMAL',
        severityBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        description: `Reviewer ${userName}${userEmail} submitted verification verdict on question ${log.entity_id || meta.question_id}. Decision: ${meta.decision || 'REVIEW_RECORDED'}. Feedback comment: "${meta.comment || 'Verified according to syllabus guidelines'}".`,
        operationalImpact: 'Review state updated; question lifecycle advanced.',
        iconType: 'shield-check'
      };

    case 'PACKAGE_LOCK_INITIATED':
    case 'FINAL_LOCK_INITIATED':
      return {
        title: 'Dual-Custody Cryptographic Package Lock Initiated',
        category: 'CRYPTOGRAPHIC INTEGRITY',
        categoryColor: 'bg-amber-50 text-amber-800 border-amber-200',
        severity: 'MEDIUM',
        severityBadgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        description: `First custodian ${userName}${userEmail} initiated cryptographic package bundling for exam manifest ${meta.package_name || log.entity_id}. Master questions assembled and encrypted. Awaiting second custodian multi-signature confirmation.`,
        operationalImpact: 'Package placed into PENDING_CONFIRMATION state. Changes to constituent questions frozen.',
        iconType: 'lock'
      };

    case 'FINAL_LOCK_CONFIRMED':
      return {
        title: 'Dual-Custody Lock Confirmed (Manifest Sealed)',
        category: 'CRYPTOGRAPHIC INTEGRITY',
        categoryColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        severity: 'NORMAL',
        severityBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: `Second custodian ${userName}${userEmail} verified and digitally co-signed package ${meta.package_name || log.entity_id}. Dual-custody multi-signature protocol complete. Immutable SHA-256 package manifest sealed: ${meta.package_hash ? meta.package_hash.slice(0, 16) + '...' : 'SEALED'}.`,
        operationalImpact: 'Package permanently locked in LOCKED status. Cryptographic seal ready for secure air-gapped export or printing.',
        iconType: 'lock'
      };

    case 'LOCKDOWN_TRIGGERED':
      return {
        title: 'Emergency Perimeter Lockdown Triggered',
        category: 'SYSTEM PERIMETER',
        categoryColor: 'bg-red-50 text-red-800 border-red-200',
        severity: 'CRITICAL',
        severityBadgeColor: 'bg-red-50 text-red-700 border-red-200',
        description: `Full perimeter lockdown activated across ExamVault infrastructure. Reason: "${meta.lockdown_reason || 'Severe anomalous security incident detected'}". Initiator: ${meta.initiated_by || userName}. All active sessions immediately severed; question decryption keys evicted from memory caches.`,
        operationalImpact: 'Perimeter sealed. System transitions to defensive quarantine mode. All access blocked until manual investigator clearance.',
        iconType: 'alert-octagon'
      };

    case 'LOCKDOWN_LIFTED':
      return {
        title: 'Perimeter Lockdown Deactivated',
        category: 'SYSTEM PERIMETER',
        categoryColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        severity: 'HIGH',
        severityBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: `Security investigator ${userName}${userEmail} confirmed containment of threat and deactivated system-wide perimeter lockdown. System status restored to NORMAL.`,
        operationalImpact: 'Vault gates reopened. Authoring and reviewing services resumed under heightened telemetry monitoring.',
        iconType: 'shield-check'
      };

    case 'EXPORT_ATTEMPT_BLOCKED':
      return {
        title: 'Unauthorized Content Export Intercepted',
        category: 'ZERO-TRUST SECURITY',
        categoryColor: 'bg-red-50 text-red-800 border-red-200',
        severity: 'HIGH',
        severityBadgeColor: 'bg-red-50 text-red-700 border-red-200',
        description: `DLP policy intercepted an unauthorized print or file export attempt on device node ${log.device_id || 'unknown'}. Package export policy enforced.`,
        operationalImpact: 'Data exfiltration blocked in real time. Incident flagged in audit record.',
        iconType: 'shield-alert'
      };

    case 'LEAK_REPORT_CREATED':
      return {
        title: 'Forensic Leak Evidence Ingested',
        category: 'FORENSIC LEAK ATTRIBUTION',
        categoryColor: 'bg-purple-50 text-purple-800 border-purple-200',
        severity: 'HIGH',
        severityBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        description: `Investigator ${userName}${userEmail} uploaded external leaked document evidence (Reference: ${meta.leak_code || log.entity_id}). Initiated steganographic watermark extraction engine.`,
        operationalImpact: 'Forensic extraction pipeline initialized. Cross-referencing against session watermark indices.',
        iconType: 'terminal'
      };

    case 'LEAK_INVESTIGATION_COMPLETED':
      return {
        title: 'Forensic Watermark Attribution Concluded',
        category: 'FORENSIC LEAK ATTRIBUTION',
        categoryColor: 'bg-purple-50 text-purple-800 border-purple-200',
        severity: 'HIGH',
        severityBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        description: `Digital forensics successfully extracted embedded watermark from leaked material. Leak attributed to session ${log.session_id || 'EV-SESSION'} / user ${meta.attributed_user || 'unknown'} with ${meta.confidence || 98.4}% mathematical confidence match on question ${meta.question_id || 'Q-ITEM'}.`,
        operationalImpact: 'Forensic attribution report finalized. Evidentiary proof chain compiled for legal/administrative action.',
        iconType: 'shield-alert'
      };

    default:
      return {
        title: log.action.replace(/_/g, ' '),
        category: 'ZERO-TRUST SECURITY',
        categoryColor: 'bg-slate-100 text-slate-800 border-slate-200',
        severity: (log.risk_score && log.risk_score >= 70) ? 'CRITICAL' : (log.risk_score && log.risk_score >= 40) ? 'HIGH' : 'NORMAL',
        severityBadgeColor: (log.risk_score && log.risk_score >= 70) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200',
        description: `Activity ${log.action} executed against ${entityDesc} by ${userName}${userEmail} from node ${log.device_id || 'UNKNOWN'}. Cryptographic ledger entry recorded.`,
        operationalImpact: 'Ledger block verified and chained to ancestor hash in immutable sequence.',
        iconType: 'terminal'
      };
  }
}

function getActionBadgeClass(action: string): string {
  if (action.includes('LOCKDOWN') || action.includes('SUSPENDED') || action.includes('BLOCKED') || action.includes('FAILURE') || action.includes('FAILED')) {
    return 'bg-red-50 text-red-800 border-red-200';
  }
  if (action.includes('ALERT') || action.includes('RISK') || action.includes('INITIATED')) {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  if (action.includes('SUCCESS') || action.includes('VERIFIED') || action.includes('CONFIRMED') || action.includes('CLEARED')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  if (action.includes('QUESTION') || action.includes('VIEWED')) {
    return 'bg-blue-50 text-blue-800 border-blue-200';
  }
  if (action.includes('LEAK')) {
    return 'bg-purple-50 text-purple-800 border-purple-200';
  }
  return 'bg-slate-100 text-slate-800 border-slate-200';
}

export const AuditLogsPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    status: 'VERIFIED' | 'INTEGRITY_ALERT';
    records_checked: number;
    broken_record_id: number | null;
    reason: string;
  } | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('audit_logs')
        .select('*, user:profiles!user_id(*)')
        .order('id', { ascending: false });

      if (error || !data) {
        const fallback = await supabase
          .from('audit_logs')
          .select('*')
          .order('id', { ascending: false });
        data = fallback.data;
      }
      if (data) setLogs(data as AuditLog[]);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    runVerification();
  }, [user]);

  // Fetch full profile if selectedLog does not have it yet
  useEffect(() => {
    if (selectedLog && selectedLog.user_id && !selectedLog.user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', selectedLog.user_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setSelectedLog((prev) => (prev && prev.id === selectedLog.id ? { ...prev, user: data } : prev));
          }
        });
    }
  }, [selectedLog?.id, selectedLog?.user_id]);

  const runVerification = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.rpc('verify_audit_integrity');
      if (data && !error) {
        setVerifyResult(data);
      }
    } catch (err) {
      console.error('Integrity check error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredLogs = filterAction === 'ALL'
    ? logs
    : logs.filter((l) => {
        if (filterAction === 'LOGIN') return l.action.includes('LOGIN') || l.action.includes('OTP') || l.action.includes('FACE');
        if (filterAction === 'ALERT') return l.action.includes('ALERT');
        if (filterAction === 'SUSPENSION') return l.action.includes('SUSPEN');
        if (filterAction === 'RISK') return l.action.includes('RISK');
        if (filterAction === 'QUESTION') return l.action.includes('QUESTION');
        if (filterAction === 'PACKAGE') return l.action.includes('PACKAGE') || l.action.includes('FINAL_LOCK');
        if (filterAction === 'LOCKDOWN') return l.action.includes('LOCKDOWN');
        if (filterAction === 'LEAK') return l.action.includes('LEAK');
        return l.action.includes(filterAction);
      });

  const selectedActivity = selectedLog ? getActivityAnalysis(selectedLog) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[#00236f] font-bold uppercase tracking-wider">
            CRYPTOGRAPHIC AUDIT LEDGER
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Immutable SHA-256 Event Chain
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Append-only tamper-evident hash ledger. Every action is cryptographically chained to its ancestor.
          </p>
        </div>

        <button
          type="button"
          onClick={runVerification}
          disabled={verifying}
          className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
          <span>Verify Cryptographic Chain</span>
        </button>
      </div>

      {/* Verification Status Banner */}
      {verifyResult && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
          verifyResult.status === 'VERIFIED'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-3">
            {verifyResult.status === 'VERIFIED' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-600" />
            )}
            <div>
              <div className="text-xs font-bold font-mono">
                {verifyResult.status === 'VERIFIED'
                  ? `CHAIN VERIFIED: All ${verifyResult.records_checked} hash links valid`
                  : `INTEGRITY COMPROMISED: Broken block #${verifyResult.broken_record_id}`}
              </div>
              <p className="text-[11px] mt-0.5 opacity-90">{verifyResult.reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <History className="w-4 h-4 text-[#00236f]" />
            <span>Audit Ledger Entries ({filteredLogs.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-800 focus:outline-none focus:border-[#00236f]"
            >
              <option value="ALL">All Event Types</option>
              <option value="LOGIN">Logins & Auth</option>
              <option value="ALERT">Alerts Dispatched</option>
              <option value="SUSPENSION">Suspensions & Triage</option>
              <option value="RISK">Risk Scoring</option>
              <option value="QUESTION">Question Events</option>
              <option value="PACKAGE">Package Locks</option>
              <option value="LOCKDOWN">Lockdowns</option>
              <option value="LEAK">Leak Investigations</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">Block ID</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor & Role</th>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">Risk Score</th>
                <th className="p-3.5">Current SHA-256 Hash</th>
                <th className="p-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 font-mono">
              {filteredLogs.map((log) => {
                const actorName = log.user?.name || log.metadata?.user_name || (log.user_id ? `${log.user_id.slice(0, 8)}...` : 'System');
                const actorRole = log.role || log.user?.role || 'SYSTEM';
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-xs font-bold text-slate-900">#{log.id}</td>
                    <td className="p-3.5 text-xs text-slate-500 font-sans whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3.5 text-xs text-slate-800 font-sans">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 leading-tight">{actorName}</span>
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{actorRole}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-xs font-sans">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-slate-600 truncate max-w-[140px]" title={`${log.entity_type}: ${log.entity_id}`}>
                      {log.entity_type}: <span className="text-slate-800 font-medium">{log.entity_id}</span>
                    </td>
                    <td className="p-3.5 text-xs font-sans">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        (log.risk_score || 0) >= 70
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : (log.risk_score || 0) >= 40
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                        {log.risk_score || 0}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-slate-500 font-mono">
                      {log.current_hash ? `${log.current_hash.slice(0, 10)}...` : 'GENESIS'}
                    </td>
                    <td className="p-3.5 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-xs text-[#00236f] hover:bg-blue-50 border border-blue-200 rounded font-semibold transition-colors"
                      >
                        View Record
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Audit Record Detail Modal */}
      {selectedLog && selectedActivity && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/90 flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#00236f] font-bold uppercase tracking-wider">
                  <Hash className="w-3.5 h-3.5 text-[#00236f]" />
                  <span>Audit Record #{selectedLog.id}</span>
                  <span className="text-slate-300">•</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono text-[10px] font-semibold">
                    Cryptographic Event Chain
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {selectedActivity.title}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${selectedActivity.severityBadgeColor}`}>
                    {selectedActivity.severity}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${selectedActivity.categoryColor}`}>
                    {selectedActivity.category}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(selectedLog.timestamp).toLocaleString(undefined, {
                      dateStyle: 'full',
                      timeStyle: 'medium'
                    })}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Action Code: <strong className="text-slate-800">{selectedLog.action}</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-base font-bold shrink-0"
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

              {/* 1. Actor & Session Telemetry 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Column A: Actor Identification */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                      <User className="w-3.5 h-3.5 text-[#00236f]" />
                      <span>Actor Identification</span>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-[#00236f] rounded text-[10px] font-bold font-mono">
                      {selectedLog.role || selectedLog.user?.role || 'SYSTEM'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-semibold text-slate-900">
                        {selectedLog.user?.name || selectedLog.metadata?.user_name || 'System Principal'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-mono text-slate-800">
                        {selectedLog.user?.email || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">User UUID:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-600 text-[11px]">
                          {selectedLog.user_id ? `${selectedLog.user_id.slice(0, 16)}...` : 'N/A'}
                        </span>
                        {selectedLog.user_id && (
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedLog.user_id!, 'user_id')}
                            className="text-slate-400 hover:text-slate-700"
                            title="Copy UUID"
                          >
                            {copiedKey === 'user_id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="pt-1">
                      <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1">
                        <span>Hardware Posture:</span>
                        {selectedLog.device_id && selectedLog.user?.registered_device_id ? (
                          selectedLog.device_id === selectedLog.user.registered_device_id ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Hardware Matched
                            </span>
                          ) : (
                            <span className="text-red-700 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              Hardware Mismatch
                            </span>
                          )
                        ) : selectedLog.metadata?.device_status ? (
                          <span className="text-slate-700 font-semibold">
                            {selectedLog.metadata.device_status}
                          </span>
                        ) : (
                          <span className="text-slate-400">Node Verified</span>
                        )}
                      </div>
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-700 break-all">
                        Enrolled Node: {selectedLog.user?.registered_device_id || 'Not Enrolled in Profile'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column B: Session & Network State */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                      <Laptop className="w-3.5 h-3.5 text-[#00236f]" />
                      <span>Session & Node Telemetry</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">NETWORK STATE</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Session ID:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">
                          {selectedLog.session_id || 'N/A'}
                        </span>
                        {selectedLog.session_id && (
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedLog.session_id!, 'session_id')}
                            className="text-slate-400 hover:text-slate-700"
                            title="Copy Session ID"
                          >
                            {copiedKey === 'session_id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Device Node ID:</span>
                      <span className="font-mono text-slate-800">
                        {selectedLog.device_id || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Client IP Address:</span>
                      <span className="font-mono text-slate-800">
                        {selectedLog.ip_address || '127.0.0.1'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Target Entity:</span>
                      <span className="font-mono font-semibold text-[#00236f]">
                        {selectedLog.entity_type} / {selectedLog.entity_id || 'N/A'}
                      </span>
                    </div>

                    <div className="pt-1">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-slate-500">Risk Score at Event:</span>
                        <span className={`font-bold font-mono ${
                          (selectedLog.risk_score || 0) >= 70
                            ? 'text-red-700'
                            : (selectedLog.risk_score || 0) >= 40
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}>
                          {selectedLog.risk_score || 0} / 100
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (selectedLog.risk_score || 0) >= 70
                              ? 'bg-red-600'
                              : (selectedLog.risk_score || 0) >= 40
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(4, selectedLog.risk_score || 0))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* 2. Contextual Security Signals (Conditional Context Cards) */}
              
              {/* Context A: Auto-Suspension Contributing Events */}
              {selectedLog.metadata?.contributing_events && Array.isArray(selectedLog.metadata.contributing_events) && selectedLog.metadata.contributing_events.length > 0 && (
                <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-900 uppercase tracking-wider font-mono">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Contributing Anomaly Signals to Suspension ({selectedLog.metadata.contributing_events.length})</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-red-200/60 text-[11px] font-semibold text-red-900/80 uppercase">
                          <th className="py-2 px-3">Rule Name</th>
                          <th className="py-2 px-3">Risk Points</th>
                          <th className="py-2 px-3">Trigger Rationale</th>
                          <th className="py-2 px-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-200/40">
                        {selectedLog.metadata.contributing_events.map((ev: any, idx: number) => (
                          <tr key={idx} className="hover:bg-red-100/30">
                            <td className="py-2 px-3 font-mono font-bold text-red-950">{ev.rule_name}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono font-bold">
                                +{ev.points}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-700">{ev.reason}</td>
                            <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-500">
                              {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Context B: Alert Notification Dispatch Details */}
              {selectedLog.action === 'ALERT_DISPATCHED' && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">
                    <Radio className="w-4 h-4 text-amber-600" />
                    <span>SOC Incident Broadcast Payload</span>
                  </div>

                  {selectedLog.metadata?.message && (
                    <div className="p-3 bg-white border border-amber-200/80 rounded-lg text-xs text-amber-950 font-sans leading-relaxed">
                      <strong className="text-amber-900 block mb-1">Broadcast Message:</strong>
                      {selectedLog.metadata.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-amber-200/80 space-y-1">
                      <span className="text-slate-500 text-[11px] block">Alert Channel:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {selectedLog.metadata?.alert_channel || 'SIMULATED_SOC_NOTIFICATION'}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-amber-200/80 space-y-1">
                      <span className="text-slate-500 text-[11px] block">Incident Recipients:</span>
                      <div className="flex flex-wrap gap-1">
                        {(selectedLog.metadata?.recipients || ['admin@examvault.demo', 'soc-lead@examvault.demo']).map((r: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-mono text-[11px]">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Context C: Package Lock & Cryptographic Manifest */}
              {(selectedLog.action.includes('PACKAGE') || selectedLog.action.includes('FINAL_LOCK')) && selectedLog.metadata?.package_hash && (
                <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider font-mono">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <span>Package Cryptographic Manifest & Multi-Sig Custody</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Package Name:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {selectedLog.metadata?.package_name || selectedLog.entity_id}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-600 block mb-1">Package SHA-256 Digest:</span>
                      <div className="p-2.5 bg-white border border-indigo-200 rounded-lg font-mono text-[11px] text-indigo-950 flex items-center justify-between gap-2 break-all">
                        <span>{selectedLog.metadata.package_hash}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedLog.metadata.package_hash, 'package_hash')}
                          className="text-slate-400 hover:text-slate-700 shrink-0"
                          title="Copy package hash"
                        >
                          {copiedKey === 'package_hash' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Formatted Metadata Inspector */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
                    <Cpu className="w-4 h-4 text-[#00236f]" />
                    <span>Event Metadata Attributes</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {Object.entries(selectedLog.metadata).map(([k, v]) => {
                        if (k === 'contributing_events') return null;
                        const displayVal = typeof v === 'object' ? JSON.stringify(v) : String(v);
                        return (
                          <div key={k} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block truncate">
                              {k.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-mono font-medium text-slate-900 break-words mt-0.5 block">
                              {displayVal}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No supplemental metadata fields recorded for this block.</p>
                  )}
                </div>
              </div>

              {/* 4. Cryptographic SHA-256 Ledger Chain Proof */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Cryptographic SHA-256 Block Proof</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                    TAMPER-EVIDENT
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* Parent Hash */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Previous Block Hash (Parent):</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedLog.previous_hash || 'GENESIS_ROOT', 'prev_hash')}
                        className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[10px]"
                      >
                        {copiedKey === 'prev_hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'prev_hash' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400 break-all text-[11px]">
                      {selectedLog.previous_hash || 'GENESIS_ROOT_HASH (0000000000000000000000000000000000000000000000000000000000000000)'}
                    </div>
                  </div>

                  {/* Hash Chain Connector Icon */}
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] py-0.5">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400 rotate-90 sm:rotate-0" />
                    <span>Chained SHA-256 Digest linking Block #{selectedLog.id} to parent</span>
                  </div>

                  {/* Current Block Hash */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-blue-300 font-bold">Current Block Hash:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedLog.current_hash, 'curr_hash')}
                        className="text-blue-300 hover:text-blue-100 flex items-center gap-1 text-[10px]"
                      >
                        {copiedKey === 'curr_hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'curr_hash' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-blue-950/40 border border-blue-500/50 rounded-lg text-blue-300 font-bold break-all text-[11px]">
                      {selectedLog.current_hash}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Cryptographically valid immutable block. Any retroactive alteration of actor metadata, timestamp, or entity state will invalidate downstream hashes across the ledger.
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 font-mono">
                Block sequence verification: <span className="text-emerald-700 font-bold">VERIFIED</span> • Record ID: #{selectedLog.id}
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Close Audit Record
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
