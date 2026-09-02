import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, CheckCircle2, AlertCircle, ArrowRight, Eye, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Question } from '../../types';
import { QuestionStatusBadge } from '../../components/common/Badge';
import { GlowCard } from '../../components/ui/spotlight-card';

export const ReviewerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuestions() {
      if (!user) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('questions')
          .select('*, creator:profiles!created_by(*), reviewer:profiles!assigned_reviewer_id(*)')
          .order('created_at', { ascending: false });

        if (data && !error) {
          setQuestions(data as unknown as Question[]);
        }
      } catch (err) {
        console.error('Failed to fetch reviewer questions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [user]);

  const assignedQuestions = questions.filter(
    (q) => q.assigned_reviewer_id === user?.id || user?.role === 'REVIEWER'
  );

  const underReview = assignedQuestions.filter((q) => q.status === 'UNDER_REVIEW');
  const needsRev = assignedQuestions.filter((q) => q.status === 'NEEDS_REVISION');
  const approved = assignedQuestions.filter((q) => q.status === 'APPROVED');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner matching Stitch */}
      <GlowCard glowColor="blue" className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[#00236f] font-bold uppercase tracking-wider">
            QUESTION MODERATION CONSOLE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {user?.name || 'Reviewer_B'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Least-privilege review queue. Sensitive inspections are dynamically watermarked and audited with content fingerprinting.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-blue-900 text-xs font-mono">
          <Shield className="w-3.5 h-3.5 text-[#00236f]" />
          <span>Watermarked Session Active</span>
        </div>
      </GlowCard>

      {/* Metrics Row (3 Spotlight Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlowCard glowColor="blue" className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Awaiting Moderation</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{underReview.length}</div>
        </GlowCard>

        <GlowCard glowColor="amber" className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">Returned for Changes</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{needsRev.length}</div>
        </GlowCard>

        <GlowCard glowColor="emerald" className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">Approved &amp; Ready</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{approved.length}</div>
        </GlowCard>
      </div>

      {/* Moderation Queue Table matching Stitch */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <CheckSquare className="w-4 h-4 text-[#00236f]" />
            <span>Assigned Question Review Queue</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Total assigned: {assignedQuestions.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">Item ID</th>
                <th className="p-3.5">Title &amp; Subject</th>
                <th className="p-3.5">Version</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {assignedQuestions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-slate-400">
                    No questions currently assigned to your moderation queue.
                  </td>
                </tr>
              ) : (
                assignedQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-xs font-bold text-slate-900">{q.id}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800 text-xs">{q.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{q.subject}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[11px] font-medium border border-slate-200">
                        v{q.current_version}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <QuestionStatusBadge status={q.status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/reviewer/questions/${q.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#00236f] hover:text-[#1e3a8a] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect &amp; Moderate</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
