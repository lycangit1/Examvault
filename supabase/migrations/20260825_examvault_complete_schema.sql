-- ExamVault Complete Supabase Schema, Security Functions, RLS, and Seed Data

-- 1. Enable Cryptography Extension
create extension if not exists pgcrypto with schema extensions;

-- 2. Custom Enums
do $$ begin
  create type public.app_role as enum ('SETTER', 'REVIEWER', 'APPROVER', 'ADMIN_2', 'INVESTIGATOR');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.question_status as enum ('DRAFT', 'UNDER_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.review_decision as enum ('APPROVED', 'REJECTED', 'NEEDS_REVISION');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.package_status as enum ('DRAFT', 'PENDING_DUAL_CONFIRMATION', 'FINAL_LOCKED', 'REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.device_match_status as enum ('REGISTERED', 'UNKNOWN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.session_status as enum ('ACTIVE', 'LOGGED_OUT', 'FLAGGED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.risk_level as enum ('LOW', 'MODERATE', 'HIGH');
exception when duplicate_object then null; end $$;

-- 3. Core Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.app_role not null,
  registered_device_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  title text not null,
  subject text not null,
  question_text text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  rough_notes text,
  attachment_path text,
  status public.question_status not null default 'DRAFT',
  created_by uuid not null references public.profiles(id),
  assigned_reviewer_id uuid references public.profiles(id),
  current_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions(id) on delete cascade,
  version_number integer not null,
  content_snapshot jsonb not null,
  changed_by uuid not null references public.profiles(id),
  changed_at timestamptz not null default now(),
  change_note text,
  unique(question_id, version_number)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  decision public.review_decision not null,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_packages (
  id uuid primary key default gen_random_uuid(),
  exam_name text not null,
  package_name text not null unique,
  status public.package_status not null default 'DRAFT',
  question_ids jsonb not null default '[]'::jsonb,
  package_hash text,
  initiated_by uuid references public.profiles(id),
  confirmed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  initiated_at timestamptz,
  locked_at timestamptz,
  rejection_reason text
);

create table if not exists public.app_sessions (
  id text primary key,
  user_id uuid not null references public.profiles(id),
  device_id text not null,
  device_match_status public.device_match_status not null,
  ip_address text,
  otp_verified boolean not null default false,
  otp_attempts integer not null default 0,
  face_verified boolean,
  login_time timestamptz not null default now(),
  logout_time timestamptz,
  risk_score integer not null default 0,
  risk_level public.risk_level not null default 'LOW',
  risk_reasons jsonb not null default '[]'::jsonb,
  status public.session_status not null default 'ACTIVE'
);

create table if not exists public.otp_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  timestamp timestamptz not null default now(),
  user_id uuid references public.profiles(id),
  role public.app_role,
  action text not null,
  entity_type text,
  entity_id text,
  session_id text references public.app_sessions(id),
  device_id text,
  ip_address text,
  risk_score integer default 0,
  previous_hash text,
  current_hash text not null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.session_risk_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.app_sessions(id) on delete cascade,
  signal_code text not null,
  signal_label text not null,
  points integer not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.leak_reports (
  id uuid primary key default gen_random_uuid(),
  leak_code text not null unique,
  storage_path text,
  detected_watermark text,
  entered_session_token text,
  matched_question_id text references public.questions(id),
  matched_session_id text references public.app_sessions(id),
  match_confidence text,
  risk_summary jsonb not null default '{}'::jsonb,
  investigator_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.package_exports (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.exam_packages(id),
  export_type text not null check (export_type in ('PRINT', 'CBT')),
  exported_by uuid not null references public.profiles(id),
  reference_id text not null,
  created_at timestamptz not null default now()
);

-- 4. Indexes
create index if not exists questions_created_by_idx on public.questions(created_by);
create index if not exists questions_reviewer_idx on public.questions(assigned_reviewer_id);
create index if not exists questions_status_idx on public.questions(status);
create index if not exists question_versions_question_idx on public.question_versions(question_id);
create index if not exists reviews_question_idx on public.reviews(question_id);
create index if not exists app_sessions_user_idx on public.app_sessions(user_id);
create index if not exists app_sessions_risk_idx on public.app_sessions(risk_score desc);
create index if not exists app_sessions_login_idx on public.app_sessions(login_time desc);
create index if not exists audit_logs_timestamp_idx on public.audit_logs(timestamp desc);
create index if not exists audit_logs_user_idx on public.audit_logs(user_id);
create index if not exists audit_logs_session_idx on public.audit_logs(session_id);
create index if not exists audit_logs_action_idx on public.audit_logs(action);
create index if not exists risk_events_session_idx on public.session_risk_events(session_id);
create index if not exists leak_reports_session_idx on public.leak_reports(matched_session_id);
create index if not exists leak_reports_question_idx on public.leak_reports(matched_question_id);
