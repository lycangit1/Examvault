import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AppRole, Profile, AppSession, DeviceMatchStatus, SystemLockdownState } from '../types';

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
  logout: () => Promise<void>;
  switchDemoRole: (role: AppRole) => Promise<void>;
}

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
        .single();
      if (data) setLockdownState(data as SystemLockdownState);
    } catch (err) {
      console.error('Failed to fetch lockdown state:', err);
    }
  };

  // Load active session from local storage & Supabase profile on init
  useEffect(() => {
    async function loadInitialSession() {
      try {
        const savedUserId = localStorage.getItem('examvault_user_id');
        const savedSessionId = localStorage.getItem('examvault_session_id');

        if (savedUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', savedUserId)
            .single();

          if (profile) {
            setUser(profile);

            if (savedSessionId) {
              const { data: appSess } = await supabase
                .from('app_sessions')
                .select('*')
                .eq('id', savedSessionId)
                .single();
              if (appSess) {
                if (appSess.status === 'SUSPENDED') {
                  setSuspendedNotice('Your session was suspended for security review. Please log in again.');
                  localStorage.removeItem('examvault_user_id');
                  localStorage.removeItem('examvault_session_id');
                  setUser(null);
                  setSession(null);
                } else {
                  setSession(appSess);
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

    // Listen for 401 session expiry events from secure API client
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
      // 1. Check lockdown state
      await refreshLockdownState();

      // 2. Check if active session was auto-suspended server-side
      if (session?.id) {
        const { data: liveSess } = await supabase
          .from('app_sessions')
          .select('status, risk_score, risk_level')
          .eq('id', session.id)
          .single();

        if (liveSess) {
          if (liveSess.status === 'SUSPENDED') {
            setSuspendedNotice('Your session was suspended for security review. Please log in again.');
            localStorage.removeItem('examvault_user_id');
            localStorage.removeItem('examvault_session_id');
            setUser(null);
            setSession(null);
          } else if (liveSess.risk_score !== session.risk_score || liveSess.risk_level !== session.risk_level) {
            setSession(prev => prev ? { ...prev, risk_score: liveSess.risk_score, risk_level: liveSess.risk_level, status: liveSess.status } : null);
          }
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [session?.id]);

  const initiateLogin = async (email: string, pass: string, devMode: DeviceMatchStatus) => {
    try {
      setLoading(true);
      setSuspendedNotice(null);

      // Call secure authenticate_user RPC function
      const { data: authRes, error: authErr } = await supabase.rpc('authenticate_user', {
        p_email: email.trim(),
        p_password: pass,
        p_device_mode: devMode,
      });

      if (authErr || !authRes?.success) {
        return { success: false, error: authRes?.error || 'Invalid email or password' };
      }

      setLoginPendingUser(authRes.user);
      setDeviceMode(devMode);
      setPendingOtpChallenge({
        otp: authRes.demo_otp,
        expiresAt: authRes.expires_at,
      });

      return { success: true, demoOtp: authRes.demo_otp };
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

    try {
      const { data: verifyRes, error: verifyErr } = await supabase.rpc('verify_demo_otp', {
        p_user_id: loginPendingUser.id,
        p_otp: enteredOtp,
        p_device_mode: deviceMode,
        p_ip: '192.168.1.108',
      });

      if (verifyErr || !verifyRes?.success) {
        return { success: false, error: verifyRes?.error || 'Invalid OTP code' };
      }

      // Fetch the newly created app session
      const { data: appSess } = await supabase
        .from('app_sessions')
        .select('*')
        .eq('id', verifyRes.session_id)
        .single();

      setUser(loginPendingUser);
      setSession(appSess);
      setSuspendedNotice(null);
      localStorage.setItem('examvault_user_id', loginPendingUser.id);
      localStorage.setItem('examvault_session_id', verifyRes.session_id);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification failed' };
    }
  };

  const recordFaceResult = async (faceVerified: boolean) => {
    if (!session) return;
    try {
      const { data: faceRes } = await supabase.rpc('record_face_verification', {
        p_session_id: session.id,
        p_face_verified: faceVerified,
      });

      if (faceRes?.success) {
        const { data: updatedSess } = await supabase
          .from('app_sessions')
          .select('*')
          .eq('id', session.id)
          .single();
        if (updatedSess) setSession(updatedSess);
      }
    } catch (err) {
      console.error('Failed to record face result:', err);
    }
  };

  const logout = async () => {
    try {
      if (session) {
        await supabase
          .from('app_sessions')
          .update({ status: 'LOGGED_OUT', logout_time: new Date().toISOString() })
          .eq('id', session.id);
      }
      setUser(null);
      setSession(null);
      setLoginPendingUser(null);
      setPendingOtpChallenge(null);
      localStorage.removeItem('examvault_user_id');
      localStorage.removeItem('examvault_session_id');
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const switchDemoRole = async (targetRole: AppRole) => {
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
