import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, ArrowLeft, AlertCircle, CheckCircle2, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Question } from '../../types';

export const QuestionEditor: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const isEditing = Boolean(questionId);
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [questionText, setQuestionText] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('option_1');
  const [explanation, setExplanation] = useState('');
  const [roughNotes, setRoughNotes] = useState('');
  const [changeNote, setChangeNote] = useState(isEditing ? 'Updated content per feedback' : 'Initial version draft');
  const [currentVersion, setCurrentVersion] = useState(1);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && questionId) {
      async function loadQuestion() {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('id', questionId)
            .single();

          if (data && !error) {
            const q = data as Question;
            setId(q.id);
            setTitle(q.title);
            setSubject(q.subject);
            setQuestionText(q.question_text);
            if (q.options && q.options.length >= 4) {
              setOpt1(q.options[0]?.text || '');
              setOpt2(q.options[1]?.text || '');
              setOpt3(q.options[2]?.text || '');
              setOpt4(q.options[3]?.text || '');
            }
            setCorrectAnswer(q.correct_answer || 'option_1');
            setExplanation(q.explanation || '');
            setRoughNotes(q.rough_notes || '');
            setCurrentVersion(q.current_version);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
      loadQuestion();
    } else {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setId(`Q-${randomSuffix}`);
    }
  }, [isEditing, questionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (!id.trim() || !title.trim() || !questionText.trim() || !opt1.trim() || !opt2.trim() || !opt3.trim() || !opt4.trim()) {
      setError('Please complete all mandatory question and option fields.');
      return;
    }

    setSaving(true);
    try {
      const optionsArray = [
        { id: 'option_1', text: opt1 },
        { id: 'option_2', text: opt2 },
        { id: 'option_3', text: opt3 },
        { id: 'option_4', text: opt4 },
      ];

      const newVersionNum = isEditing ? currentVersion + 1 : 1;

      const { error: qErr } = await supabase
        .from('questions')
        .upsert({
          id: id.trim(),
          title: title.trim(),
          subject: subject.trim(),
          question_text: questionText.trim(),
          options: optionsArray,
          correct_answer: correctAnswer,
          explanation: explanation.trim(),
          rough_notes: roughNotes.trim(),
          status: 'DRAFT',
          created_by: user.id,
          assigned_reviewer_id: '22222222-2222-2222-2222-222222222222',
          current_version: newVersionNum,
          updated_at: new Date().toISOString(),
        });

      if (qErr) throw qErr;

      await supabase.from('question_versions').insert({
        question_id: id.trim(),
        version_number: newVersionNum,
        content_snapshot: {
          title,
          subject,
          question_text: questionText,
          options: optionsArray,
          correct_answer: correctAnswer,
          explanation,
          rough_notes: roughNotes,
        },
        changed_by: user.id,
        change_note: changeNote.trim(),
      });

      await supabase.rpc('append_audit_event', {
        p_user_id: user.id,
        p_role: user.role,
        p_action: isEditing ? 'QUESTION_UPDATED' : 'QUESTION_CREATED',
        p_entity_type: 'QUESTION',
        p_entity_id: id.trim(),
        p_session_id: session?.id,
        p_device_id: session?.device_id,
        p_ip_address: session?.ip_address,
        p_risk_score: session?.risk_score || 0,
        p_metadata: { version: newVersionNum, change_note: changeNote }
      });

      navigate(`/setter/questions/${id.trim()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Loading question draft workspace...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/setter/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Authoring Workspace</span>
        </Link>
        <div className="text-xs font-mono text-[#00236f] font-semibold">
          {isEditing ? `Editing Version v${currentVersion} → v${currentVersion + 1}` : 'Drafting Version v1'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Revise Question Draft' : 'Author New Examination Question'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every submission is version-stamped and encrypted before storage.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item Identifier</label>
            <input
              type="text"
              required
              disabled={isEditing}
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. Q-101"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-900 focus:outline-none focus:border-[#00236f]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Question Title / Topic</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quantum Key Distribution"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#00236f]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Discipline</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#00236f]"
          >
            <option value="Physics">Physics</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Chemistry">Chemistry</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Question Body</label>
          <textarea
            rows={4}
            required
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type the full question statement..."
            className="w-full p-3 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#00236f]"
          />
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-slate-700">Multiple Choice Options & Correct Key</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'option_1', val: opt1, set: setOpt1, label: 'Option A' },
              { id: 'option_2', val: opt2, set: setOpt2, label: 'Option B' },
              { id: 'option_3', val: opt3, set: setOpt3, label: 'Option C' },
              { id: 'option_4', val: opt4, set: setOpt4, label: 'Option D' },
            ].map((opt) => (
              <div key={opt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">{opt.label}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 text-[11px]">
                    <input
                      type="radio"
                      name="correctKey"
                      checked={correctAnswer === opt.id}
                      onChange={() => setCorrectAnswer(opt.id)}
                      className="text-[#00236f] focus:ring-[#00236f]"
                    />
                    <span>Mark as Correct</span>
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={opt.val}
                  onChange={(e) => opt.set(e.target.value)}
                  placeholder={`Enter ${opt.label} text...`}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-[#00236f]"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Version Snapshot Note</label>
          <input
            type="text"
            required
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            placeholder="e.g. Initial draft / Fixed typo in Option B"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#00236f]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/setter/dashboard"
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md text-xs hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isEditing ? 'Save Version Snapshot' : 'Save Draft'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
