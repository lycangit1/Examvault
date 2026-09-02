import React, { useEffect, useState } from 'react';
import { Cpu, Printer, Server, CheckCircle2, Lock, ArrowRight, ShieldCheck, FileCheck, Hash, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ExamPackage, PackageExport } from '../../types';

export const IntegrationsPage: React.FC = () => {
  const { user, session } = useAuth();
  const [lockedPackages, setLockedPackages] = useState<ExamPackage[]>([]);
  const [exports, setExports] = useState<PackageExport[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const { data: pData } = await supabase
        .from('exam_packages')
        .select('*')
        .eq('status', 'FINAL_LOCKED');
      if (pData) {
        setLockedPackages(pData as ExamPackage[]);
        if (pData[0]) setSelectedPkgId(pData[0].id);
      }

      const { data: eData } = await supabase
        .from('package_exports')
        .select('*')
        .order('created_at', { ascending: false });
      if (eData) setExports(eData as PackageExport[]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleExport = async (type: 'PRINT' | 'CBT') => {
    if (!selectedPkgId || !user) return;
    setExporting(true);
    setError('');
    setExportResult(null);

    try {
      const { data, error: rpcErr } = await supabase.rpc('export_package_simulation', {
        p_package_id: selectedPkgId,
        p_export_type: type,
        p_user_id: user.id,
        p_session_id: session?.id,
      });

      if (rpcErr || !data) {
        setError(rpcErr?.message || 'Export failed');
      } else {
        setExportResult(data);
        await loadData();
      }
    } catch (err: any) {
      setError(err.message || 'Error exporting package');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching Stitch */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[#00236f] font-bold uppercase tracking-wider">
            AIR-GAPPED EXPORT INTEGRATIONS
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Print Press &amp; CBT Test Node Delivery
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Cryptographic export pipeline for sealed examination packages to air-gapped high-security print facilities and CBT proctoring clusters.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-blue-900 text-xs font-mono">
          <Cpu className="w-3.5 h-3.5 text-[#00236f]" />
          <span>Air-Gapped Handshake Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Export Dispatch Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Dispatch Sealed Package</h2>
            <p className="text-xs text-slate-500">Requires dual-locked status</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Sealed Package</label>
              <select
                value={selectedPkgId}
                onChange={(e) => setSelectedPkgId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#00236f]"
              >
                {lockedPackages.length === 0 ? (
                  <option value="">No Final-Locked Packages Available</option>
                ) : (
                  lockedPackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.package_name} — {p.exam_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={exporting || !selectedPkgId}
                onClick={() => handleExport('PRINT')}
                className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-center space-y-1.5 transition-colors disabled:opacity-50"
              >
                <Printer className="w-5 h-5 mx-auto text-slate-700" />
                <div className="text-xs font-bold text-slate-900">Print Press Export</div>
                <div className="text-[10px] text-slate-500">Watermarked PDF Package</div>
              </button>

              <button
                type="button"
                disabled={exporting || !selectedPkgId}
                onClick={() => handleExport('CBT')}
                className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-center space-y-1.5 transition-colors disabled:opacity-50"
              >
                <Server className="w-5 h-5 mx-auto text-[#00236f]" />
                <div className="text-xs font-bold text-slate-900">CBT Node Delivery</div>
                <div className="text-[10px] text-slate-500">Encrypted JSON Manifest</div>
              </button>
            </div>
          </div>
        </div>

        {/* Export Results / Receipts */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Dispatch Receipt &amp; Verification</h2>
            <p className="text-xs text-slate-500">Cryptographic proof of delivery</p>
          </div>

          {!exportResult ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Select a package on the left to simulate secure dispatch.
            </div>
          ) : (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                <div className="font-bold text-sm">✓ EXPORT DISPATCH AUTHORIZED</div>
                <div className="text-[11px] mt-0.5">Payload checksum matches sealed manifest.</div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-slate-700">
                <div>Channel: <strong className="text-slate-900">{exportResult.export_type}</strong></div>
                <div>Questions Count: <span className="text-slate-900">{exportResult.question_count} items</span></div>
                <div>Manifest Hash: <span className="text-blue-900 break-all">{exportResult.manifest_hash}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
