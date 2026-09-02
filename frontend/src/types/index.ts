export type AppRole = 'SETTER' | 'REVIEWER' | 'APPROVER' | 'ADMIN_2' | 'INVESTIGATOR';

export type QuestionStatus = 'DRAFT' | 'UNDER_REVIEW' | 'NEEDS_REVISION' | 'APPROVED' | 'REJECTED';

export type ReviewDecision = 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';

export type PackageStatus = 'DRAFT' | 'PENDING_DUAL_CONFIRMATION' | 'FINAL_LOCKED' | 'REJECTED';

export type DeviceMatchStatus = 'REGISTERED' | 'UNKNOWN';

export type SessionStatus = 'ACTIVE' | 'LOGGED_OUT' | 'FLAGGED' | 'SUSPENDED';

export type RiskLevel = 'NORMAL' | 'UNDER_WATCH' | 'HIGH_RISK';

export interface SystemLockdownState {
  id: number;
  is_locked: boolean;
  is_pre_warning: boolean;
  pre_warning_reason?: string;
  pre_warning_at?: string;
  lockdown_reason?: string;
  triggered_at?: string;
  triggered_by?: string;
  signals_snapshot?: any[];
  lifted_at?: string;
  lifted_by?: string;
  lift_justification?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  registered_device_id: string;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  title: string;
  subject: string;
  question_text: string;
  options: QuestionOption[];
  correct_answer: string; // matches QuestionOption.id (e.g. 'option_2')
  explanation?: string;
  rough_notes?: string;
  attachment_path?: string;
  status: QuestionStatus;
  created_by: string;
  assigned_reviewer_id?: string;
  current_version: number;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  reviewer?: Profile;
}

export interface QuestionVersion {
  id: string;
  question_id: string;
  version_number: number;
  content_snapshot: {
    title?: string;
    subject?: string;
    question_text: string;
    options?: QuestionOption[];
    correct_answer?: string;
    explanation?: string;
    rough_notes?: string;
  };
  changed_by: string;
  changed_at: string;
  change_note?: string;
  changer?: Profile;
}

export interface Review {
  id: string;
  question_id: string;
  reviewer_id: string;
  decision: ReviewDecision;
  comment?: string;
  created_at: string;
  reviewer?: Profile;
}

export interface ExamPackage {
  id: string;
  exam_name: string;
  package_name: string;
  status: PackageStatus;
  question_ids: string[];
  package_hash?: string;
  initiated_by?: string;
  confirmed_by?: string;
  created_at: string;
  initiated_at?: string;
  locked_at?: string;
  rejection_reason?: string;
  initiator?: Profile;
  confirmer?: Profile;
}

export interface RiskReason {
  signal_code?: string;
  rule_name?: string;
  signal_label?: string;
  reason?: string;
  points: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface RiskEvent {
  id: string;
  session_id: string;
  rule_name: string;
  points: number;
  reason: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AppSession {
  id: string;
  user_id: string;
  device_id: string;
  device_match_status: DeviceMatchStatus;
  ip_address?: string;
  otp_verified: boolean;
  otp_attempts: number;
  face_verified?: boolean | null;
  login_time: string;
  logout_time?: string;
  risk_score: number;
  risk_level: RiskLevel;
  risk_reasons: RiskReason[];
  risk_events?: RiskEvent[];
  status: SessionStatus;
  user?: Profile;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user_id?: string;
  role?: AppRole;
  action: string;
  entity_type?: string;
  entity_id?: string;
  session_id?: string;
  device_id?: string;
  ip_address?: string;
  risk_score: number;
  previous_hash?: string;
  current_hash: string;
  metadata: Record<string, any>;
  user?: Profile;
}

export interface SessionRiskEvent {
  id: string;
  session_id: string;
  signal_code: string;
  signal_label: string;
  points: number;
  created_at: string;
  metadata: Record<string, any>;
}

export interface LeakReport {
  id: string;
  leak_code: string;
  storage_path?: string;
  detected_watermark?: string;
  entered_session_token?: string;
  matched_question_id?: string;
  matched_session_id?: string;
  match_confidence: string;
  risk_summary?: {
    user_name?: string;
    user_email?: string;
    user_role?: AppRole;
    attributed_actor?: string;
    attributed_name?: string;
    attributed_role?: AppRole;
    device_id?: string;
    device_status?: DeviceMatchStatus;
    risk_score?: number;
    risk_level?: RiskLevel;
    risk_reasons?: RiskReason[];
    login_time?: string;
    question_title?: string;
    [key: string]: any;
  };
  investigator_id?: string;
  created_at: string;
  investigator?: Profile;
}

export interface PackageExport {
  id: string;
  package_id: string;
  export_type: 'PRINT' | 'CBT';
  exported_by: string;
  reference_id: string;
  created_at: string;
  exporter?: Profile;
}

export type SuspensionReviewStatus = 'PENDING' | 'REINSTATED' | 'ESCALATED' | 'DENIED';

export interface SuspensionReview {
  id: string;
  session_id: string;
  user_id: string;
  suspended_at: string;
  risk_score_at_suspension: number;
  contributing_risk_events: Array<{
    rule_name: string;
    points: number;
    reason: string;
    timestamp?: string;
  }>;
  status: SuspensionReviewStatus;
  reviewed_by?: string;
  review_note?: string;
  reviewed_at?: string;
  created_at: string;
  user?: Profile;
  reviewer?: Profile;
}

