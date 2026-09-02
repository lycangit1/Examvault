import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AboutSecurityLimits } from './pages/AboutSecurityLimits';
import { AccessDenied } from './pages/AccessDenied';
import { NotFound } from './pages/NotFound';

// Setter Pages
import { SetterDashboard } from './pages/setter/SetterDashboard';
import { QuestionEditor } from './pages/setter/QuestionEditor';
import { QuestionDetail } from './pages/setter/QuestionDetail';

// Reviewer Pages
import { ReviewerDashboard } from './pages/reviewer/ReviewerDashboard';
import { QuestionReview } from './pages/reviewer/QuestionReview';

// Approver Pages
import { ApproverDashboard } from './pages/approver/ApproverDashboard';

// Admin_2 Pages
import { Admin2Dashboard } from './pages/admin2/Admin2Dashboard';

// Investigator Pages
import { InvestigatorDashboard } from './pages/investigator/InvestigatorDashboard';
import { AuditLogsPage } from './pages/investigator/AuditLogsPage';
import { RiskSessionsPage } from './pages/investigator/RiskSessionsPage';
import { LeakInvestigationPage } from './pages/investigator/LeakInvestigationPage';
import { IntegrationsPage } from './pages/investigator/IntegrationsPage';
import { SecurityEventsPage } from './pages/investigator/SecurityEventsPage';
import { AppRole } from './types';

// Protected Route Guard with RBAC check
const ProtectedRoute: React.FC<{
  allowedRoles?: AppRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex items-center justify-center text-xs font-mono text-cyan-400">
        Initializing Security Context...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about-security-limits" element={<AboutSecurityLimits />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Setter Workspace */}
            <Route
              path="/setter/dashboard"
              element={
                <ProtectedRoute allowedRoles={['SETTER']}>
                  <SetterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/setter/questions"
              element={
                <ProtectedRoute allowedRoles={['SETTER']}>
                  <SetterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/setter/questions/new"
              element={
                <ProtectedRoute allowedRoles={['SETTER']}>
                  <QuestionEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/setter/questions/:questionId"
              element={
                <ProtectedRoute allowedRoles={['SETTER']}>
                  <QuestionDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/setter/questions/:questionId/edit"
              element={
                <ProtectedRoute allowedRoles={['SETTER']}>
                  <QuestionEditor />
                </ProtectedRoute>
              }
            />

            {/* Reviewer Workspace */}
            <Route
              path="/reviewer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['REVIEWER']}>
                  <ReviewerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviewer/questions"
              element={
                <ProtectedRoute allowedRoles={['REVIEWER']}>
                  <ReviewerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviewer/questions/:questionId"
              element={
                <ProtectedRoute allowedRoles={['REVIEWER']}>
                  <QuestionReview />
                </ProtectedRoute>
              }
            />

            {/* Approver Workspace */}
            <Route
              path="/approver/dashboard"
              element={
                <ProtectedRoute allowedRoles={['APPROVER']}>
                  <ApproverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approver/packages/new"
              element={
                <ProtectedRoute allowedRoles={['APPROVER']}>
                  <ApproverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approver/packages/:packageId"
              element={
                <ProtectedRoute allowedRoles={['APPROVER']}>
                  <ApproverDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin_2 Dual Control Workspace */}
            <Route
              path="/admin2/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN_2']}>
                  <Admin2Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin2/packages/:packageId"
              element={
                <ProtectedRoute allowedRoles={['ADMIN_2']}>
                  <Admin2Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Investigator Forensic Suite */}
            <Route
              path="/investigator/dashboard"
              element={
                <ProtectedRoute allowedRoles={['INVESTIGATOR']}>
                  <InvestigatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investigator/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['INVESTIGATOR']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investigator/risk-sessions"
              element={
                <ProtectedRoute allowedRoles={['INVESTIGATOR']}>
                  <RiskSessionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investigator/risk-sessions/:sessionId"
              element={
                <ProtectedRoute allowedRoles={['INVESTIGATOR']}>
                  <RiskSessionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investigator/security-events"
              element={
                <ProtectedRoute allowedRoles={['INVESTIGATOR']}>
                  <SecurityEventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investigator/leaks"
              element={
                <ProtectedRoute allowedRoles={['INVESTIGATOR']}>
                  <LeakInvestigationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investigator/leaks/:leakId"
              element={
                <ProtectedRoute allowedRoles={['INVESTIGATOR']}>
                  <LeakInvestigationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investigator/integrations"
              element={
                <ProtectedRoute allowedRoles={['INVESTIGATOR']}>
                  <IntegrationsPage />
                </ProtectedRoute>
              }
            />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
