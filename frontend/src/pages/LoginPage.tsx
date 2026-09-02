import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { OtpModal } from '../components/common/OtpModal';
import { FaceModal } from '../components/common/FaceModal';
import { DeviceMatchStatus, AppRole } from '../types';

import GatewayFlow from '../components/ui/gateway-flow';
import { LiquidMetalButton } from '../components/ui/liquid-metal-button';
import { GlowCard } from '../components/ui/spotlight-card';

export const LoginPage: React.FC = () => {
  const { initiateLogin, user, suspendedNotice, lockdownState } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const demoAccounts = [
    { name: 'Setter_A', email: 'setter_a@examvault.com', role: 'SETTER' as AppRole, icon: 'edit_note' },
    { name: 'Reviewer_B', email: 'reviewer_b@examvault.com', role: 'REVIEWER' as AppRole, icon: 'rate_review' },
    { name: 'Approver_C', email: 'approver_c@examvault.com', role: 'APPROVER' as AppRole, icon: 'verified_user' },
    { name: 'Admin_2', email: 'admin2@examvault.com', role: 'ADMIN_2' as AppRole, icon: 'admin_panel_settings' },
    { name: 'Investigator', email: 'investigator@examvault.com', role: 'INVESTIGATOR' as AppRole, icon: 'search_check' },
  ];

  // Resolve initial email from URL query if present
  const initialEmail = () => {
    const qEmail = searchParams.get('email');
    const qRole = searchParams.get('role');
    if (qEmail) return qEmail;
    if (qRole) {
      const match = demoAccounts.find(a => a.role.toUpperCase() === qRole.toUpperCase());
      if (match) return match.email;
    }
    return 'setter_a@examvault.com';
  };

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [deviceMode, setDeviceModeState] = useState<DeviceMatchStatus>('REGISTERED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals state
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isFaceOpen, setIsFaceOpen] = useState(false);

  // Sync state if search params change dynamically
  useEffect(() => {
    const qEmail = searchParams.get('email');
    const qRole = searchParams.get('role');
    if (qEmail) {
      setEmail(qEmail);
      setPassword('password123');
      setError('');
    } else if (qRole) {
      const match = demoAccounts.find(a => a.role.toUpperCase() === qRole.toUpperCase());
      if (match) {
        setEmail(match.email);
        setPassword('password123');
        setError('');
      }
    }
  }, [searchParams]);

  // If already authenticated and not in modal, redirect to role dashboard
  useEffect(() => {
    if (user && !isOtpOpen && !isFaceOpen) {
      if (user.role === 'SETTER') navigate('/setter/dashboard', { replace: true });
      else if (user.role === 'REVIEWER') navigate('/reviewer/dashboard', { replace: true });
      else if (user.role === 'APPROVER') navigate('/approver/dashboard', { replace: true });
      else if (user.role === 'ADMIN_2') navigate('/admin2/dashboard', { replace: true });
      else if (user.role === 'INVESTIGATOR') navigate('/investigator/dashboard', { replace: true });
    }
  }, [user, isOtpOpen, isFaceOpen, navigate]);

  const handleQuickFill = (accEmail: string, accRole?: AppRole) => {
    setEmail(accEmail);
    setPassword('password123');
    setError('');
    if (accRole) {
      setSearchParams({ role: accRole, email: accEmail }, { replace: true });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await initiateLogin(email, password, deviceMode);
    setLoading(false);

    if (res.success) {
      setIsOtpOpen(true);
    } else {
      setError(res.error || 'Invalid email or password');
    }
  };

  const handleOtpSuccess = () => {
    setIsOtpOpen(false);
    setIsFaceOpen(true);
  };

  const handleFaceComplete = () => {
    setIsFaceOpen(false);
    if (user?.role === 'SETTER') navigate('/setter/dashboard');
    else if (user?.role === 'REVIEWER') navigate('/reviewer/dashboard');
    else if (user?.role === 'APPROVER') navigate('/approver/dashboard');
    else if (user?.role === 'ADMIN_2') navigate('/admin2/dashboard');
    else if (user?.role === 'INVESTIGATOR') navigate('/investigator/dashboard');
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans antialiased text-[#1a1b21]">
      {/* Dynamic Edge-to-Edge Gateway Flow Background */}
      <GatewayFlow
        mode="light"
        speed={0.9}
        density={1.0}
        strokeWidth={1.2}
        opacity={0.85}
      />

      {/* Top Session / Lockdown Alert Banner */}
      {lockdownState?.is_locked && (
        <div className="fixed top-0 inset-x-0 bg-red-50 border-b border-red-200 z-50 py-3 px-4 sm:px-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-red-600 text-white">
                <AlertCircle className="w-4 h-4" />
              </span>
              <p className="text-sm font-medium text-red-900">
                <span>EMERGENCY SYSTEM LOCKDOWN ACTIVE: Non-investigator access is temporarily restricted. Only Investigator personnel can authenticate.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {suspendedNotice && (
        <div className="fixed top-0 inset-x-0 bg-amber-50 border-b border-amber-200 z-50 py-3 px-4 sm:px-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-amber-600 text-white">
              <AlertCircle className="w-4 h-4" />
            </span>
            <p className="text-sm font-medium text-amber-900">{suspendedNotice}</p>
          </div>
        </div>
      )}

      {/* Header with Logo Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-2 mb-4">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <path
                d="M24 3L42 12V27C42 36.5 34.5 43.5 24 46C13.5 43.5 6 36.5 6 27V12L24 3Z"
                stroke="#00236f"
                strokeWidth="3.5"
                strokeLinejoin="round"
                fill="#f4f3fa"
              />
              <circle
                cx="24"
                cy="24"
                r="8"
                stroke="#1e3a8a"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              <rect x="20" y="23" width="8" height="7" rx="1.5" fill="#00236f" />
              <circle cx="24" cy="26" r="1.2" fill="#ffffff" />
            </svg>
          </div>
        </div>
        <h2 className="mt-1 text-center text-3xl font-bold tracking-tight text-slate-900">
          ExamVault
        </h2>
        <p className="mt-1.5 text-center text-sm text-slate-500">
          Enterprise Security Gateway
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-[480px] z-10 relative">
        <GlowCard glowColor="blue" className="py-8 px-6 sm:px-10 shadow-sm border border-slate-200">
          {/* Demo Quick Fill Environments */}
          <div className="mb-6 pb-5 border-b border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              DEMO ENVIRONMENTS
            </p>
            <div className="flex space-x-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {demoAccounts.map((acc) => {
                const isSelected = email.toLowerCase() === acc.email.toLowerCase();
                const isLockedOut = lockdownState?.is_locked && acc.role !== 'INVESTIGATOR';

                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickFill(acc.email, acc.role)}
                    className={`flex-shrink-0 inline-flex items-center px-3 py-1.5 border rounded-md text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-[#00236f] bg-blue-50/60 text-[#00236f] font-semibold shadow-xs'
                        : isLockedOut
                        ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] mr-1.5 text-slate-500">
                      {acc.icon}
                    </span>
                    <span>{acc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleLoginSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-3 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Enterprise ID
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-200 rounded-md shadow-2xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00236f] focus:border-[#00236f] text-sm text-slate-900 bg-white"
                  placeholder="admin@examvault.internal"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Passphrase
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-200 rounded-md shadow-2xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00236f] focus:border-[#00236f] text-sm text-slate-900 pr-10 bg-white"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Device Posture
              </label>
              <div className="space-y-2 bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="devicePosture"
                    checked={deviceMode === 'REGISTERED'}
                    onChange={() => setDeviceModeState('REGISTERED')}
                    className="h-4 w-4 text-[#00236f] focus:ring-[#00236f] border-slate-300"
                  />
                  <span className="ml-2.5 block text-xs text-slate-700">
                    Registered corporate device
                  </span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="devicePosture"
                    checked={deviceMode === 'UNKNOWN'}
                    onChange={() => setDeviceModeState('UNKNOWN')}
                    className="h-4 w-4 text-[#00236f] focus:ring-[#00236f] border-slate-300"
                  />
                  <span className="ml-2.5 block text-xs text-slate-700">
                    Unknown or temporary device (+35 pts risk)
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-1">
              <LiquidMetalButton
                label={loading ? "Verifying Credentials..." : "Authenticate"}
                type="submit"
                theme="navy"
                fullWidth={true}
                disabled={loading}
              />
            </div>
          </form>
        </GlowCard>

        {/* Footer */}
        <div className="mt-8 flex justify-between text-xs text-slate-500 px-2 font-mono">
          <span>© 2026 ExamVault Systems.</span>
          <a href="#" className="hover:text-slate-800 transition-colors">Security Policy</a>
        </div>
      </div>

      {/* 2FA OTP Challenge Modal */}
      <OtpModal
        isOpen={isOtpOpen}
        onSuccess={handleOtpSuccess}
        onCancel={() => setIsOtpOpen(false)}
      />

      {/* Biometric Face Verification Modal */}
      <FaceModal
        isOpen={isFaceOpen}
        onComplete={handleFaceComplete}
        onCancel={() => setIsFaceOpen(false)}
      />
    </div>
  );
};
