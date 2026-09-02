import React, { useEffect, useState } from 'react';
import {
  PackageCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Sparkles,
  Eye,
  X,
  FileText,
  Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Question, ExamPackage } from '../../types';
import { PackageStatusBadge, QuestionStatusBadge } from '../../components/common/Badge';
import { WatermarkOverlay } from '../../components/common/WatermarkOverlay';

export const ApproverDashboard: React.FC = () => {
  const { user, session } = useAuth();

  const [approvedQuestions, setApprovedQuestions] = useState<Question[]>([]);
  const [packages, setPackages] = useState<ExamPackage[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [examName, setExamName] = useState('Physics Mock Examination');
  const [packageName, setPackageName] = useState('PHY-2026-SET-A');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Detailed Question Inspection Modal State with Forensic Watermark
  const [inspectingQuestion, setInspectingQuestion] = useState<Question | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('status', 'APPROVED');

      if (qData) {
        const approvedList = qData as Question[];
        setApprovedQuestions(approvedList);
        setSelectedQuestionIds(prev => {
          const validSelected = prev.filter(id => approvedList.some(q => q.id === id));
          return validSelected.length > 0 ? validSelected : approvedList.slice(0, 2).map(q => q.id);
        });
      }

      const { data: pData } = await supabase
        .from('exam_packages')
        .select('*')
        .order('created_at', { ascending: false });
      if (pData) setPackages(pData as ExamPackage[]);
    } catch (err) {
      console.error('Failed to load package assembly data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const toggleQuestionSelect = (qId: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleOpenInspectionModal = async (q: Question) => {
    setInspectingQuestion(q);
    // Record audited question view with watermark context
    try {
      const sessionId = session?.id || 'EV-APPROVER-2026';
      if (user) {
        await supabase.rpc('record_question_view', {
          p_question_id: q.id,
          p_session_id: sessionId,
          p_user_id: user.id
        });
      }
    } catch (err) {
      console.error('Failed to record question view audit:', err);
    }
  };

  const handleSuggestNextCode = () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'FINAL'];
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    setPackageName(`PHY-2026-SET-${randomLetter}-${randomNum}`);
  };

  const handleAssemblePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setStatusMsg('');
    setErrorMsg('');

    if (selectedQuestionIds.length === 0) {
      setErrorMsg('Please select at least one approved question for the package.');
      return;
    }

    setSubmitting(true);
    try {
      const sessionId = session?.id || `EV-APP-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data, error } = await supabase.rpc('assemble_exam_package', {
        p_package_name: packageName.trim(),
        p_exam_name: examName.trim(),
        p_question_ids: selectedQuestionIds,
        p_approver_1_id: user.id,
        p_session_id: sessionId,
      });

      if (error || !data?.success) {
        setErrorMsg(error?.message || data?.error || 'Failed to assemble exam package');
      } else {
        setStatusMsg(`✓ Package "${data.package_name || packageName}" locked with Lock #1! Dual-confirmation request routed to Admin_2.`);
        handleSuggestNextCode();
        await loadData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error during package assembly');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching Stitch */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[#00236f] font-bold uppercase tracking-wider">
            EXAM ASSEMBLY CONSOLE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {user?.name || 'Approver_C'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Bundle verified items into official examination packages and initiate dual-custody cryptographic lock #1.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-blue-900 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00236f]" />
          <span>Lock #1 Authority Active</span>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg('')} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Assemble Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Exam Package</h2>
              <p className="text-xs text-slate-500">Initiates Dual-Lock Step 1/2</p>
            </div>
            <button
              type="button"
              onClick={handleSuggestNextCode}
              className="text-[11px] text-[#00236f] hover:underline flex items-center gap-1 font-mono font-medium"
            >
              <Sparkles className="w-3 h-3" />
              <span>Random Code</span>
            </button>
          </div>

          <form onSubmit={handleAssemblePackage} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Package Code / Identifier</label>
              <input
                type="text"
                required
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="e.g. PHY-2026-SET-A"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-900 focus:outline-none focus:border-[#00236f]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Examination Title</label>
              <input
                type="text"
                required
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. National Entrance Exam 2026"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#00236f]"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex justify-between items-center text-slate-800 font-semibold">
                <span>Selected Questions:</span>
                <span className="font-mono text-[#00236f] font-bold">{selectedQuestionIds.length} items</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Select verified questions from the inventory on the right.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || selectedQuestionIds.length === 0}
              className="w-full py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-md text-xs font-semibold shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Lock #1 &amp; Route to Admin_2</span>
            </button>
          </form>
        </div>

        {/* Approved Questions Selection List with Detailed Inspection */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Approved Questions Inventory</h2>
              <p className="text-xs text-slate-400">Click any card to inspect full statement &amp; options</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{approvedQuestions.length} available</span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {approvedQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No approved questions available. Reviewer must approve items first.
              </div>
            ) : (
              approvedQuestions.map((q) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    className={`p-3.5 rounded-lg border text-xs transition-colors flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 border-[#00236f] shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      onClick={() => handleOpenInspectionModal(q)}
                      className="space-y-1 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{q.id}</span>
                        <QuestionStatusBadge status={q.status} />
                        <span className="text-[10px] text-slate-400 font-mono">v{q.current_version}</span>
                        <span className="text-[10px] text-[#00236f] hover:underline inline-flex items-center gap-1 font-semibold ml-2">
                          <Eye className="w-3 h-3" />
                          <span>Inspect Details</span>
                        </span>
                      </div>
                      <div className="font-medium text-slate-800">{q.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{q.question_text}</div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleQuestionSelect(q.id)}
                      className="mt-1 h-4 w-4 text-[#00236f] focus:ring-[#00236f] rounded border-slate-300 cursor-pointer"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Detailed Question Inspection Modal with Forensic Watermark */}
      {inspectingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl space-y-5 p-6">
            {/* Dynamic Forensic Watermark for Approver */}
            <WatermarkOverlay />

            <div className="flex items-start justify-between border-b border-slate-100 pb-3 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#00236f] font-mono">{inspectingQuestion.id}</span>
                  <QuestionStatusBadge status={inspectingQuestion.status} />
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-600 border border-slate-200">
                    v{inspectingQuestion.current_version}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{inspectingQuestion.title}</h3>
                <p className="text-xs text-slate-500 font-mono">Discipline: {inspectingQuestion.subject}</p>
              </div>

              <button
                type="button"
                onClick={() => setInspectingQuestion(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Watermarked Session Banner */}
            <div className="flex items-center gap-2 p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs font-mono text-blue-900 relative z-10">
              <Shield className="w-3.5 h-3.5 text-[#00236f]" />
              <span>
                Watermarked Session: <strong>{session?.id || 'EV-APPROVER-2026'}</strong> • User: <strong>{user?.email}</strong>
              </span>
            </div>

            {/* Question Statement */}
            <div className="space-y-1.5 relative z-10">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Full Question Statement
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 text-xs sm:text-sm leading-relaxed">
                {inspectingQuestion.question_text}
              </div>
            </div>

            {/* Canonical Options */}
            <div className="space-y-2 relative z-10">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Canonical Options
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {inspectingQuestion.options.map((opt, idx) => {
                  const isCorrect = inspectingQuestion.correct_answer === opt.id;
                  return (
                    <div
                      key={opt.id || idx}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
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
                        <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Correct Key
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation / Rationale if available */}
            {inspectingQuestion.explanation && (
              <div className="space-y-1 relative z-10">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Explanation / Rationale
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600">
                  {inspectingQuestion.explanation}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 relative z-10">
              <button
                type="button"
                onClick={() => {
                  toggleQuestionSelect(inspectingQuestion.id);
                }}
                className={`px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 ${
                  selectedQuestionIds.includes(inspectingQuestion.id)
                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                    : 'bg-[#00236f] text-white hover:bg-[#1e3a8a]'
                }`}
              >
                {selectedQuestionIds.includes(inspectingQuestion.id) ? (
                  <span>Remove from Package</span>
                ) : (
                  <span>Add to Exam Package</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInspectingQuestion(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Packages Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <PackageCheck className="w-4 h-4 text-[#00236f]" />
            <span>Assembled Examination Packages</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">{packages.length} packages</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">Package ID</th>
                <th className="p-3.5">Exam Name</th>
                <th className="p-3.5">Questions</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Dual Lock State</th>
                <th className="p-3.5">Created At</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-mono text-xs font-bold text-slate-900">{pkg.package_name}</td>
                  <td className="p-3.5 text-xs font-medium text-slate-800">{pkg.exam_name}</td>
                  <td className="p-3.5 text-xs font-mono text-slate-600">{pkg.question_ids?.length || 0} items</td>
                  <td className="p-3.5">
                    <PackageStatusBadge status={pkg.status} />
                  </td>
                  <td className="p-3.5 text-xs font-mono">
                    {pkg.status === 'FINAL_LOCKED' ? (
                      <span className="text-emerald-700 font-semibold">🔒🔒 Dual-Locked (2/2)</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">🔒 Pending Lock #2 (1/2)</span>
                    )}
                  </td>
                  <td className="p-3.5 text-xs text-slate-500 font-mono">
                    {new Date(pkg.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
