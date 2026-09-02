# TECHNICAL ARCHITECTURE DOCUMENT
## ExamVault Backend
## Platform: Supabase
## Product: ExamVault
## Team: ATARAXIA
## Version: Final MVP

---

# 1. Architecture Decision

Build the ExamVault backend using Supabase.

Use:

- Supabase Auth for email/password authentication
- Supabase PostgreSQL for relational application data
- Row Level Security for database-level role and resource access control
- Supabase Storage for question attachments and leak-evidence uploads
- Supabase Edge Functions for privileged business logic
- PostgreSQL functions and transactions for integrity-sensitive operations
- Supabase MCP server in Antigravity for schema creation, SQL migration execution, policy setup, seed data, and function deployment

Do not use SQLite.

Do not use a separate FastAPI backend for the main MVP.

A separate Python service is optional only in the future if robust OCR or specialised image processing is required. The MVP must work without it through manual watermark/session token entry.

---

# 2. Backend Design Principles

The backend must enforce:

1. Least privilege
2. Backend/database-enforced RBAC
3. Tamper-evident audit events
4. Human-review-based leak investigation
5. Clear distinction between evidence and proof
6. Private evidence storage
7. No raw biometric data storage
8. No service-role key exposed to frontend
9. No direct frontend modification of sensitive security fields
10. Clear prototype labelling of simulated capabilities

---

# 3. Target Architecture

```text
Google Stitch UI Design
        ↓
React + Vite + TypeScript Frontend
        ↓
Supabase JavaScript Client
        ↓
Supabase Auth
        ↓
Supabase PostgreSQL + RLS
        ↓
Supabase Edge Functions
        ↓
Supabase Storage
```

## Security boundaries

Frontend may directly read/write only data permitted by RLS.

Frontend must call Edge Functions for:

```text
Demo OTP generation and verification
Device-risk event recording
Face-result recording
Question workflow transitions
Review decisions
Final package lock initiation
Final package lock confirmation
Final package lock rejection
Package hash generation
Audit-event creation
Audit-chain verification
Demo audit tampering
Risk-score recalculation
Leak evidence analysis
Print export simulation
CBT handoff simulation
```

Use the Supabase publishable/anonymous key in the frontend.

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
Database password
JWT secret
Any Edge Function secret
```

Supabase recommends RLS for granular access control in exposed database tables, and Edge Functions are appropriate for protected server-side actions involving Auth, database access, and Storage. [48][50][51]

---

# 4. Authentication Model

## Supabase Auth

Use email and password authentication.

Seed the following users through Supabase Auth:

| User | Email | Password | Application role |
|---|---|---|---|
| Setter_A | setter_a@examvault.demo | password123 | SETTER |
| Reviewer_B | reviewer_b@examvault.demo | password123 | REVIEWER |
| Approver_C | approver_c@examvault.demo | password123 | APPROVER |
| Admin_2 | admin2@examvault.demo | password123 | ADMIN_2 |
| Investigator | investigator@examvault.demo | password123 | INVESTIGATOR |

The Supabase Auth user ID is the canonical identity key.

## Profile model

Create a `profiles` table linked one-to-one with `auth.users`.

Store:

```text
id UUID primary key references auth.users(id)
name text not null
email text not null
role app_role not null
registered_device_id text not null
created_at timestamptz default now()
```

## Simulated OTP

This MVP uses password login through Supabase Auth, followed by a clearly labelled demo OTP verification step.

Flow:

```text
Supabase Auth password sign-in
        ↓
Call create-demo-otp Edge Function
        ↓
Create temporary OTP challenge
        ↓
Return OTP to UI only in development/demo mode
        ↓
User enters OTP
        ↓
Call verify-demo-otp Edge Function
        ↓
Create application session record
        ↓
Proceed to device and simulated face result
```

OTP requirements:

```text
Six digits
Two-minute expiry
Maximum three attempts
Store hash of OTP, not plaintext where possible
Never claim that this is SMS/email MFA
```

## Simulated face verification

Store only:

```text
face_verified boolean
```

Never store:

```text
Face image
Webcam capture
Embedding
Biometric template
```

Face failure does not block the user. It contributes risk points.

---

# 5. Custom Types

Create these PostgreSQL enum types.

```sql
create type public.app_role as enum (
  'SETTER',
  'REVIEWER',
  'APPROVER',
  'ADMIN_2',
  'INVESTIGATOR'
);

create type public.question_status as enum (
  'DRAFT',
  'UNDER_REVIEW',
  'NEEDS_REVISION',
  'APPROVED',
  'REJECTED'
);

create type public.review_decision as enum (
  'APPROVED',
  'REJECTED',
  'NEEDS_REVISION'
);

create type public.package_status as enum (
  'DRAFT',
  'PENDING_DUAL_CONFIRMATION',
  'FINAL_LOCKED',
  'REJECTED'
);

create type public.device_match_status as enum (
  'REGISTERED',
  'UNKNOWN'
);

create type public.session_status as enum (
  'ACTIVE',
  'LOGGED_OUT',
  'FLAGGED'
);

create type public.risk_level as enum (
  'LOW',
  'MODERATE',
  'HIGH'
);
```

---

# 6. PostgreSQL Database Schema

## profiles

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.app_role not null,
  registered_device_id text not null,
  created_at timestamptz not null default now()
);
```

## questions

```sql
create table public.questions (
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
```

`options` format:

```json
[
  {"id": "option_1", "text": "2 m/s²"},
  {"id": "option_2", "text": "4 m/s²"},
  {"id": "option_3", "text": "6 m/s²"},
  {"id": "option_4", "text": "8 m/s²"}
]
```

`correct_answer` stores option ID, not display letter:

```text
option_2
```

This prevents fingerprint option reordering from corrupting correctness.

## question_versions

```sql
create table public.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions(id) on delete cascade,
  version_number integer not null,
  content_snapshot jsonb not null,
  changed_by uuid not null references public.profiles(id),
  changed_at timestamptz not null default now(),
  change_note text,
  unique(question_id, version_number)
);
```

## reviews

```sql
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  decision public.review_decision not null,
  comment text,
  created_at timestamptz not null default now()
);
```

## exam_packages

```sql
create table public.exam_packages (
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
```

## app_sessions

```sql
create table public.app_sessions (
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
```

## otp_challenges

```sql
create table public.otp_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
```

This table must not be directly readable from the frontend.

## audit_logs

```sql
create table public.audit_logs (
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
```

## session_risk_events

```sql
create table public.session_risk_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.app_sessions(id) on delete cascade,
  signal_code text not null,
  signal_label text not null,
  points integer not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
```

## leak_reports

```sql
create table public.leak_reports (
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
```

## package_exports

```sql
create table public.package_exports (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.exam_packages(id),
  export_type text not null check (export_type in ('PRINT', 'CBT')),
  exported_by uuid not null references public.profiles(id),
  reference_id text not null,
  created_at timestamptz not null default now()
);
```

---

# 7. Required Indexes

Create indexes for common investigation and workflow queries.

```sql
create index questions_created_by_idx on public.questions(created_by);
create index questions_reviewer_idx on public.questions(assigned_reviewer_id);
create index questions_status_idx on public.questions(status);

create index question_versions_question_idx on public.question_versions(question_id);

create index reviews_question_idx on public.reviews(question_id);

create index app_sessions_user_idx on public.app_sessions(user_id);
create index app_sessions_risk_idx on public.app_sessions(risk_score desc);
create index app_sessions_login_idx on public.app_sessions(login_time desc);

create index audit_logs_timestamp_idx on public.audit_logs(timestamp desc);
create index audit_logs_user_idx on public.audit_logs(user_id);
create index audit_logs_session_idx on public.audit_logs(session_id);
create index audit_logs_action_idx on public.audit_logs(action);

create index risk_events_session_idx on public.session_risk_events(session_id);

create index leak_reports_session_idx on public.leak_reports(matched_session_id);
create index leak_reports_question_idx on public.leak_reports(matched_question_id);
```

---

# 8. Row Level Security

Enable RLS on every public table.

```sql
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.question_versions enable row level security;
alter table public.reviews enable row level security;
alter table public.exam_packages enable row level security;
alter table public.app_sessions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.session_risk_events enable row level security;
alter table public.leak_reports enable row level security;
alter table public.package_exports enable row level security;
alter table public.otp_challenges enable row level security;
```

## Helper role function

Create a security-definer helper function:

```sql
create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;
```

## Profile policy

Users can read their own profile.

```sql
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());
```

Investigator can read profiles for investigations.

## Questions policies

Setter:

```text
Can read only questions created by themselves.
Can create questions where created_by = auth.uid().
Can update only own questions if status is DRAFT or NEEDS_REVISION.
Cannot directly set status to APPROVED.
```

Reviewer:

```text
Can read only questions assigned_reviewer_id = auth.uid().
Cannot modify question content directly.
```

Approver:

```text
Can read only APPROVED questions.
Cannot modify question content.
```

Admin_2:

```text
Can read package data needed to confirm/reject locks.
Cannot read/edit all question content by default.
```

Investigator:

```text
Can read questions, audit logs, sessions, package metadata, risk events, and leak reports.
Cannot modify question content.
```

Do not expose broad direct update policies for workflow fields. Use Edge Functions or RPC functions for status transitions.

## Audit policies

Regular users:

```text
No direct insert/update/delete access.
```

Investigator:

```text
Read-only access.
```

Only protected Edge Functions/service role may create audit events.

## Session policies

Users:

```text
Can read only their own active/historical sessions.
```

Investigator:

```text
Can read all sessions and risk context.
```

No direct frontend update for risk score, reasons, OTP fields, face status, or session state.

## Package policies

Approver:

```text
Can create draft packages and read packages they initiated.
```

Admin_2:

```text
Can read PENDING_DUAL_CONFIRMATION packages.
```

Investigator:

```text
Read-only access to all package records.
```

Locked package modification must occur only through Edge Function and transaction.

---

# 9. Supabase Storage

Create private buckets.

## question-attachments

Purpose:

```text
Optional diagrams/images attached to questions.
```

Rules:

- Private bucket.
- Setter may upload files only for questions they own.
- Reviewer may read files only for assigned questions.
- Investigator may read evidence-related files where needed.
- Do not make this bucket public.

## leak-evidence

Purpose:

```text
Suspected leaked screenshots uploaded by Investigator.
```

Rules:

- Private bucket.
- Only INVESTIGATOR can upload/read.
- Use signed URLs for temporary image preview.
- Store storage object path in `leak_reports.storage_path`.
- Log every upload and report generation.

Supabase Storage supports policy-based access via RLS on storage objects; keep both buckets private and restrict access accordingly. [52]

---

# 10. Edge Functions

Implement each function as a Supabase Edge Function using TypeScript/Deno.

Every function must:

1. Read and validate Authorization bearer token.
2. Resolve user identity through Supabase Auth.
3. Check role and relevant resource ownership/assignment.
4. Validate input with a schema.
5. Call secure database RPC functions where appropriate.
6. Create audit event.
7. Return clear status and error responses.
8. Never expose service-role secrets or private data.

## auth-create-demo-otp

Input:

```json
{
  "device_mode": "REGISTERED" | "UNKNOWN"
}
```

Actions:

- Confirm authenticated Supabase Auth user.
- Create OTP challenge with hashed six-digit OTP.
- Expire after two minutes.
- Return demo OTP only in local/demo environment.
- Record pending login/session context.
- Do not create a completed application session yet.

## auth-verify-demo-otp

Input:

```json
{
  "otp": "482913"
}
```

Actions:

- Verify challenge.
- Increment failed attempts when incorrect.
- Mark OTP verified when correct.
- Create app session ID.
- Store device mode, simulated device ID, and simulated IP.
- Write audit events:
  - OTP_VERIFIED
  - OTP_FAILED
  - DEVICE_MISMATCH, if relevant
  - LOGIN_SUCCESS

## auth-record-face-result

Input:

```json
{
  "session_id": "EV-2026-1042",
  "face_verified": true
}
```

Actions:

- Store only boolean result.
- Audit `FACE_VERIFIED` or `FACE_VERIFICATION_FAILED`.
- Recalculate risk.

## create-question

Input:

```json
{
  "id": "Q-101",
  "title": "Kinematics — Velocity Calculation",
  "subject": "Physics",
  "question_text": "...",
  "options": [],
  "correct_answer": "option_2",
  "explanation": "...",
  "rough_notes": "...",
  "assigned_reviewer_id": "uuid"
}
```

Actions:

- Require SETTER role.
- Insert question.
- Insert version 1 snapshot.
- Create `QUESTION_CREATED` audit event.

## update-question

Actions:

- Require question owner and editable status.
- Increment version.
- Store immutable version snapshot.
- Update timestamp.
- Create `QUESTION_UPDATED` audit event.

## submit-question-for-review

Actions:

- Require owner/setter.
- Validate question is DRAFT or NEEDS_REVISION.
- Set status `UNDER_REVIEW`.
- Create audit event `QUESTION_SUBMITTED_FOR_REVIEW`.

## record-question-view

Actions:

- Require role access to question.
- Record sensitive `QUESTION_VIEWED` audit event.
- Attach session ID, device, and risk score.
- Trigger high-volume rule calculation.
- Return a session-specific option order / fingerprint seed.

## submit-review-decision

Input:

```json
{
  "question_id": "Q-101",
  "decision": "APPROVED" | "REJECTED" | "NEEDS_REVISION",
  "comment": "Check numerical value in Option C"
}
```

Actions:

- Require assigned REVIEWER.
- Insert review.
- Update question status through transaction.
- Create `QUESTION_REVIEWED` audit event.

## initiate-final-lock

Actions:

- Require APPROVER.
- Confirm all selected questions are APPROVED.
- Create package or update draft package.
- Set package `PENDING_DUAL_CONFIRMATION`.
- Set initiated_by and initiated_at.
- Create `FINAL_LOCK_INITIATED` audit event.

## confirm-final-lock

Actions:

- Require ADMIN_2.
- Confirm package is pending.
- Confirm `auth.uid()` is not same as `initiated_by`.
- Calculate SHA-256 package hash from canonical package payload.
- Set package `FINAL_LOCKED`.
- Set confirmed_by and locked_at.
- Create `FINAL_LOCK_CONFIRMED` audit event.
- Ensure lock and audit event occur in one database transaction.

## reject-final-lock

Actions:

- Require ADMIN_2.
- Set package status to `REJECTED`.
- Store reason.
- Create `FINAL_LOCK_REJECTED` audit event.

## verify-audit-integrity

Actions:

- Require INVESTIGATOR.
- Recompute hash chain in chronological order.
- Return:

```json
{
  "status": "VERIFIED",
  "records_checked": 842,
  "broken_record": null
}
```

or:

```json
{
  "status": "INTEGRITY_ALERT",
  "records_checked": 182,
  "broken_record": 182,
  "reason": "Current hash mismatch"
}
```

## simulate-audit-tampering

Actions:

- Require INVESTIGATOR.
- Only available when `DEMO_MODE=true`.
- Modify a selected historical log metadata field without recomputing hashes.
- Return warning.
- Create no normal audit event after altering the demo record, otherwise the demonstration becomes confusing.

## recalculate-session-risk

Actions:

- Read session and related relevant events.
- Calculate score using exact specified weights.
- Update `app_sessions.risk_score`, `risk_level`, and `risk_reasons`.
- Insert new `session_risk_events` only when signal is first observed.

## create-leak-report

Input:

```json
{
  "storage_path": "investigator-id/leak-001.png",
  "detected_watermark": "CONFIDENTIAL -  Reviewer_B -  EV-1042 -  02:14",
  "manual_session_token": "EV-1042",
  "question_id": "Q-101"
}
```

Actions:

- Require INVESTIGATOR.
- Match session token to app session.
- Match question when supplied.
- Retrieve user, device, risk, related logs.
- Determine confidence:
  - High: matching session and question
  - Medium: matching session only
  - Low: partial/ambiguous match
- Create leak report.
- Add an evidence identification audit event.
- Return report and timeline.

## export-print-package

Actions:

- Require APPROVER or ADMIN_2.
- Require FINAL_LOCKED package.
- Generate simulated print batch ID.
- Insert package export.
- Create `PACKAGE_EXPORTED_PRINT` audit event.

## export-cbt-package

Actions:

- Require APPROVER or ADMIN_2.
- Require FINAL_LOCKED package.
- Generate simulated vendor reference.
- Insert package export.
- Create `PACKAGE_EXPORTED_CBT` audit event.

---

# 11. Audit Hash-Chain Implementation

Do not calculate hashes in React.

Create a protected PostgreSQL function or secure Edge Function implementation called:

```text
append_audit_event
```

Canonical event payload:

```json
{
  "timestamp": "ISO-8601 timestamp",
  "user_id": "uuid",
  "role": "REVIEWER",
  "action": "QUESTION_VIEWED",
  "entity_type": "QUESTION",
  "entity_id": "Q-101",
  "session_id": "EV-1042",
  "device_id": "UNKNOWN-WINDOWS-01",
  "ip_address": "198.51.100.24",
  "risk_score": 90,
  "metadata": {}
}
```

Hash logic:

```text
previous_hash = current_hash from latest audit row, or GENESIS
current_hash = SHA-256(canonical_json_payload + previous_hash)
```

Requirements:

- Use stable key ordering for canonical JSON.
- Write the audit log from server-side trusted code only.
- Use transaction boundaries for sensitive workflows.
- Display hashes read-only.
- Do not allow update/delete policies on audit_logs.
- Any later manual metadata modification must make audit verification fail.

---

# 12. Risk Engine

Use an explainable, rule-based risk engine.

Do not call it AI in the interface or documentation.

## Exact risk rules

| Signal code | Label | Points |
|---|---|---:|
| UNKNOWN_DEVICE | Unregistered device | 35 |
| OUTSIDE_ACCESS_HOURS | Outside permitted hours | 25 |
| HIGH_VOLUME_ACCESS | High-volume access | 30 |
| FACE_FAILED | Face verification failed | 35 |
| OTP_FAILED | OTP failed / retry limit exceeded | 15 |
| REPEATED_LOGIN_FAILURE | Repeated failed logins | 15 |
| UNAUTHORIZED_EXPORT | Attempted unauthorised export | 20 |

Risk labels:

```text
0–29: LOW
30–59: MODERATE
60–100: HIGH
```

Maximum score:

```text
100
```

## High-volume rule

For MVP:

```text
15 or more QUESTION_VIEWED events in two minutes
= HIGH_VOLUME_ACCESS (+30)
```

## Unusual-hours rule

For MVP:

```text
Access from 00:00 to 05:00
= OUTSIDE_ACCESS_HOURS (+25)
```

## Seeded suspicious session

Create this historical demo session:

```text
Session ID: EV-1042
User: Reviewer_B
Device: Unknown Windows device
Device status: UNKNOWN
Login time: 02:14 AM
Risk score: 90
Risk level: HIGH
```

Reasons:

```text
Unregistered device (+35)
Outside permitted hours (+25)
High-volume access (+30)
```

Associated timeline:

```text
02:09 — Failed login attempt for Reviewer_B
02:14 — Login successful from unregistered device
02:14 — Question Q-101 viewed
02:15 — Question Q-108 viewed
02:16 — Export attempt blocked
02:20 — Leaked screenshot identified as Session EV-1042
```

---

# 13. Content Fingerprinting

Use session-specific option ordering.

## Canonical storage

Store question options in a fixed canonical order in `questions.options`.

Use a stable option identifier:

```text
option_1
option_2
option_3
option_4
```

Store correct answer by option ID.

Never store the answer solely as A/B/C/D.

## Display fingerprint

When sensitive question is retrieved for a session:

```text
seed = SHA-256(question_id + ":" + session_id)
```

Use the seed to deterministically reorder options.

Rules:

- Same question + same session = same display order.
- Same question + different session = potentially different order.
- Display labels A/B/C/D are generated after reordering.
- The correct answer still resolves to its canonical option ID.
- Store the calculated order only if required for investigation; otherwise regenerate deterministically.

## Investigator matching

When a leak report includes question ID and session token:

- Regenerate the fingerprinted option ordering.
- Compare with supplied/observed ordering if available.
- Use it as supporting evidence.
- Do not claim this proves who physically leaked content.

---

# 14. Watermark Strategy

The visible watermark is generated in React, not permanently written into database content.

Inputs:

```text
Current user name
Application session ID
Current view timestamp
Question ID, optional internal marker
```

Text:

```text
CONFIDENTIAL -  <User Name> -  <Session ID> -  <Time>
```

For every `QUESTION_VIEWED` event:

- Create audit record.
- Store session context.
- Return fingerprint order.
- Render watermark in frontend.

For the demo leak asset:

- Create a screenshot-like PNG containing:

```text
CONFIDENTIAL -  Reviewer_B -  EV-1042 -  02:14
```

- Upload it to private `leak-evidence` bucket or include it in frontend demo assets.
- The investigator flow must work with manual entry of `EV-1042`, regardless of OCR availability.

---

# 15. Leak Investigation Logic

The system must present an evidence-led result.

Match flow:

```text
Investigator uploads screenshot
        ↓
Private Storage upload
        ↓
Optional OCR extraction
        ↓
Manual session token fallback
        ↓
Find matching app_session
        ↓
Optionally match Question ID
        ↓
Fetch user/device/risk/audit timeline
        ↓
Create leak report
        ↓
Display investigation conclusion
```

Mandatory conclusion template:

```text
The leaked copy matches <User Name>'s authorised session <Session ID>.
The session also showed high-risk access indicators.
This is investigative evidence, not final proof of individual guilt.
```

Never use:

```text
The system proved the user leaked the paper.
The user is guilty.
The system identified the culprit.
```

---

# 16. Seed Data Requirements

Seed:

```text
Q-101 — APPROVED
Q-102 — NEEDS_REVISION
Q-103 — UNDER_REVIEW
Q-104 — REJECTED
Q-105 — DRAFT
Q-108 — APPROVED
Q-112 — APPROVED
```

Q-101:

```text
A car increases its velocity from 10 m/s to 30 m/s in 5 seconds.
What is its acceleration?

Option 1: 2 m/s²
Option 2: 4 m/s²
Option 3: 6 m/s²
Option 4: 8 m/s²

Correct option: option_2
```

Seed:

```text
Physics Mock Examination
PHY-2026-SET-A
Q-101, Q-108, Q-112
```

Seed historical EV-1042 session, risk events, audit events, and a demo leak report path or ready-to-upload image.

---

# 17. Environment Variables

Frontend `.env`:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DEMO_MODE=true
```

Supabase Edge Function secrets:

```text
DEMO_MODE=true
AUDIT_HASH_SALT=
```

Never place these in frontend:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_PASSWORD
JWT_SECRET
AUDIT_HASH_SALT
```

---

# 18. Build Order for Antigravity

Build and test in this exact sequence.

```text
1. Create Supabase project connection through MCP.
2. Create enum types, tables, relationships, indexes.
3. Enable RLS on every exposed table.
4. Create profiles and seed Supabase Auth users.
5. Create role helper functions and RLS policies.
6. Create private Storage buckets and access policies.
7. Create audit hash-chain function and test integrity verification.
8. Build password login + demo OTP Edge Functions.
9. Build app session, device status, face-result flow.
10. Build question draft and versioning functions.
11. Build reviewer workflow.
12. Build package and dual-control functions.
13. Build visible watermark view event + fingerprint ordering function.
14. Build risk engine and seed EV-1042.
15. Build leak report function and private evidence upload.
16. Build print/CBT simulation.
17. Test RLS with all five roles.
18. Generate README and SQL migration documentation.
```

After each stage:

- Verify with test queries.
- Verify role restrictions.
- Verify no frontend direct update can bypass sensitive workflows.
- Stop and correct errors before next stage.

---

# 19. Required Security Tests

Test these explicitly.

1. Setter_A cannot read another setter’s question.
2. Reviewer_B cannot read an unassigned question by modifying URL/ID.
3. Reviewer_B cannot directly update a question’s content.
4. Approver_C cannot confirm their own final-lock request.
5. Admin_2 cannot edit questions.
6. Investigator cannot edit questions.
7. Frontend cannot insert audit logs directly.
8. Frontend cannot update audit hashes.
9. Frontend cannot update a final-locked package.
10. Anonymous user cannot read any protected table.
11. Leak-evidence Storage files cannot be publicly opened.
12. Unknown-device login creates risk event but does not block login.
13. Face failure creates risk event but does not block login.
14. Altered historical audit metadata causes integrity verification failure.
15. EV-1042 has exactly 90 risk points with the three required reasons.

---

# 20. README Requirements

Generate a README containing:

1. ExamVault overview.
2. Supabase architecture overview.
3. Setup prerequisites.
4. Supabase project setup through MCP.
5. Required environment variables.
6. Migration/deployment order.
7. Frontend integration setup.
8. Seeded credentials.
9. Demo script.
10. RLS and security explanation.
11. Storage bucket explanation.
12. Edge Function list.
13. Known prototype limitations.

Include this exact closing statement:

“ExamVault cannot eliminate every human or technical failure. It turns an opaque exam-content process into a controlled, auditable, and investigable lifecycle.”