import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AppRole, Profile, AppSession, DeviceMatchStatus, SystemLockdownState, RiskLevel } from '../types';

interface AuthContextType {
  user: Profile | null;
  session: AppSession | null;
  loading: boolean;
  loginPendingUser: Profile | null;
  pendingOtpChallenge: { otp: string; expiresAt: string } | null;
  deviceMode: DeviceMatchStatus;
  suspendedNotice: string | null;
  lockdownState: SystemLockdownState | null;
  setDeviceMode: (mode: DeviceMatchStatus) => void;
  clearSuspendedNotice: () => void;
  refreshLockdownState: () => Promise<void>;
  initiateLogin: (email: string, pass: string, deviceMode: DeviceMatchStatus) => Promise<{ success: boolean; error?: string; demoOtp?: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; error?: string }>;
  recordFaceResult: (verified: boolean) => Promise<void>;
  recordQuestionView: (questionId: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: AppRole) => Promise<void>;
}

const isUUID = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

const DEMO_PROFILES: Record<string, Profile> = {
  'setter_a@examvault.com': {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Setter_A',
    email: 'setter_a@examvault.com',
    role: 'SETTER',
    registered_device_id: 'SETTER_A-LAPTOP-01',
    created_at: '2026-01-01T00:00:00Z',
  },
  'reviewer_b@examvault.com': {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Reviewer_B',
    email: 'reviewer_b@examvault.com',
    role: 'REVIEWER',
    registered_device_id: 'REVIEWER_B-LAPTOP-01',
    created_at: '2026-01-01T00:00:00Z',
  },
  'approver_c@examvault.com': {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Approver_C',
    email: 'approver_c@examvault.com',
    role: 'APPROVER',
    registered_device_id: 'APPROVER_C-DESKTOP-01',
    created_at: '2026-01-01T00:00:00Z',
  },
  'admin2@examvault.com': {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Admin_2',
    email: 'admin2@examvault.com',
    role: 'ADMIN_2',
    registered_device_id: 'ADMIN2-SECURE-KEY-01',
    created_at: '2026-01-01T00:00:00Z',
  },
  'investigator@examvault.com': {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Investigator',
    email: 'investigator@examvault.com',
    role: 'INVESTIGATOR',
    registered_device_id: 'INVESTIGATOR-TERMINAL-01',
    created_at: '2026-01-01T00:00:00Z',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginPendingUser, setLoginPendingUser] = useState<Profile | null>(null);
  const [pendingOtpChallenge, setPendingOtpChallenge] = useState<{ otp: string; expiresAt: string } | null>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMatchStatus>('REGISTERED');
  const [suspendedNotice, setSuspendedNotice] = useState<string | null>(null);
  const [lockdownState, setLockdownState] = useState<SystemLockdownState | null>(null);

  const refreshLockdownState = async () => {
    try {
      const { data } = await supabase
        .from('system_lockdown_state')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (data) setLockdownState(data as SystemLockdownState);
    } catch {
      // Graceful fallback
    }
  };

  // Load active session from local storage & Supabase profile on init
  useEffect(() => {
    async function loadInitialSession() {
      try {
        const savedUserId = localStorage.getItem('examvault_user_id');
        const savedSessionId = localStorage.getItem('examvault_session_id');

        if (savedUserId) {
          const localMatch = Object.values(DEMO_PROFILES).find(p => p.id === savedUserId);
          if (localMatch) {
            setUser(localMatch);
            const savedSess = localStorage.getItem('examvault_session_obj');
            if (savedSess) {
              try {
                setSession(JSON.parse(savedSess));
              } catch {
                setSession({
                  id: savedSessionId || 'EV-DEMO-SESS',
                  user_id: localMatch.id,
                  device_id: localMatch.registered_device_id || 'REGISTERED_DEVICE',
                  device_match_status: 'REGISTERED',
                  ip_address: '192.168.1.108',
                  otp_verified: true,
                  otp_attempts: 1,
                  login_time: new Date().toISOString(),
                  risk_score: 0,
                  risk_level: 'NORMAL',
                  risk_reasons: [],
                  status: 'ACTIVE',
                  face_verified: true,
                  user: localMatch,
                });
              }
            }
          } else if (isUUID(savedUserId)) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', savedUserId)
              .maybeSingle();

            if (profile) {
              setUser(profile);

              if (isUUID(savedSessionId)) {
                const { data: appSess } = await supabase
                  .from('app_sessions')
                  .select('*')
                  .eq('id', savedSessionId)
                  .maybeSingle();
                if (appSess) {
                  if (appSess.status === 'SUSPENDED') {
                    setSuspendedNotice('Your session was suspended for security review. Please log in again.');
                    localStorage.removeItem('examvault_user_id');
                    localStorage.removeItem('examvault_session_id');
                    localStorage.removeItem('examvault_session_obj');
                    setUser(null);
                    setSession(null);
                  } else {
                    setSession(appSess);
                  }
                }
              }
            }
          }
        }
        await refreshLockdownState();
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialSession();

    const handleExpiryEvent = (e: any) => {
      setSuspendedNotice(e.detail?.message || 'Your session expired. Please log in again.');
      setUser(null);
      setSession(null);
    };

    window.addEventListener('examvault:session_expired', handleExpiryEvent);
    return () => window.removeEventListener('examvault:session_expired', handleExpiryEvent);
  }, []);

  // Continuous live session & lockdown monitor heartbeat
  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshLockdownState();

      // If lockdown is engaged, automatically terminate any active non-investigator session
      if (lockdownState?.is_locked && user && user.role !== 'INVESTIGATOR') {
        setSuspendedNotice('EMERGENCY SYSTEM LOCKDOWN ENGAGED: Non-investigator sessions have been automatically terminated.');
        localStorage.removeItem('examvault_user_id');
        localStorage.removeItem('examvault_session_id');
        localStorage.removeItem('examvault_session_obj');
        setUser(null);
        setSession(null);
        return;
      }

      if (session?.id && isUUID(session.id)) {
        try {
          const { data: liveSess } = await supabase
            .from('app_sessions')
            .select('status, risk_score, risk_level')
            .eq('id', session.id)
            .maybeSingle();

          if (liveSess) {
            if (liveSess.status === 'SUSPENDED') {
              setSuspendedNotice('Your session was suspended for security review. Please log in again.');
              localStorage.removeItem('examvault_user_id');
              localStorage.removeItem('examvault_session_id');
              localStorage.removeItem('examvault_session_obj');
              setUser(null);
              setSession(null);
            } else if (liveSess.risk_score !== session.risk_score || liveSess.risk_level !== session.risk_level) {
              setSession(prev => prev ? { ...prev, risk_score: liveSess.risk_score, risk_level: liveSess.risk_level, status: liveSess.status } : null);
            }
          }
        } catch {
          // Ignore offline heartbeat errors
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [session?.id, lockdownState?.is_locked, user?.role]);

  const initiateLogin = async (email: string, pass: string, devMode: DeviceMatchStatus) => {
    try {
      setLoading(true);
      setSuspendedNotice(null);
      const cleanEmail = email.trim().toLowerCase();

      // Check current lockdown state first
      let currentLockdown = lockdownState;
      try {
        const { data } = await supabase
          .from('system_lockdown_state')
          .select('*')
          .eq('id', 1)
          .maybeSingle();
        if (data) {
          currentLockdown = data as SystemLockdownState;
          setLockdownState(currentLockdown);
        }
      } catch {
        // Fallback to in-memory state
      }

      const isInvestigator = cleanEmail.includes('investigator') || cleanEmail.includes('invest');
      if (currentLockdown?.is_locked && !isInvestigator) {
        return {
          success: false,
          error: `EMERGENCY SYSTEM LOCKDOWN ACTIVE: Non-investigator logins are blocked. (${currentLockdown.lockdown_reason || 'Security threat threshold exceeded'})`
        };
      }

      // 1. Try Supabase authenticate_user RPC
      try {
        const { data: authRes, error: authErr } = await supabase.rpc('authenticate_user', {
          p_email: cleanEmail,
          p_password: pass,
          p_device_mode: devMode,
        });

        if (!authErr && authRes?.success) {
          setLoginPendingUser(authRes.user);
          setDeviceMode(devMode);
          setPendingOtpChallenge({
            otp: authRes.demo_otp,
            expiresAt: authRes.expires_at,
          });
          return { success: true, demoOtp: authRes.demo_otp };
        } else if (authRes && !authRes.success && authRes.error) {
          return { success: false, error: authRes.error };
        }
      } catch (e) {
        console.warn('Supabase auth RPC uncontactable, using fallback authentication:', e);
      }

      // 2. High-availability fallback for demo accounts
      const matchedDemo = DEMO_PROFILES[cleanEmail];
      if (matchedDemo && (pass === 'password123' || pass === 'password')) {
        if (currentLockdown?.is_locked && matchedDemo.role !== 'INVESTIGATOR') {
          return {
            success: false,
            error: 'EMERGENCY SYSTEM LOCKDOWN ACTIVE: Non-investigator access is restricted. Only Investigator personnel can authenticate.'
          };
        }

        setLoginPendingUser(matchedDemo);
        setDeviceMode(devMode);
        const demoOtp = '123456';
        setPendingOtpChallenge({
          otp: demoOtp,
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        });
        return { success: true, demoOtp };
      }

      return { success: false, error: 'Invalid email or password' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login attempt failed' };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (enteredOtp: string) => {
    if (!loginPendingUser) {
      return { success: false, error: 'No pending authentication challenge.' };
    }

    // Strict lockdown guard on OTP completion
    if (lockdownState?.is_locked && loginPendingUser.role !== 'INVESTIGATOR') {
      return {
        success: false,
        error: 'EMERGENCY SYSTEM LOCKDOWN ACTIVE: Non-investigator access is restricted. Only Investigator personnel can authenticate.'
      };
    }

    try {
      // 1. Try Supabase verify_demo_otp RPC
      try {
        const { data: verifyRes, error: verifyErr } = await supabase.rpc('verify_demo_otp', {
          p_user_id: loginPendingUser.id,
          p_otp: enteredOtp,
          p_device_mode: deviceMode,
          p_ip: '192.168.1.108',
        });

        if (!verifyErr && verifyRes?.success) {
          const { data: appSess } = await supabase
            .from('app_sessions')
            .select('*')
            .eq('id', verifyRes.session_id)
            .maybeSingle();

          setUser(loginPendingUser);
          if (appSess) {
            setSession(appSess);
            localStorage.setItem('examvault_session_obj', JSON.stringify(appSess));
          }
          setSuspendedNotice(null);
          localStorage.setItem('examvault_user_id', loginPendingUser.id);
          localStorage.setItem('examvault_session_id', verifyRes.session_id);
          return { success: true };
        }
      } catch (e) {
        console.warn('Supabase verify OTP RPC uncontactable, using fallback session creation:', e);
      }

      // 2. High-availability fallback verification for OTP 123456
      if (enteredOtp.trim() === '123456' || (pendingOtpChallenge && enteredOtp.trim() === pendingOtpChallenge.otp)) {
        const fallbackSessionId = `EV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const riskLevel: RiskLevel = deviceMode === 'UNKNOWN' ? 'UNDER_WATCH' : 'NORMAL';
        const fallbackSess: AppSession = {
          id: fallbackSessionId,
          user_id: loginPendingUser.id,
          device_id: deviceMode === 'REGISTERED' 
            ? (loginPendingUser.registered_device_id || `${loginPendingUser.role}_SECURE_DEVICE`) 
            : `UNKNOWN-DEVICE-${Math.floor(100 + Math.random() * 900)}`,
          device_match_status: deviceMode,
          ip_address: '192.168.1.108',
          otp_verified: true,
          otp_attempts: 1,
          login_time: new Date().toISOString(),
          risk_score: deviceMode === 'UNKNOWN' ? 35 : 0,
          risk_level: riskLevel,
          risk_reasons: deviceMode === 'UNKNOWN' ? [{ points: 35, signal_label: 'Unknown Device Posture' }] : [],
          status: 'ACTIVE',
          face_verified: false,
          user: loginPendingUser,
        };

        setUser(loginPendingUser);
        setSession(fallbackSess);
        setSuspendedNotice(null);
        localStorage.setItem('examvault_user_id', loginPendingUser.id);
        localStorage.setItem('examvault_session_id', fallbackSessionId);
        localStorage.setItem('examvault_session_obj', JSON.stringify(fallbackSess));
        return { success: true };
      }

      return { success: false, error: 'Invalid OTP code. Please enter 123456.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification failed' };
    }
  };

  const recordFaceResult = async (faceVerified: boolean) => {
    if (!session) return;
    if (isUUID(session.id)) {
      try {
        await supabase.rpc('record_face_verification', {
          p_session_id: session.id,
          p_face_verified: faceVerified,
        });
      } catch {
        // Ignore offline error
      }
    }
    setSession(prev => prev ? { ...prev, face_verified: faceVerified } : null);
  };

  const logout = async () => {
    try {
      if (session && isUUID(session.id)) {
        await supabase
          .from('app_sessions')
          .update({ status: 'LOGGED_OUT', logout_time: new Date().toISOString() })
          .eq('id', session.id);
      }
    } catch {
      // Ignore offline error
    } finally {
      setUser(null);
      setSession(null);
      setLoginPendingUser(null);
      setPendingOtpChallenge(null);
      localStorage.removeItem('examvault_user_id');
      localStorage.removeItem('examvault_session_id');
      localStorage.removeItem('examvault_session_obj');
    }
  };

  const switchDemoRole = async (targetRole: AppRole) => {
    if (lockdownState?.is_locked && targetRole !== 'INVESTIGATOR') {
      setSuspendedNotice('EMERGENCY SYSTEM LOCKDOWN ACTIVE: Cannot switch to non-investigator roles while system is locked.');
      return;
    }

    const roleEmails: Record<AppRole, string> = {
      SETTER: 'setter_a@examvault.com',
      REVIEWER: 'reviewer_b@examvault.com',
      APPROVER: 'approver_c@examvault.com',
      ADMIN_2: 'admin2@examvault.com',
      INVESTIGATOR: 'investigator@examvault.com',
    };

    const targetEmail = roleEmails[targetRole];
    await logout();
    const res = await initiateLogin(targetEmail, 'password123', 'REGISTERED');
    if (res.success && res.demoOtp) {
      await verifyOtp(res.demoOtp);
    }
  };

  const recentViewsRef = useRef<{ questionId: string; timestamp: number }[]>([]);

  const recordQuestionView = async (questionId: string) => {
    if (!session) return;

    const now = Date.now();
    // Rolling 60-second window
    const updatedViews = [...recentViewsRef.current.filter(v => now - v.timestamp < 60000), { questionId, timestamp: now }];
    recentViewsRef.current = updatedViews;

    let remoteSuspended = false;
    let remoteScore = 0;

    // 1. Try Supabase RPC
    try {
      const { data, error } = await supabase.rpc('record_question_view', {
        p_question_id: questionId,
        p_session_id: session.id,
        p_user_id: user?.id,
      });

      if (data && !error) {
        if (data.score) remoteScore = Number(data.score);
        if (data.suspended) remoteSuspended = true;
      }
    } catch {
      // offline fallback
    }

    // 2. Client-side Real-time Anomaly Evaluation
    const rapidViewsCount = updatedViews.length;
    let calculatedScore = Math.max(session.risk_score || 0, remoteScore);
    let shouldAutoSuspend = remoteSuspended;

    // Trigger pacing velocity anomaly when 4+ items are viewed within 60 seconds
    if (rapidViewsCount >= 4) {
      if (!session.risk_reasons?.some((r: any) => r.signal_label?.includes('Rapid') || r.rule_name === 'RAPID_QUESTION_ACCESS')) {
        calculatedScore = Math.min(100, calculatedScore + 35);
      }

      // If user is on UNKNOWN device (starts at 35 + 35 = 70) or rapid views reach 6+ views, suspend immediately
      if (rapidViewsCount >= 6 || session.device_match_status === 'UNKNOWN' || calculatedScore >= 60) {
        shouldAutoSuspend = true;
      }
    }

    if (shouldAutoSuspend) {
      const notice = '⚠️ ANOMALY DETECTED & ACTIVE SESSION SUSPENDED: Rapid sequential question inspection velocity exceeded security threshold (4+ items in under 60 seconds). Session automatically locked for forensic investigation.';
      setSuspendedNotice(notice);
      localStorage.removeItem('examvault_user_id');
      localStorage.removeItem('examvault_session_id');
      localStorage.removeItem('examvault_session_obj');
      setUser(null);
      setSession(null);
      window.dispatchEvent(new CustomEvent('examvault:session_expired', {
        detail: { message: notice }
      }));
      return;
    }

    if (calculatedScore !== session.risk_score) {
      const newLevel: RiskLevel = calculatedScore >= 60 ? 'HIGH_RISK' : calculatedScore >= 30 ? 'UNDER_WATCH' : 'NORMAL';
      const updatedSess: AppSession = {
        ...session,
        risk_score: calculatedScore,
        risk_level: newLevel,
        risk_reasons: [
          ...(session.risk_reasons || []),
          { points: 35, signal_label: 'Rapid Question Inspection Velocity Anomaly' }
        ]
      };
      setSession(updatedSess);
      localStorage.setItem('examvault_session_obj', JSON.stringify(updatedSess));
    }
  };

  const clearSuspendedNotice = () => setSuspendedNotice(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        loginPendingUser,
        pendingOtpChallenge,
        deviceMode,
        suspendedNotice,
        lockdownState,
        setDeviceMode,
        clearSuspendedNotice,
        refreshLockdownState,
        initiateLogin,
        verifyOtp,
        recordFaceResult,
        recordQuestionView,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
