import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FileEdit,
  CheckSquare,
  PackageCheck,
  ShieldCheck,
  ShieldAlert,
  History,
  AlertTriangle,
  Search,
  Cpu,
  Info,
  Layers,
  PlusCircle,
  FolderGit2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isWorkspacePath = /^\/(setter|reviewer|approver|admin2|investigator)/.test(location.pathname);
  if (!user || !isWorkspacePath) return null;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
      isActive
        ? 'bg-[#d0e1fb] text-[#00236f] font-bold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <aside className="w-64 shrink-0 bg-[#f4f3fa] border-r border-slate-200 p-4 space-y-6 hidden lg:block">
      {/* Workspace Role Label */}
      <div className="px-3 py-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Workspace</div>
        <div className="text-xs font-bold text-[#00236f] mt-0.5">
          {user.role === 'SETTER' && 'Question Authoring Node'}
          {user.role === 'REVIEWER' && 'Moderation & Review Room'}
          {user.role === 'APPROVER' && 'Exam Assembly Console'}
          {user.role === 'ADMIN_2' && 'Dual Authorization Gate'}
          {user.role === 'INVESTIGATOR' && 'Incident & Threat Triage'}
        </div>
      </div>

      {/* Role Navigation Links */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-3 mb-2">Workflow</div>

        {user.role === 'SETTER' && (
          <>
            <NavLink to="/setter/dashboard" className={linkClass} end>
              <FileEdit className="w-4 h-4" />
              <span>Authoring Dashboard</span>
            </NavLink>
            <NavLink to="/setter/questions/new" className={linkClass}>
              <PlusCircle className="w-4 h-4" />
              <span>Draft New Question</span>
            </NavLink>
          </>
        )}

        {user.role === 'REVIEWER' && (
          <>
            <NavLink to="/reviewer/dashboard" className={linkClass} end>
              <CheckSquare className="w-4 h-4" />
              <span>Review Queue</span>
            </NavLink>
          </>
        )}

        {user.role === 'APPROVER' && (
          <>
            <NavLink to="/approver/dashboard" className={linkClass} end>
              <PackageCheck className="w-4 h-4" />
              <span>Package Assembly</span>
            </NavLink>
            <NavLink to="/approver/packages/new" className={linkClass}>
              <FolderGit2 className="w-4 h-4" />
              <span>Assemble Exam</span>
            </NavLink>
          </>
        )}

        {user.role === 'ADMIN_2' && (
          <>
            <NavLink to="/admin2/dashboard" className={linkClass} end>
              <ShieldCheck className="w-4 h-4" />
              <span>Dual Confirmation</span>
            </NavLink>
          </>
        )}

        {user.role === 'INVESTIGATOR' && (
          <>
            <NavLink to="/investigator/dashboard" className={linkClass} end>
              <Layers className="w-4 h-4" />
              <span>Intelligence Overview</span>
            </NavLink>
            <NavLink to="/investigator/risk-sessions" className={linkClass}>
              <AlertTriangle className="w-4 h-4" />
              <span>Risk Monitor & Triage</span>
            </NavLink>
            <NavLink to="/investigator/security-events" className={linkClass}>
              <ShieldAlert className="w-4 h-4" />
              <span>Threat & Lockdown</span>
            </NavLink>
            <NavLink to="/investigator/leaks" className={linkClass}>
              <Search className="w-4 h-4" />
              <span>Leak Investigation</span>
            </NavLink>
            <NavLink to="/investigator/audit-logs" className={linkClass}>
              <History className="w-4 h-4" />
              <span>Audit Ledger</span>
            </NavLink>
            <NavLink to="/investigator/integrations" className={linkClass}>
              <Cpu className="w-4 h-4" />
              <span>Print & CBT Simulation</span>
            </NavLink>
          </>
        )}
      </div>

      {/* Governance & Security */}
      <div className="pt-4 border-t border-slate-200 space-y-1">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-3 mb-2">Governance</div>
        <NavLink to="/about-security-limits" className={linkClass}>
          <Info className="w-4 h-4" />
          <span>Security Disclosures</span>
        </NavLink>
      </div>

      {/* Security Protocol Badge */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1 shadow-xs">
        <div className="text-slate-800 font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>PostgreSQL RLS Active</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          Cryptographic SHA-256 hash chaining and least privilege enforced.
        </p>
      </div>
    </aside>
  );
};
