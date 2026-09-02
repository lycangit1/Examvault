import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, Hash, ArrowRight, Eye, CheckCircle2, Lock, Sparkles, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AuditLog } from '../../types';

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
  const [tampering, setTampering] = useState(false);
  const [tamperMsg, setTamperMsg] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('id', { ascending: false });
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

  const filteredLogs = filterAction === 'ALL'
    ? logs
    : logs.filter(l => l.action.includes(filterAction));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching Stitch */}
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
              <option value="LOGIN">Logins</option>
              <option value="QUESTION">Question Events</option>
              <option value="PACKAGE">Package Locks</option>
              <option value="RISK">Risk Scoring</option>
              <option value="SUSPENSION">Suspensions</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor / Role</th>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">Current SHA-256 Hash</th>
                <th className="p-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 text-xs font-bold text-slate-900">#{log.id}</td>
                  <td className="p-3.5 text-xs text-slate-500 font-sans">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3.5 text-xs text-slate-800">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px]">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs font-bold text-[#00236f] font-sans">
                    {log.action}
                  </td>
                  <td className="p-3.5 text-xs text-slate-600">
                    {log.entity_type}: {log.entity_id}
                  </td>
                  <td className="p-3.5 text-xs text-slate-500">
                    {log.current_hash ? `${log.current_hash.slice(0, 12)}...` : 'GENESIS'}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="text-xs text-[#00236f] hover:underline font-sans font-semibold"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl w-full space-y-4 shadow-xl font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Audit Record #{selectedLog.id}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 font-sans">✕</button>
            </div>
            <div className="space-y-2 text-slate-700">
              <div>Action: <strong className="text-slate-900">{selectedLog.action}</strong></div>
              <div>Entity: <strong className="text-slate-900">{selectedLog.entity_type} / {selectedLog.entity_id}</strong></div>
              <div>Session: <span className="text-slate-900">{selectedLog.session_id || 'N/A'}</span></div>
              <div>Device ID: <span className="text-slate-900">{selectedLog.device_id || 'N/A'}</span></div>
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] text-slate-400">Previous Hash (Parent):</div>
                <div className="text-slate-600 break-all">{selectedLog.previous_hash || 'GENESIS_ROOT'}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Current Hash:</div>
                <div className="text-blue-900 font-bold break-all">{selectedLog.current_hash}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
