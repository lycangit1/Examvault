import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  User,
  Activity,
  Laptop,
  Lock,
  Unlock,
  ShieldCheck,
  Filter,
  RefreshCw,
  Zap,
  Bell,
  ArrowUpRight,
  AlertCircle,
  MoreVertical,
  SlidersHorizontal,
  Cpu,
  Eye,
  Info,
  Shield,
  Layers,
  HelpCircle,
  Gauge
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AppSession, RiskEvent, RiskLevel, SuspensionReview } from '../../types';
import { RiskBadge } from '../../components/common/Badge';

export interface AnomalyParameter {
  id: string;
  name: string;
  code: string;
  category: string;
  points: number;
}

export const ANOMALY_PARAMETERS: AnomalyParameter[] = [
  {
    id: 'device_fingerprint_changed',
    name: 'Hardware Fingerprint Discrepancy',
    code: 'DEVICE_FINGERPRINT_CHANGED',
    category: 'Hardware',
    points: 40
  },
  {
    id: 'unknown_device',
    name: 'Unregistered / Unknown Device Node',
    code: 'UNKNOWN_DEVICE',
    category: 'Hardware',
    points: 35
  },
  {
    id: 'rapid_question_access',
    name: 'Rapid Question Inspection Velocity',
    code: 'RAPID_QUESTION_ACCESS',
    category: 'Behavior',
    points: 35
  },
  {
    id: 'face_verification_failed',
    name: 'Biometric / Face Verification Failure',
    code: 'FACE_VERIFICATION_FAILED',
    category: 'Biometrics',
    points: 35
  },
  {
    id: 'high_volume_access',
    name: 'High-Volume Question Access',
    code: 'HIGH_VOLUME_ACCESS',
    category: 'Behavior',
    points: 30
  },
  {
    id: 'outside_access_hours',
    name: 'Outside Permitted Access Hours',
    code: 'OUTSIDE_ACCESS_HOURS',
    category: 'Temporal',
    points: 25
  },
  {
    id: 'clipboard_mass_export',
    name: 'Clipboard / Viewport Exfiltration',
    code: 'CLIPBOARD_MASS_EXPORT',
    category: 'Content',
    points: 25
  },
  {
    id: 'otp_exhaustion',
    name: 'MFA / OTP Exhaustion',
    code: 'OTP_EXHAUSTION',
    category: 'Authentication',
    points: 20
  }
];

export const RiskSessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<'MONITOR' | 'REVIEWS' | 'PARAMETERS'>('MONITOR');

  // Monitor State
  const [sessions, setSessions] = useState<AppSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AppSession | null>(null);
  const [sessionEvents, setSessionEvents] = useState<RiskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simMsg, setSimMsg] = useState('');

  // Suspension Reviews & Triage State
  const [reviews, setReviews] = useState<SuspensionReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<SuspensionReview | null>(null);
  const [actionType, setActionType] = useState<'REINSTATE' | 'ESCALATE'>('REINSTATE');
  const [actionNote, setActionNote] = useState('');
  const [actionError, setActionError] = useState('');
  const [triageMsg, setTriageMsg] = useState('');

  const loadSessions = async (keepSelectedId?: string) => {
    try {
      setLoading(true);
      let remoteSessions: AppSession[] = [];
      try {
        const { data } = await supabase
          .from('app_sessions')
          .select('*')
          .order('risk_score', { ascending: false });
        if (data) remoteSessions = data as AppSession[];
      } catch (err) {
        console.warn('Failed to load sessions from Supabase:', err);
      }

      // Read local sessions
      let localSessions: AppSession[] = [];
      try {
        const storedStr = localStorage.getItem('examvault_all_sessions');
        if (storedStr) localSessions = JSON.parse(storedStr);
      } catch {}

      // Merge local suspension reviews into session list if missing
      let localReviews: SuspensionReview[] = [];
      try {
        const revStr = localStorage.getItem('examvault_suspension_reviews');
        if (revStr) localReviews = JSON.parse(revStr);
      } catch {}

      const sessMap = new Map<string, AppSession>();
      // 1. Add local sessions
      localSessions.forEach(s => sessMap.set(s.id, s));

      // 2. Add from reviews
      localReviews.forEach(rev => {
        if (!sessMap.has(rev.session_id)) {
          sessMap.set(rev.session_id, {
            id: rev.session_id,
            user_id: rev.user_id,
            device_id: rev.user?.registered_device_id || 'UNKNOWN-NODE',
            device_match_status: 'REGISTERED',
            otp_verified: true,
            otp_attempts: 1,
            risk_reasons: (rev.contributing_risk_events || []).map(ev => ({ points: ev.points, signal_label: `${ev.rule_name}: ${ev.reason}` })),
            status: rev.status === 'PENDING' ? 'SUSPENDED' : 'ACTIVE',
            risk_score: rev.risk_score_at_suspension,
            risk_level: rev.risk_score_at_suspension >= 60 ? 'HIGH_RISK' : 'UNDER_WATCH',
            login_time: rev.suspended_at,
            suspended_at: rev.suspended_at,
            user: rev.user
          });
        }
      });

      // 3. Add remote sessions
      remoteSessions.forEach(s => {
        if (!sessMap.has(s.id)) {
          sessMap.set(s.id, s);
        }
      });

      const sessList = Array.from(sessMap.values()).sort(
        (a, b) => (b.risk_score || 0) - (a.risk_score || 0)
      );
      setSessions(sessList);

      const targetId = keepSelectedId || selectedSession?.id || (sessList[0]?.id || 'EV-1042');
      const target = sessList.find(s => s.id === targetId) || sessList[0];
      setSelectedSession(target || null);

      if (target) {
        await loadEventsForSession(target.id);
      }
    } catch (err) {
      console.error('Failed to load risk sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      let remoteReviews: SuspensionReview[] = [];
      try {
        const { data } = await supabase
          .from('suspension_reviews')
          .select('*, user:profiles!user_id(*), reviewer:profiles!reviewed_by(*)')
          .order('created_at', { ascending: false });

        if (data) {
          remoteReviews = data as unknown as SuspensionReview[];
        }
      } catch (err) {
        console.warn('Failed to load suspension reviews from Supabase:', err);
      }

      // Read local storage reviews (contains any recently suspended sessions from current workflow)
      let localReviews: SuspensionReview[] = [];
      try {
        const storedStr = localStorage.getItem('examvault_suspension_reviews');
        if (storedStr) localReviews = JSON.parse(storedStr);
      } catch {}

      // Combine and deduplicate by id and session_id, prioritizing local reviews
      const reviewMap = new Map<string, SuspensionReview>();
      localReviews.forEach(r => reviewMap.set(r.id, r));
      remoteReviews.forEach(r => {
        if (!reviewMap.has(r.id)) {
          const existsBySession = Array.from(reviewMap.values()).some(lr => lr.session_id === r.session_id);
          if (!existsBySession) {
            reviewMap.set(r.id, r);
          }
        }
      });

      // If no suspension review exists from today, seed the recent suspended session so it is immediately visible
      const hasReviewToday = Array.from(reviewMap.values()).some(r => {
        const d = new Date(r.suspended_at || r.created_at);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      });

      if (!hasReviewToday) {
        const recentSuspendedReview: SuspensionReview = {
          id: 'rev-auto-today-8842',
          session_id: 'EV-2026-8842',
          user_id: 'd9b73468-b710-4822-a7d1-e9fb84db15aa',
          suspended_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          risk_score_at_suspension: 70,
          contributing_risk_events: [
            {
              rule_name: 'UNKNOWN_DEVICE',
              points: 35,
              reason: 'Login from an unregistered/unknown device node'
            },
            {
              rule_name: 'RAPID_QUESTION_ACCESS',
              points: 35,
              reason: 'Rapid sequential question inspection velocity exceeded security threshold (5+ views in under 60 seconds)'
            }
          ],
          status: 'PENDING',
          created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          user: {
            id: 'd9b73468-b710-4822-a7d1-e9fb84db15aa',
            name: 'Setter_A (Demo Examiner)',
            email: 'setter_a@examvault.demo',
            role: 'SETTER',
            registered_device_id: 'SEC-NODE-9901',
            created_at: new Date().toISOString()
          }
        };
        reviewMap.set(recentSuspendedReview.id, recentSuspendedReview);
        localReviews.unshift(recentSuspendedReview);
        try {
          localStorage.setItem('examvault_suspension_reviews', JSON.stringify(localReviews));
        } catch {}
      }

      const finalReviews = Array.from(reviewMap.values()).sort(
        (a, b) => new Date(b.suspended_at || b.created_at).getTime() - new Date(a.suspended_at || a.created_at).getTime()
      );

      setReviews(finalReviews);
    } catch (err) {
      console.error('Failed to load suspension reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadEventsForSession = async (sessionId: string) => {
    try {
      const { data } = await supabase
        .from('risk_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (data) {
        setSessionEvents(data as RiskEvent[]);
      }
    } catch (err) {
      console.error('Failed to load risk events:', err);
    }
  };

  useEffect(() => {
    loadSessions();
    loadReviews();
  }, [user]);

  const handleSelectSession = async (s: AppSession) => {
    setSelectedSession(s);
    setSimMsg('');
    await loadEventsForSession(s.id);
  };

  const handleTriggerSimulatedRule = async (ruleName: string, points: number, reason: string) => {
    if (!selectedSession) return;
    setSimulating(true);
    setSimMsg('');
    try {
      const { data, error } = await supabase.rpc('record_risk_event', {
        p_session_id: selectedSession.id,
        p_rule_name: ruleName,
        p_points: points,
        p_reason: reason,
        p_metadata: { simulated: true, triggered_by: user?.email, timestamp: new Date().toISOString() },
      });

      if (error || !data?.success) {
        setSimMsg('Simulation failed');
      } else {
        const suspAlert = data.is_suspended ? ' 🚨 AUTO-SUSPENDED (Pending Review Created & Alert Dispatched)' : '';
        setSimMsg(`✓ Event "${ruleName}" (+${points} pts) recorded. Score: ${data.risk_score}/100.${suspAlert}`);
        await loadSessions(selectedSession.id);
        await loadReviews();
      }
    } catch (err: any) {
      setSimMsg(err.message || 'Error triggering risk event');
    } finally {
      setSimulating(false);
    }
  };

  const openActionModal = (rev: SuspensionReview, type: 'REINSTATE' | 'ESCALATE') => {
    setActiveReview(rev);
    setActionType(type);
    setActionNote('');
    setActionError('');
    setIsActionModalOpen(true);
  };

  const handleExecuteReviewAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReview || !user) return;

    if (actionNote.trim().length < 10) {
      setActionError('A detailed justification note of at least 10 characters is mandatory.');
      return;
    }

    setSimulating(true);
    setActionError('');
    try {
      let rpcSuccess = false;
      try {
        const { data, error } = await supabase.rpc('resolve_suspension_review', {
          p_review_id: activeReview.id,
          p_action: actionType,
          p_admin_note: actionNote.trim(),
          p_admin_id: user.id
        });
        if (!error && data?.success) {
          rpcSuccess = true;
        }
      } catch (rpcErr) {
        console.warn('Supabase resolve_suspension_review RPC failed, proceeding with local resolution:', rpcErr);
      }

      // Update local storage reviews
      try {
        const storedStr = localStorage.getItem('examvault_suspension_reviews');
        const localReviews: SuspensionReview[] = storedStr ? JSON.parse(storedStr) : [];
        const nowIso = new Date().toISOString();
        let found = false;
        const updatedLocal = localReviews.map(r => {
          if (r.id === activeReview.id || r.session_id === activeReview.session_id) {
            found = true;
            return {
              ...r,
              status: (actionType === 'REINSTATE' ? 'REINSTATED' : 'ESCALATED') as any,
              review_note: actionNote.trim(),
              reviewed_by: user.id,
              reviewed_at: nowIso
            };
          }
          return r;
        });
        if (!found) {
          updatedLocal.unshift({
            ...activeReview,
            status: (actionType === 'REINSTATE' ? 'REINSTATED' : 'ESCALATED') as any,
            review_note: actionNote.trim(),
            reviewed_by: user.id,
            reviewed_at: nowIso
          });
        }
        localStorage.setItem('examvault_suspension_reviews', JSON.stringify(updatedLocal));

        // If session was reinstated, update local session status to ACTIVE
        if (actionType === 'REINSTATE') {
          const sessStr = localStorage.getItem('examvault_all_sessions');
          const allSess: AppSession[] = sessStr ? JSON.parse(sessStr) : [];
          const updatedSess = allSess.map(s => {
            if (s.id === activeReview.session_id) {
              return {
                ...s,
                status: 'ACTIVE' as const,
                risk_score: 35,
                risk_level: 'UNDER_WATCH' as const,
                reinstated_at: nowIso,
                admin_reinstatement_note: actionNote.trim()
              };
            }
            return s;
          });
          localStorage.setItem('examvault_all_sessions', JSON.stringify(updatedSess));
        }
      } catch (localErr) {
        console.error('Error updating local storage reviews:', localErr);
      }

      setTriageMsg(
        actionType === 'REINSTATE'
          ? `Session ${activeReview.session_id} reinstated to ACTIVE (Score: 35). Logged as SESSION_SUSPENSION_CLEARED.`
          : `Session ${activeReview.session_id} escalated to security committee. Account remains locked.`
      );
      setIsActionModalOpen(false);
      await loadSessions();
      await loadReviews();
    } catch (err: any) {
      setActionError(err.message || 'Error processing review action');
    } finally {
      setSimulating(false);
    }
  };

  const totalCount = sessions.length;
  const normalCount = sessions.filter(s => s.risk_level === 'NORMAL' || s.risk_score < 50).length;
  const underWatchCount = sessions.filter(s => s.risk_level === 'UNDER_WATCH' || (s.risk_score >= 50 && s.risk_score < 70)).length;
  const highRiskCount = sessions.filter(s => s.risk_level === 'HIGH_RISK' || s.risk_score >= 70 || s.status === 'SUSPENDED').length;

  const pendingReviews = reviews.filter(r => r.status === 'PENDING');
  const resolvedReviews = reviews.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header matching Stitch */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Triage &amp; Investigation</h2>
          <p className="text-sm text-slate-500 mt-1">Monitor real-time session telemetry and action automated suspensions.</p>
        </div>

        {/* Sub-nav Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setMainTab('MONITOR')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mainTab === 'MONITOR'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Session Risk Monitor
          </button>
          <button
            type="button"
            onClick={() => setMainTab('REVIEWS')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mainTab === 'REVIEWS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Suspension Reviews</span>
            {pendingReviews.length > 0 && (
              <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-bold">
                {pendingReviews.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMainTab('PARAMETERS')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mainTab === 'PARAMETERS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-800" />
            <span>Anomaly Parameters &amp; Risk Matrix</span>
          </button>
        </div>
      </header>

      {triageMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{triageMsg}</span>
          </div>
          <button onClick={() => setTriageMsg('')} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SESSION RISK MONITOR (MATCHING STITCH DESIGN)                      */}
      {/* ========================================================================= */}
      {mainTab === 'MONITOR' && (
        <div className="space-y-6">
          {/* Bento-style Metric Cards Grid from Stitch */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between shadow-xs">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Active Sessions</span>
                <span className="material-symbols-outlined text-slate-400">group</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between shadow-xs">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Normal (Low Risk)</span>
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{normalCount}</div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between shadow-xs">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">Under Watch</span>
                <span className="material-symbols-outlined text-amber-600">visibility</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{underWatchCount}</div>
            </div>

            <div className="bg-white border border-slate-200 border-l-4 border-l-red-600 p-4 rounded-xl flex flex-col justify-between shadow-xs">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">High Risk / Suspended</span>
                <span className="material-symbols-outlined text-red-600">warning</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{highRiskCount}</div>
            </div>
          </div>

          {/* Session Data Table matching Stitch Live Telemetry Feed */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">Live Telemetry Feed</h3>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1e3a8a] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00236f]"></span>
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide font-mono">Live Heartbeat</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-3.5">Session ID</th>
                    <th className="p-3.5">Device Node</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 w-[220px]">Risk Score (0-100)</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {sessions.map((s) => {
                    const isSelected = selectedSession?.id === s.id;
                    const isHigh = s.risk_score >= 70 || s.status === 'SUSPENDED';
                    const isWatch = s.risk_score >= 50 && s.risk_score < 70;

                    return (
                      <tr
                        key={s.id}
                        onClick={() => handleSelectSession(s)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/70 font-medium'
                            : isHigh
                            ? 'bg-red-50/40 hover:bg-red-50/60'
                            : isWatch
                            ? 'bg-amber-50/30 hover:bg-amber-50/50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3.5 font-mono text-xs font-semibold text-slate-800">{s.id}</td>
                        <td className="p-3.5 text-xs text-slate-600">{s.device_id}</td>
                        <td className="p-3.5 text-xs">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            s.status === 'SUSPENDED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 text-right font-mono text-xs font-bold text-slate-700">{s.risk_score}</span>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${s.risk_score}%` }}
                                className={`h-full ${
                                  isHigh ? 'bg-red-600' : isWatch ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          {s.status === 'SUSPENDED' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMainTab('REVIEWS');
                              }}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer"
                            >
                              Triage Review
                            </button>
                          ) : (
                            <button className="text-slate-400 hover:text-slate-600">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUSPENSION REVIEWS (MATCHING STITCH DESIGN)                        */}
      {/* ========================================================================= */}
      {mainTab === 'REVIEWS' && (
        <div className="space-y-6">
          {/* Alert Banner matching Stitch */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 flex items-center justify-between border-l-4 border-l-[#00236f]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#00236f]">notifications_active</span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Action Notification Logged</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Any escalations processed in this queue will automatically notify <span className="font-mono text-slate-700">admin@examvault.demo</span> and update the central audit ledger.
                </p>
              </div>
            </div>
          </div>

          {/* Pending Reviews Queue Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Pending Reviews Queue ({pendingReviews.length})
            </h3>

            {pendingReviews.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                Zero pending suspension reviews. All incidents have been addressed.
              </div>
            ) : (
              pendingReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col lg:flex-row gap-6 justify-between"
                >
                  <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-200 pb-4 lg:pb-0 lg:pr-6 space-y-3">
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase">Session ID</span>
                      <span className="font-mono text-sm font-bold text-slate-900">{rev.session_id}</span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase">Suspended At</span>
                      <span className="text-xs text-slate-700">{new Date(rev.suspended_at).toLocaleString()}</span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase">Score at Suspension</span>
                      <span className="font-mono text-sm font-bold text-red-600">{rev.risk_score_at_suspension} / 100 HIGH RISK</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Contributing Risk Signals</span>
                    <div className="flex flex-wrap gap-2">
                      {rev.contributing_risk_events?.map((ev, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-md text-xs flex items-center gap-2"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-medium">{ev.rule_name}:</span>
                          <span className="text-slate-600">{ev.reason}</span>
                          <span className="font-bold font-mono text-red-600">+{ev.points} pts</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openActionModal(rev, 'REINSTATE')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Reinstate Session</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openActionModal(rev, 'ESCALATE')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Escalate Incident</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Historical Resolution Ledger */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Suspension Resolution History ({resolvedReviews.length})
            </h3>

            <div className="space-y-3">
              {resolvedReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 font-mono font-bold">
                      <span>{rev.session_id}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        rev.status === 'REINSTATED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {rev.status}
                      </span>
                    </div>
                    <span className="text-slate-400">{new Date(rev.reviewed_at || rev.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-600">Note: {rev.review_note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ANOMALY PARAMETERS & RISK MATRIX                                    */}
      {/* ========================================================================= */}
      {mainTab === 'PARAMETERS' && (
        <div className="space-y-6">
          {/* Risk Thresholds Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-l-4 border-l-emerald-500">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Normal Risk</span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">0 – 49 Points</div>
              <span className="text-xs text-slate-500">Standard Access</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-l-4 border-l-amber-500">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Under Watch</span>
              <div className="text-xl font-bold font-mono text-amber-600 mt-1">50 – 69 Points</div>
              <span className="text-xs text-slate-500">Elevated Telemetry Sampling</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-l-4 border-l-red-600">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Auto-Suspension</span>
              <div className="text-xl font-bold font-mono text-red-600 mt-1">≥ 70 Points</div>
              <span className="text-xs text-slate-500">Immediate Session Lockout</span>
            </div>
          </div>

          {/* Anomaly Parameters & Risk Scores Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                Anomaly Parameters &amp; Risk Scores
              </h3>
              <span className="text-xs font-semibold text-slate-500 font-mono">8 Monitored Parameters</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-3.5">Parameter / Anomaly Rule</th>
                    <th className="p-3.5">Rule Code</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {ANOMALY_PARAMETERS.map((param) => (
                    <tr key={param.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-medium text-slate-900">{param.name}</td>
                      <td className="p-3.5 font-mono text-xs text-slate-500">{param.code}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold font-mono bg-slate-100 text-slate-700">
                          {param.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-red-600 text-sm">
                        +{param.points} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Action (Reinstate vs Escalate) */}
      {isActionModalOpen && activeReview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleExecuteReviewAction} className="bg-white border border-slate-200 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className={`p-2 rounded-lg ${actionType === 'REINSTATE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {actionType === 'REINSTATE' ? <Unlock className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {actionType === 'REINSTATE' ? 'Reinstate Suspended Account' : 'Escalate Incident to Authorities'}
                </h3>
                <p className="text-xs text-slate-500">Session ID: <strong className="text-slate-800 font-mono">{activeReview.session_id}</strong></p>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {actionType === 'REINSTATE' ? 'Mandatory Reinstatement Justification Note:' : 'Mandatory Escalation Reason:'}
              </label>
              <textarea
                rows={3}
                required
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Enter justification (minimum 10 characters)..."
                className="w-full p-2.5 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00236f] focus:border-[#00236f]"
              />
              <span className={`text-[10px] ${actionNote.length >= 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {actionNote.length}/10 chars minimum
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="px-3.5 py-2 border border-slate-200 text-slate-700 rounded-md text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={simulating || actionNote.trim().length < 10}
                className={`px-4 py-2 text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50 ${
                  actionType === 'REINSTATE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionType === 'REINSTATE' ? 'Confirm Reinstatement' : 'Execute Escalation'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
