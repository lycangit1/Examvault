import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FileText, Clock, AlertCircle, CheckCircle2, ChevronRight, BookOpen, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Question } from '../../types';
import { QuestionStatusBadge } from '../../components/common/Badge';
import { GlowCard } from '../../components/ui/spotlight-card';

export const SetterDashboard: React.FC = () => {
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

        if (data) {
          setQuestions(data as unknown as Question[]);
        }
      } catch (err) {
        console.error('Error loading questions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [user]);

  const draftCount = questions.filter((q) => q.status === 'DRAFT').length;
  const underReviewCount = questions.filter((q) => q.status === 'UNDER_REVIEW').length;
  const revisionCount = questions.filter((q) => q.status === 'NEEDS_REVISION').length;
  const approvedCount = questions.filter((q) => q.status === 'APPROVED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching Stitch */}
      <GlowCard glowColor="blue" className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[#00236f] font-bold uppercase tracking-wider">
            AUTHORING WORKSPACE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {user?.name || 'Setter_A'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Author versioned examination items with automated version snapshots and least-privilege submission control.
          </p>
        </div>

        <Link
          to="/setter/questions/new"
          className="px-4 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Draft New Question</span>
        </Link>
      </GlowCard>

      {/* Metrics Row (4 Bento-style Spotlight Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlowCard glowColor="blue" className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Active Drafts</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{draftCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Editable by you</div>
          </div>
        </GlowCard>

        <GlowCard glowColor="blue" className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">In Moderation</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{underReviewCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Assigned to reviewer</div>
          </div>
        </GlowCard>

        <GlowCard glowColor="amber" className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">Needs Revision</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{revisionCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Feedback received</div>
          </div>
        </GlowCard>

        <GlowCard glowColor="emerald" className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">Approved Items</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{approvedCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Ready for package lock</div>
          </div>
        </GlowCard>
      </div>

      {/* Authoring Inventory Table matching Stitch */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <BookOpen className="w-4 h-4 text-[#00236f]" />
            <span>My Authoring Inventory</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Total items: {questions.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">Question ID</th>
                <th className="p-3.5">Title &amp; Subject</th>
                <th className="p-3.5">Version</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Last Modified</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                    No authored questions found. Click "Draft New Question" to create one.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-xs font-bold text-slate-900">
                      {q.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800 text-xs">{q.title || 'Untitled Question Item'}</div>
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
                    <td className="p-3.5 text-xs text-slate-500 font-mono">
                      {new Date(q.updated_at || q.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/setter/questions/${q.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#00236f] hover:text-[#1e3a8a] transition-colors"
                      >
                        <span>Open Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
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
