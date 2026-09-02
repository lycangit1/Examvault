import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Activity, AlertCircle, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { RoleBadge, RiskBadge } from '../common/Badge';
import { AppRole } from '../../types';
import { LiquidMetalButton } from '../ui/liquid-metal-button';

export const Navbar: React.FC = () => {
  const { user, session, logout, switchDemoRole, lockdownState } = useAuth();
  const navigate = useNavigate();
  const [pendingRoleSwitch, setPendingRoleSwitch] = useState<AppRole | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleEmails: Record<AppRole, string> = {
    SETTER: 'setter_a@examvault.com',
    REVIEWER: 'reviewer_b@examvault.com',
    APPROVER: 'approver_c@examvault.com',
    ADMIN_2: 'admin2@examvault.com',
    INVESTIGATOR: 'investigator@examvault.com',
  };

  const handleRoleSwitch = async (targetRole: AppRole) => {
    const targetEmail = roleEmails[targetRole];
    await logout();
    navigate(`/login?role=${targetRole}&email=${encodeURIComponent(targetEmail)}`);
  };

  const onRoleButtonClick = (targetRole: AppRole) => {
    // If not logged in, go straight to login for that role
    if (!user) {
      handleRoleSwitch(targetRole);
      return;
    }

    // If already in that role, navigate to that role's dashboard
    if (user.role === targetRole) {
      navigate(getBrandDestination());
      return;
    }

    // If logged in under another role, show the Authorization Restriction Warning Modal
    setPendingRoleSwitch(targetRole);
  };

  const getBrandDestination = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'SETTER': return '/setter/dashboard';
      case 'REVIEWER': return '/reviewer/dashboard';
      case 'APPROVER': return '/approver/dashboard';
      case 'ADMIN_2': return '/admin2/dashboard';
      case 'INVESTIGATOR': return '/investigator/dashboard';
      default: return '/';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Global Threat Alert Banners */}
      {lockdownState?.is_locked && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs font-mono font-semibold flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <span>🚨 SYSTEM LOCKDOWN ACTIVE: {lockdownState.lockdown_reason || 'Security threat threshold exceeded'}. Non-investigator access restricted.</span>
          </div>
          {user?.role === 'INVESTIGATOR' && (
            <Link to="/investigator/security-events" className="px-2.5 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[11px] font-mono transition-colors">
              Manage Response &rarr;
            </Link>
          )}
        </div>
      )}

      {!lockdownState?.is_locked && lockdownState?.is_pre_warning && (
        <div className="bg-amber-500 text-white px-4 py-1.5 text-xs font-mono font-semibold flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>⚠️ PRE-LOCKDOWN THREAT WARNING: {lockdownState.pre_warning_reason || 'Multi-session anomaly spike detected'}.</span>
          </div>
          {user?.role === 'INVESTIGATOR' && (
            <Link to="/investigator/security-events" className="px-2 py-0.5 bg-black/20 hover:bg-black/30 rounded text-[11px] font-mono transition-colors">
              Investigate &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Top Demo Banner / Quick Role Switcher */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-8 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
          <span className="font-semibold text-slate-700">Role Switcher:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {(['SETTER', 'REVIEWER', 'APPROVER', 'ADMIN_2', 'INVESTIGATOR'] as AppRole[]).map((r) => {
            const isActive = user?.role === r;
            return (
              <LiquidMetalButton
                key={r}
                label={r.replace('_', ' ')}
                size="sm"
                theme={isActive ? "navy" : "silver"}
                active={isActive}
                onClick={() => onRoleButtonClick(r)}
              />
            );
          })}
        </div>
      </div>

      {/* Least-Privilege Role Restriction Warning Modal */}
      {pendingRoleSwitch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Least-Privilege Role Restriction</h3>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Access Boundary Enforcement</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <p>
                You are currently authenticated as <strong className="text-slate-900">{user?.name}</strong> with the <strong className="text-[#00236f]">{user?.role}</strong> role clearance.
              </p>
              <p className="text-slate-600">
                Under zero-trust policies, you are strictly authorized to view and access only your assigned <strong className="text-[#00236f]">{user?.role}</strong> workspace.
              </p>
              <p className="text-slate-500 font-medium">
                Access to the <strong>{pendingRoleSwitch.replace('_', ' ')}</strong> section is restricted to authorized personnel only.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPendingRoleSwitch(null)}
                className="w-full py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Understood • Return to My {user?.role} Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Brand */}
        <Link to={getBrandDestination()} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1.5">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M24 3L42 12V27C42 36.5 34.5 43.5 24 46C13.5 43.5 6 36.5 6 27V12L24 3Z" stroke="#00236f" strokeWidth="3.5" strokeLinejoin="round" fill="#f4f3fa" />
              <circle cx="24" cy="24" r="8" stroke="#1e3a8a" strokeWidth="2.5" strokeDasharray="4 2" />
              <rect x="20" y="23" width="8" height="7" rx="1.5" fill="#00236f" />
              <circle cx="24" cy="26" r="1.2" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900 font-sans">ExamVault</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-medium border border-slate-200">v1.0</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise Security System</p>
          </div>
        </Link>

        {/* User Context & Actions */}
        {user ? (
          <div className="flex items-center gap-4">
            {/* Active Session info */}
            {session && (
              <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs font-mono">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold">{session.id}</span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{session.device_id}</span>
                <span className="text-slate-300">•</span>
                <RiskBadge level={session.risk_level} score={session.risk_score} />
              </div>
            )}

            <RoleBadge role={user.role} />

            {/* User Profile & Logout */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-slate-800">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <LiquidMetalButton
            label="Authenticate"
            theme="navy"
            onClick={() => navigate('/login')}
          />
        )}
      </div>
    </header>
  );
};
