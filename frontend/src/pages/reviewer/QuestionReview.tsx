import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Shield, Loader2, MessageSquare, Fingerprint } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Question, ReviewDecision } from '../../types';
import { WatermarkOverlay } from '../../components/common/WatermarkOverlay';
import { QuestionStatusBadge } from '../../components/common/Badge';
import { getFingerprintedOptions } from '../../lib/fingerprint';

export const QuestionReview: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAndAuditQuestion() {
      if (!questionId || !user) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('id', questionId)
          .single();

        if (data && !error) {
          setQuestion(data as Question);
          if (session?.id) {
            await supabase.rpc('record_question_view', {
              p_question_id: questionId,
              p_session_id: session.id,
            });
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load question');
      } finally {
        setLoading(false);
      }
    }

    loadAndAuditQuestion();
  }, [questionId, user, session]);

  const handleDecision = async (decision: ReviewDecision) => {
    if (!question || !user || !session) return;
    setSubmitting(true);
    setError('');

    try {
      const { data, error } = await supabase.rpc('submit_review_decision', {
        p_question_id: question.id,
        p_session_id: session.id,
        p_user_id: user.id,
        p_reviewer_id: user.id,
        p_decision: decision,
        p_comment: comment.trim() || `Moderated: ${decision}`,
      });

      if (error || !data?.success) {
        setError(error?.message || data?.error || 'Review decision failed');
      } else {
        navigate('/reviewer/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error recording review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Loading question and generating forensic watermark overlay...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-12 text-center text-red-600 font-mono text-xs">
        Question item not found or unauthorized access attempt blocked.
      </div>
    );
  }

  const fingerprinted = getFingerprintedOptions(question.options, user?.id || 'reviewer_b');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar matching Stitch */}
      <div className="flex items-center justify-between">
        <Link
          to="/reviewer/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Moderation Queue</span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-mono">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Watermarked Session ID: {session?.id}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Review Workspace with Watermark */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
        <WatermarkOverlay />
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 relative z-10">
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

          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-md text-blue-900 text-xs font-mono">
            <Fingerprint className="w-3.5 h-3.5 text-[#00236f]" />
            <span>Deterministic Permutation Permuted</span>
          </div>
        </div>

        {/* Question Statement */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Question Statement</div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 text-sm leading-relaxed">
            {question.question_text}
          </div>
        </div>

        {/* Dynamic Fingerprinted Options */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Fingerprinted Options Order (Unique to Session)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fingerprinted.map((opt, idx) => {
              const isCorrect = question.correct_answer === opt.id;
              return (
                <div
                  key={opt.id || idx}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
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
                      Canonical Answer
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback / Moderation Form */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Moderator Feedback / Revision Justification
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter specific feedback or approval remarks for the author..."
              className="w-full p-3 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#00236f]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDecision('NEEDS_REVISION')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Request Revision</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDecision('REJECTED')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Item</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDecision('APPROVED')}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Approve Question</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
