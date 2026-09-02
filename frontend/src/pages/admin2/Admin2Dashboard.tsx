import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, XCircle, AlertCircle, FileCheck, Hash, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ExamPackage } from '../../types';
import { PackageStatusBadge } from '../../components/common/Badge';
import { GlowCard } from '../../components/ui/spotlight-card';

export const Admin2Dashboard: React.FC = () => {
  const { user, session } = useAuth();
  const [packages, setPackages] = useState<ExamPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedPkgForReject, setSelectedPkgForReject] = useState<string | null>(null);
  const [manifestModalPkg, setManifestModalPkg] = useState<ExamPackage | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadPackages = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('exam_packages')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setPackages(data as ExamPackage[]);
    } catch (err) {
      console.error('Failed to load dual control packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [user]);

  const handleConfirmLock = async (pkgId: string) => {
    if (!user) return;
    setProcessingId(pkgId);
    setStatusMsg('');
    setErrorMsg('');

    try {
      const { data, error } = await supabase.rpc('confirm_package_lock', {
        p_package_id: pkgId,
        p_session_id: session?.id,
        p_user_id: user.id,
      });

      if (error || !data?.success) {
        setErrorMsg(data?.error || 'Dual confirmation failed.');
      } else {
        setStatusMsg(`✓ Package FINAL LOCKED! Cryptographic Hash: ${data.package_hash || data.manifest_hash}`);
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.6 }
        });
        await loadPackages();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error during dual confirmation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPackage = async (pkgId: string) => {
    if (!user) return;
    if (!rejectReason.trim()) {
      setErrorMsg('Rejection reason is mandatory.');
      return;
    }

    setProcessingId(pkgId);
    setStatusMsg('');
    setErrorMsg('');

    try {
      const { data, error } = await supabase.rpc('reject_package', {
        p_package_id: pkgId,
        p_session_id: session?.id,
        p_user_id: user.id,
        p_reason: rejectReason.trim(),
      });

      if (error || !data?.success) {
        setErrorMsg(data?.error || 'Failed to reject package');
      } else {
        setStatusMsg('Package rejected and returned to Approver.');
        setSelectedPkgForReject(null);
        setRejectReason('');
        await loadPackages();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error during package rejection');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingPackages = packages.filter(p => p.status === 'PENDING_DUAL_CONFIRMATION');
  const lockedPackages = packages.filter(p => p.status === 'FINAL_LOCKED');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching Stitch */}
      <GlowCard glowColor="blue" className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[#00236f] font-bold uppercase tracking-wider">
            DUAL-CUSTODY AUTHORIZATION GATE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {user?.name || 'Admin_2'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Independent dual-authorization terminal. No examination package can be sealed or decrypted without your cryptographic secondary confirmation.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-blue-900 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00236f]" />
          <span>Dual Lock #2 Gatekeeper</span>
        </div>
      </GlowCard>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Pending Dual Lock Queue Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
          Pending Dual-Lock Queue ({pendingPackages.length})
        </h2>

        {pendingPackages.length === 0 ? (
          <GlowCard glowColor="blue" className="p-8 text-center text-xs text-slate-400">
            Zero packages currently pending Lock #2 confirmation.
          </GlowCard>
        ) : (
          pendingPackages.map((pkg) => (
            <GlowCard
              key={pkg.id}
              glowColor="blue"
              className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">{pkg.package_name}</span>
                  <PackageStatusBadge status={pkg.status} />
                </div>
                <div className="text-xs font-medium text-slate-700">{pkg.exam_name}</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Contains {pkg.question_ids?.length || 0} questions • Initiated by Approver_1
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPkgForReject(pkg.id)}
                  disabled={processingId === pkg.id}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-semibold transition-colors"
                >
                  Reject &amp; Return
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmLock(pkg.id)}
                  disabled={processingId === pkg.id}
                  className="px-4 py-1.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  {processingId === pkg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>Sign &amp; Final Lock (2/2)</span>
                </button>
              </div>
            </GlowCard>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      {selectedPkgForReject && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Reject Exam Package</h3>
            <p className="text-xs text-slate-500">Provide rejection reasoning for Approver.</p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Question balance incorrect..."
              className="w-full p-2.5 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#00236f]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPkgForReject(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-md text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRejectPackage(selectedPkgForReject)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Locked Packages Table */}
      <GlowCard glowColor="emerald" className="rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <FileCheck className="w-4 h-4 text-[#00236f]" />
            <span>Sealed &amp; Final Locked Packages</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">{lockedPackages.length} sealed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">Package ID</th>
                <th className="p-3.5">Exam Name</th>
                <th className="p-3.5">Manifest Hash (SHA-256)</th>
                <th className="p-3.5">Locked At</th>
                <th className="p-3.5 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {lockedPackages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-mono text-xs font-bold text-slate-900">{pkg.package_name}</td>
                  <td className="p-3.5 text-xs text-slate-800 font-medium">{pkg.exam_name}</td>
                  <td className="p-3.5 font-mono text-xs text-slate-600">
                    {pkg.package_hash ? `${pkg.package_hash.slice(0, 16)}...` : 'Pending'}
                  </td>
                  <td className="p-3.5 text-xs text-slate-500 font-mono">
                    {new Date(pkg.locked_at || pkg.created_at).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setManifestModalPkg(pkg)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-xs font-mono font-medium text-slate-700"
                    >
                      Inspect Hash
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>

      {/* Manifest Certificate Modal */}
      {manifestModalPkg && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl w-full space-y-4 shadow-xl font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Cryptographic Package Certificate</h3>
              <button onClick={() => setManifestModalPkg(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div>Package: <strong className="text-slate-900">{manifestModalPkg.package_name}</strong></div>
              <div>SHA-256 Hash: <strong className="text-blue-900 break-all">{manifestModalPkg.package_hash}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
