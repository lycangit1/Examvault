import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AccessDenied: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <ShieldX className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white font-mono">403 • Access Forbidden</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Least-privilege security policy is enforced. Your authenticated role (<code className="text-cyan-400 font-mono font-bold">{user?.role || 'ANONYMOUS'}</code>) does not possess authorization to access this operational resource.
          </p>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-500 text-left space-y-1">
          <div>Policy: <span className="text-slate-300">RLS_LEAST_PRIVILEGE_STRICT</span></div>
          <div>Enforcement: <span className="text-emerald-400">PostgreSQL Kernel & Client Barrier</span></div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <Link
            to="/login"
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch Role</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
