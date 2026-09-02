import React, { useState } from 'react';
import { Camera, CheckCircle2, XCircle, ShieldAlert, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface FaceModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onCancel?: () => void;
}

export const FaceModal: React.FC<FaceModalProps> = ({ isOpen, onComplete, onCancel }) => {
  const { recordFaceResult } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChoice = async (verified: boolean) => {
    setSubmitting(true);
    await recordFaceResult(verified);
    setSubmitting(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Simulated Liveness Check</h3>
              <p className="text-xs text-slate-400 font-mono">STEP 3 OF 3 • BIOMETRIC RISK CONTEXT</p>
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Privacy Disclaimer */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Privacy by Design Notice</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              ExamVault stores strictly a boolean <code className="text-cyan-300">true / false</code> result. Raw webcam feeds, facial images, and biometric embeddings are never captured or retained.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center py-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 relative animate-pulse-subtle">
              <Camera className="w-8 h-8" />
              <div className="absolute -inset-1 rounded-full border border-cyan-500/20 animate-ping" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Simulate Biometric Verification</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Select a verification outcome to simulate either a normal session or a high-risk anomaly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleChoice(true)}
              className="p-3.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 rounded-xl text-emerald-300 text-xs font-semibold flex flex-col items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/30"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Face Verified</span>
                  <span className="text-[10px] text-emerald-400/70 font-mono font-normal">Normal (+0 Risk)</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleChoice(false)}
              className="p-3.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-700/50 rounded-xl text-rose-300 text-xs font-semibold flex flex-col items-center gap-1.5 transition-all shadow-lg shadow-rose-950/30"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>Simulate Face Failure</span>
                  <span className="text-[10px] text-rose-400/70 font-mono font-normal">Anomaly (+35 Risk)</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Face failure does not hard-block login; it adds risk signals for review.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
