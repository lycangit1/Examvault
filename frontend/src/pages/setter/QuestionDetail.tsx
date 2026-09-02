import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Send, History, CheckCircle2, Clock, AlertTriangle, FileText, User, ShieldAlert, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Question, QuestionVersion, Review } from '../../types';
import { QuestionStatusBadge } from '../../components/common/Badge';
import { WatermarkOverlay } from '../../components/common/WatermarkOverlay';

export const QuestionDetail: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const { user, session } = useAuth();

  const [question, setQuestion] = useState<Question | null>(null);
  const [versions, setVersions] = useState<QuestionVersion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    if (!questionId) return;
    try {
      setLoading(true);
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();
      if (qData) setQuestion(qData as Question);

      const { data: vData } = await supabase
        .from('question_versions')
        .select('*')
        .eq('question_id', questionId)
        .order('version_number', { ascending: false });
      if (vData) setVersions(vData as QuestionVersion[]);

      const { data: rData } = await supabase
        .from('reviews')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: false });
      if (rData) setReviews(rData as Review[]);

      if (session?.id && questionId) {
        await supabase.rpc('record_question_view', {
          p_question_id: questionId,
          p_session_id: session.id,
        });
      }
    } catch (err) {
      console.error('Failed to load question details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [questionId, session]);

  const handleSubmitForReview = async () => {
    if (!question || !user) return;
    setSubmitting(true);
    setMsg('');

    try {
      const { data, error } = await supabase.rpc('submit_question_for_review', {
        p_question_id: question.id,
        p_session_id: session?.id,
        p_user_id: user.id,
      });

      if (error || !data?.success) {
        setMsg(data?.error || 'Failed to submit question for review.');
      } else {
        setMsg('Question submitted to reviewer queue successfully!');
        await loadData();
      }
    } catch (err: any) {
      setMsg(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !question) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Loading question audit record...
      </div>
    );
  }

  const isEditable = question.status === 'DRAFT' || question.status === 'NEEDS_REVISION';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/setter/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Authoring Workspace</span>
        </Link>

        <div className="flex items-center gap-3">
          {isEditable && (
            <Link
              to={`/setter/questions/${question.id}/edit`}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Draft</span>
            </Link>
          )}

          {isEditable && (
            <button
              onClick={handleSubmitForReview}
              disabled={submitting}
              className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Moderation</span>
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-700" />
          <span>{msg}</span>
        </div>
      )}

      {/* Main Question Overview Card with Live Watermark */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
        <WatermarkOverlay />
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-bold text-[#00236f] font-mono">{question.id}</span>
              <QuestionStatusBadge status={question.status} />
              <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-600 border border-slate-200">
                v{question.current_version}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{question.title}</h1>
            <p className="text-xs text-slate-500 font-mono">Discipline: {question.subject}</p>
          </div>

          <div className="text-right text-xs font-mono space-y-1 text-slate-400">
            <div>Created: {new Date(question.created_at).toLocaleDateString()}</div>
            <div>Last Modified: {new Date(question.updated_at).toLocaleString()}</div>
          </div>
        </div>

        {/* Question Statement */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Question Statement</div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 text-sm leading-relaxed">
            {question.question_text}
          </div>
        </div>

        {/* Canonical Options */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Canonical Options</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {question.options.map((opt, idx) => {
              const isCorrect = question.correct_answer === opt.id;
              return (
                <div
                  key={opt.id || idx}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                    isCorrect
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center font-mono text-[10px] font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt.text}</span>
                  </div>
                  {isCorrect && (
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Correct Key
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rough Notes / Explanation */}
        {question.explanation && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Explanation / Rationale</div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
              {question.explanation}
            </div>
          </div>
        )}
      </div>

      {/* Version History Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <History className="w-4 h-4 text-[#00236f]" />
            <span>Version Snapshot History ({versions.length})</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Immutable audit snapshots</span>
        </div>

        <div className="space-y-2">
          {versions.map((ver) => (
            <div key={ver.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800">
                  v{ver.version_number}
                </span>
                <span className="text-slate-700">{ver.change_note || 'Snapshot recorded'}</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                {new Date(ver.changed_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
