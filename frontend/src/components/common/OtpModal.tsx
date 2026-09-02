import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface OtpModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const OtpModal: React.FC<OtpModalProps> = ({ isOpen, onSuccess, onCancel }) => {
  const { pendingOtpChallenge, verifyOtp, loginPendingUser, deviceMode } = useAuth();
  const [otpValue, setOtpValue] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (!isOpen) {
      setOtpValue('');
      setError('');
      setTimeLeft(120);
      return;
    }

    if (pendingOtpChallenge?.otp) {
      // Auto-prefill for smooth demo workflow
      setOtpValue(pendingOtpChallenge.otp);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, pendingOtpChallenge]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setIsVerifying(true);
    setError('');

    const res = await verifyOtp(otpValue);
    setIsVerifying(false);

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'OTP verification failed');
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Simulated 2FA Authentication</h3>
              <p className="text-xs text-slate-400 font-mono">STEP 2 OF 3 • IDENTITY CHALLENGE</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Demo Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-300">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Simulated MFA Challenge (Hackathon Prototype)</span>
            </div>
            <p className="text-amber-200/80 leading-relaxed">
              In production, this OTP is delivered via secure hardware token or SMS. For this prototype evaluation, your test token is generated below:
            </p>
            <div className="mt-2.5 p-2 bg-slate-950/70 rounded border border-amber-500/30 font-mono text-center text-sm font-bold text-amber-300 tracking-widest">
              DEMO OTP: {pendingOtpChallenge?.otp || '482913'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-300 font-medium">Enter 6-Digit Passcode</label>
              <div className="flex items-center gap-1 text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
              </div>
            </div>
            <input
              type="text"
              maxLength={6}
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-[0.6em] font-mono text-2xl py-3 px-4 bg-slate-950 border border-slate-700 rounded-xl text-cyan-400 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              autoFocus
            />
          </div>

          {/* User & Device Context */}
          <div className="text-xs font-mono bg-slate-950/40 p-3 rounded-lg border border-slate-800 space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Account:</span>
              <span className="text-slate-200 font-semibold">{loginPendingUser?.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Device Context:</span>
              <span className={deviceMode === 'REGISTERED' ? 'text-emerald-400' : 'text-rose-400'}>
                {deviceMode === 'REGISTERED' ? '✓ Registered Device' : '⚠ Unknown / Untrusted Node (+35 Risk)'}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-1/3 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-xl transition-colors text-center"
              >
                &larr; Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isVerifying || otpValue.length !== 6 || timeLeft === 0}
              className={`py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2 ${
                onCancel ? 'w-full sm:w-2/3' : 'w-full'
              }`}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Challenge...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Proceed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
