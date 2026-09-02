# PRODUCT REQUIREMENTS DOCUMENT
## Product: ExamVault
## Version: Final MVP
## Team: ATARAXIA
## Build environment: Antigravity
## Application type: Local-first browser-based web application

---

# 1. Build Instruction

Build a complete, polished, locally runnable MVP named **ExamVault**.

ExamVault is a secure examination-content lifecycle platform. It makes exam-paper leaks harder, makes suspicious access visible, and gives examination authorities evidence to investigate likely source accounts and sessions.

This is a hackathon MVP. Build only the requirements written below. Do not add blockchain, real SMS/email delivery, real facial recognition, a custom trained AI model, a CBT examination platform, printing-press integrations, courier tracking, or continuous camera monitoring.

Use a clean, professional, government/public-sector cybersecurity visual style. Avoid neon “hacker” UI designs.

## Mandatory delivery rule

Build in this exact order:

1. Project scaffold, database schema, seed data
2. Authentication and session creation
3. Backend-enforced RBAC
4. Secure question drafting and versioning
5. Review workflow
6. Final package dual approval
7. Audit logging and integrity verification
8. Watermarking and content fingerprinting
9. Explainable risk engine
10. Leak investigation
11. Print/CBT simulation
12. UI polish, security limitations page, README, demo validation

After each numbered checkpoint:
- Run the app locally.
- Verify the checkpoint works.
- Fix errors before continuing.
- Do not implement later modules prematurely.
- Preserve all earlier functionality.

At the end, provide:
- Exact local startup commands.
- Seeded credentials.
- Final API route list.
- Feature checklist.
- Any known limitations.

---

# 2. Product Summary

## One sentence

**ExamVault is a secure examination-content lifecycle platform that combines role-based access, versioned drafting, session watermarking, tamper-evident audit logs, and explainable leak analysis to make exam-paper leaks harder, detectable, and traceable.**

## What it is

ExamVault is a security and accountability layer used before, during, and after preparation of examination content.

It protects the lifecycle:

```text
Draft → Review → Approval → Final package lock → Controlled delivery record → Leak investigation
```

## What it is not

ExamVault is not:

- A full CBT platform.
- A candidate examination portal.
- A real printing-press system.
- A courier tracking system.
- A complete national-scale production deployment.
- A system that promises zero exam leaks.
- A tool that automatically proves a person is guilty.

## Core promise

> Make leaks harder, make suspicious access visible, and make investigations evidence-based.

## Main differentiator

Most systems focus on conducting an examination. ExamVault protects sensitive exam content **before it reaches the examination room, printing workflow, or CBT terminal.**

---

# 3. Product Principles

The application must enforce and communicate these principles:

1. **Least privilege**  
   Every user sees only the content and actions required for their role.

2. **Traceability**  
   Every sensitive action and sensitive question view must be associated with a user, session, device, timestamp, and risk context.

3. **Tamper evidence**  
   Audit events must be hash-chained. Editing an older log must make integrity verification fail.

4. **Explainability**  
   Every risk score must show exactly which rule produced each score increase.

5. **Human oversight**  
   The platform flags suspicious sessions and provides evidence. It never claims to prove that a particular individual leaked content.

6. **Privacy by design**  
   Do not store raw biometric data, webcam images, or facial embeddings. Face verification is simulated and stores only a boolean result.

7. **Honesty over spectacle**  
   Clearly show prototype limitations. Do not pretend that watermarks, AI, OTP simulation, or fingerprinting are perfect.

---

# 4. Technology Stack

Use exactly this stack unless a dependency is technically required.

## Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Recharts for dashboard charts, if needed
- Lucide React icons, if needed

## Backend

- Python 3
- FastAPI
- SQLAlchemy
- Pydantic
- SQLite
- bcrypt or passlib with bcrypt
- JWT using python-jose or PyJWT
- Pillow for optional generated watermark/demo image support
- hashlib SHA-256 for the audit hash chain

## Local development

- SQLite database stored locally.
- Auto-seed database on first startup.
- CORS enabled for local frontend/backend operation.
- No external paid services.
- No API keys required.
- Local-first demo.

---

# 5. Repository Structure

Create this project structure:

```text
examvault/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── main.py
│   │   └── seed.py
│   ├── requirements.txt
│   └── .env.example
│
├── demo-assets/
│   └── leaked_question_q101.png
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── demo-script.md
│
└── README.md
```

Use clean reusable components. Do not place all backend logic inside one file or all frontend logic inside App.tsx.

---

# 6. Roles and Permissions

Use these exact roles.

| Role code | Display name | Purpose |
|---|---|---|
| SETTER | Question Setter | Drafts and revises assigned questions |
| REVIEWER | Reviewer | Views assigned questions and approves/rejects/requests revision |
| APPROVER | Approver | Selects approved questions and initiates package lock |
| ADMIN_2 | Dual Control Admin | Confirms or rejects a pending final-package lock |
| INVESTIGATOR | Investigator / Admin | Reviews audit logs, risk sessions, and leak reports |

## Required RBAC behaviour

RBAC must be enforced on the backend. Frontend visibility alone is never sufficient.

| Role | Allowed actions |
|---|---|
| SETTER | Create questions, edit only own questions, view own drafts and versions, submit own questions for review |
| REVIEWER | View only assigned questions, submit review decision and comment |
| APPROVER | View approved questions, create/select package, initiate final package lock |
| ADMIN_2 | View pending final-lock requests, confirm or reject package lock, cannot edit questions |
| INVESTIGATOR | View audit logs, audit integrity, risk sessions, leak reports, create leak investigations; cannot modify question content |

## Mandatory access-denial behaviour

- Direct unauthorised API access must return HTTP `403 Forbidden`.
- The frontend must show a friendly Access Denied page.
- A setter must not access another setter’s question by changing the question ID in the URL.
- A reviewer must not access the whole question bank.
- An investigator must not edit question content.
- Admin_2 must not edit question content.
- Approver must not edit audit records.

---

# 7. Seeded Demo Accounts

Seed these accounts automatically if the database is empty.

| Name | Email | Password | Role | Registered device |
|---|---|---|---|---|
| Setter_A | setter_a@examvault.demo | password123 | SETTER | SETTER_A-LAPTOP-01 |
| Reviewer_B | reviewer_b@examvault.demo | password123 | REVIEWER | REVIEWER_B-LAPTOP-01 |
| Approver_C | approver_c@examvault.demo | password123 | APPROVER | APPROVER_C-LAPTOP-01 |
| Admin_2 | admin2@examvault.demo | password123 | ADMIN_2 | ADMIN_2-CONSOLE-01 |
| Investigator | investigator@examvault.demo | password123 | INVESTIGATOR | INVESTIGATOR-CONSOLE-01 |

Passwords must be bcrypt hashed in the database.

---

# 8. Data Models

Implement SQLAlchemy models, Pydantic schemas, and relationships for the following.

## users

```text
id
name
email
password_hash
role
registered_device_id
created_at
```

## questions

```text
id
title
subject
question_text
options_json
correct_answer
explanation
rough_notes
status
created_by
assigned_reviewer_id
current_version
created_at
updated_at
```

Question statuses:

```text
DRAFT
UNDER_REVIEW
NEEDS_REVISION
APPROVED
REJECTED
```

## question_versions

```text
id
question_id
version_number
content_snapshot_json
changed_by
changed_at
change_note
```

## reviews

```text
id
question_id
reviewer_id
decision
comment
timestamp
```

Review decisions:

```text
APPROVED
REJECTED
NEEDS_REVISION
```

## exam_packages

```text
id
exam_name
package_name
status
question_ids_json
package_hash
initiated_by
confirmed_by
created_at
locked_at
```

Package statuses:

```text
DRAFT
PENDING_DUAL_CONFIRMATION
FINAL_LOCKED
REJECTED
```

## sessions

```text
id
user_id
device_id
device_match_status
ip_address
otp_verified
otp_attempts
face_verified
login_time
risk_score
status
```

Session statuses:

```text
ACTIVE
LOGGED_OUT
FLAGGED
```

## audit_logs

```text
id
timestamp
user_id
role
action
entity_type
entity_id
session_id
device_id
ip_address
risk_score
previous_hash
current_hash
metadata_json
```

## leak_reports

```text
id
uploaded_file
detected_watermark
matched_question_id
matched_session_id
match_confidence
risk_summary
investigator_id
created_at
```

---

# 9. Module A: Authentication and Secure Onboarding

Implement password login, simulated OTP, device status, simulated face verification, session creation, and role-based redirect.

## Step 1: Password login

Login form fields:

```text
Email
Password
Device selector
```

Device selector options:

```text
Registered Device
Unknown Device
```

Password validation must use bcrypt.

On failed login:

- Show generic message: `Invalid email or password`.
- Record `LOGIN_FAILURE`.
- Do not expose whether email or password was incorrect.

On correct password:

- Generate a six-digit OTP.
- Save OTP and expiry in a safe development-only pending-auth state.
- OTP expiry: 2 minutes.
- Maximum OTP attempts: 3.

## Step 2: Simulated OTP

Display clearly in the UI:

```text
Simulated delivery — Demo OTP: 482913
```

The actual OTP may be randomly generated but must be returned to the frontend only for this local demo.

On OTP success:

```text
OTP_VERIFIED
```

On OTP failure:

```text
OTP_FAILED
```

The user must proceed only after correct password and correct OTP.

## Step 3: Device identity simulation

If the user selects Registered Device:

```text
device_id = user.registered_device_id
device_match_status = REGISTERED
```

If the user selects Unknown Device:

```text
device_id = UNKNOWN-DEVICE-<random value>
device_match_status = UNKNOWN
```

Unknown device must not block login. It must later add risk score.

Log device mismatch:

```text
DEVICE_MISMATCH
```

## Step 4: Simulated face verification

After OTP success, show a modal with two options:

```text
Simulate Face Verified
Simulate Face Verification Failed
```

Store only:

```text
true / false
```

Never store:

- Face image
- Webcam stream
- Facial embedding
- Biometric template

Log:

```text
FACE_VERIFIED
FACE_VERIFICATION_FAILED
```

## Step 5: Session creation

Create session after successful password and OTP verification.

Session ID format:

```text
EV-YYYY-XXXX
```

Example:

```text
EV-2026-1042
```

Store:

- User ID
- Device ID
- Device match status
- Simulated IP address
- OTP status
- OTP attempts
- Face result
- Login timestamp
- Initial risk score
- Active session status

Create JWT-based authentication. Protected endpoints must validate JWT.

On success, redirect according to role:

```text
SETTER → /setter/dashboard
REVIEWER → /reviewer/dashboard
APPROVER → /approver/dashboard
ADMIN_2 → /admin2/dashboard
INVESTIGATOR → /investigator/dashboard
```

Logout must set session status to `LOGGED_OUT` and clear the frontend session.

---

# 10. Module B: Secure Draft Workspace

Create a Question Setter dashboard.

## Setter dashboard

Display:

- Total drafted questions
- Questions needing revision
- Submitted for review
- Recent activity
- Button: `Create New Question`

The setter must see only questions created by that setter.

## Question creation form

Fields:

```text
Question ID
Title
Subject
Question text
Option A
Option B
Option C
Option D
Correct answer
Explanation / marking scheme
Rough notes
Optional diagram or image attachment
```

Use synthetic question content only.

Question IDs may use:

```text
Q-101
Q-102
Q-103
```

## Versioning

When a question is saved or updated:

- Create or update question.
- Save a snapshot in `question_versions`.
- Increment version number.
- Store changed_by, changed_at, and change_note.
- Display version history.

Expected lifecycle:

```text
Draft v1
→ Draft v2
→ Submitted for Review
→ Needs Revision
→ Draft v3
→ Approved
```

Question detail view must display:

```text
Question ID
Status
Version number
Created by
Assigned reviewer
Last modified time
Submit for Review button
Version history
```

When submitted:

- Status becomes `UNDER_REVIEW`.
- Create audit event `QUESTION_SUBMITTED_FOR_REVIEW`.

---

# 11. Module C: Review Workflow

Create a Reviewer dashboard.

## Reviewer dashboard

The reviewer must see only questions where:

```text
assigned_reviewer_id = current user
```

Display:

- Assigned questions
- Status
- Version
- Setter
- Last modified time
- Open review button

## Question review screen

When the reviewer opens a sensitive question:

- Display watermark overlay as defined in Module E.
- Display current content, options, explanation, and version.
- Show a review comment field.
- Show decision controls:

```text
Approve
Reject
Needs Revision
```

On decision:

| Decision | Updated question status |
|---|---|
| Approve | APPROVED |
| Reject | REJECTED |
| Needs Revision | NEEDS_REVISION |

Save the review record and log:

```text
QUESTION_REVIEWED
```

If revision is requested, the setter must be able to see reviewer feedback and edit a new version.

---

# 12. Module D: Final Package and Dual Approval

Create the Approver dashboard and Admin_2 dashboard.

## Approver workflow

Approver sees only questions with status:

```text
APPROVED
```

Approver selects questions for a package.

Use this default package:

```text
Exam: Physics Mock Examination
Package: PHY-2026-SET-A
Questions: Q-101, Q-108, Q-112
```

If Q-108 and Q-112 do not exist in live data, seed them as approved questions or allow selected approved questions while preserving the package name.

Approver clicks:

```text
Lock Final Package
```

This must not immediately lock the package.

Instead:

```text
Package status = PENDING_DUAL_CONFIRMATION
```

Log:

```text
FINAL_LOCK_INITIATED
```

## Admin_2 workflow

Admin_2 sees pending package lock requests.

Admin_2 can:

```text
Confirm Release
Reject Release
```

If confirmed:

```text
Package status = FINAL_LOCKED
confirmed_by = Admin_2
locked_at = current timestamp
```

Log:

```text
FINAL_LOCK_CONFIRMED
```

If rejected:

```text
Package status = REJECTED
```

Log:

```text
FINAL_LOCK_REJECTED
```

## Final manifest

Once locked, show this manifest UI:

```text
Exam: Physics Mock Examination
Package: PHY-2026-SET-A
Questions: Q-101, Q-108, Q-112
Approved by: Approver_C
Confirmed by: Admin_2
Timestamp: <actual timestamp>
Package hash: <SHA-256 hash prefix>
Status: FINAL LOCKED
```

Generate `package_hash` with SHA-256 from canonical package data.

A locked package must not be editable.

---

# 13. Module E: Watermarking and Content Fingerprinting

This module must be visually obvious during the demo.

## Visible watermark

Every sensitive question view must show a repeated, semi-transparent watermark overlay.

Required watermark format:

```text
CONFIDENTIAL -  <User Name> -  <Session ID> -  <Timestamp>
```

Example:

```text
CONFIDENTIAL -  Reviewer_B -  EV-2026-1042 -  18:17
```

Requirements:

- Repeat diagonally across the content panel.
- Low-opacity but readable.
- Must be included inside the question viewing area so it is visible in screenshots.
- Do not allow normal UI controls to hide it.
- Include user name, current session ID, and view timestamp.
- Add audit event `QUESTION_VIEWED` each time a sensitive question opens.

Use CSS watermark overlays for live browser views. This is sufficient for the MVP.

## Session-specific content fingerprint

Implement fingerprinting using session-specific MCQ option ordering.

Rules:

1. Store canonical options in the database.
2. Generate a deterministic option order using a hash of:

```text
question_id + session_id
```

3. Every session receives a stable option order for that question.
4. Different sessions may see a different option order.
5. Preserve the actual answer value and calculate the correct displayed option letter dynamically.
6. Do not corrupt the correct answer after reordering.
7. Add an optional fingerprint label in the investigator view, not prominently on normal reviewer screens.

Example:

```text
Canonical:
Paris, Lyon, Marseille, Nice

Reviewer_B:
A. Paris
B. Lyon
C. Marseille
D. Nice

Reviewer_C:
A. Marseille
B. Paris
C. Nice
D. Lyon
```

## Optional invisible watermark

Only implement if all mandatory modules work.

If included:

- Use simple LSB watermarking only on generated demo image assets.
- Label it clearly:

```text
Prototype-level secondary layer only.
Cropping, compression, retyping, or photographing may damage invisible watermark data.
Primary attribution uses visible session watermark, content fingerprint, audit logs, and human investigation.
```

Do not claim robust invisible watermark recovery.

---

# 14. Module F: Tamper-Evident Audit Logs

Every sensitive action must create an audit record.

## Required log fields

```text
Log ID
Timestamp
User ID
Role
Action
Entity type
Entity ID
Session ID
Device ID
IP address
Risk score
Previous hash
Current hash
Metadata
```

## Required event types

```text
LOGIN_SUCCESS
LOGIN_FAILURE
OTP_VERIFIED
OTP_FAILED
DEVICE_MISMATCH
FACE_VERIFIED
FACE_VERIFICATION_FAILED
QUESTION_CREATED
QUESTION_UPDATED
QUESTION_VIEWED
QUESTION_SUBMITTED_FOR_REVIEW
QUESTION_REVIEWED
FINAL_LOCK_INITIATED
FINAL_LOCK_CONFIRMED
FINAL_LOCK_REJECTED
PACKAGE_EXPORTED_PRINT
PACKAGE_EXPORTED_CBT
UNAUTHORIZED_ACCESS_ATTEMPT
EXPORT_ATTEMPT_BLOCKED
LEAK_REPORT_CREATED
```

## Hash-chain logic

Use SHA-256.

```text
Log 1 current_hash = SHA256(canonical_log_1_data)

Log 2 current_hash = SHA256(canonical_log_2_data + Log 1 current_hash)

Log 3 current_hash = SHA256(canonical_log_3_data + Log 2 current_hash)
```

Use deterministic canonical serialization such as sorted JSON before hashing.

## Audit dashboard

Investigator must be able to:

- View audit logs in reverse chronological order.
- Filter by user, action, question/package, session, and date.
- Open a detailed log row.
- View previous hash and current hash.
- Click `Verify Audit Integrity`.

Show one of:

```text
Audit Chain Status: VERIFIED ✓
```

or:

```text
Audit Chain Status: INTEGRITY ALERT ⚠
```

## Tampering demonstration

For local demo purposes only, create a clearly labelled control:

```text
Demo Only: Simulate Audit Tampering
```

This may alter a non-critical audit metadata field in a selected demo record.

After this action, audit verification must show:

```text
INTEGRITY ALERT
```

Never make this control available outside demo/development mode.

---

# 15. Module G: Explainable Risk Engine

Implement a rule-based risk engine. It is not a machine-learning model.

## Exact scoring rules

| Signal | Points |
|---|---:|
| Unregistered or unknown device | +35 |
| Access outside permitted hours | +25 |
| High-volume access, such as 15 questions in 2 minutes | +30 |
| Face verification failed | +35 |
| OTP failed or exceeded retry limit | +15 |
| Repeated failed logins, 3 or more | +15 |
| Attempted unauthorised export | +20 |

## Risk logic

- Calculate score per session.
- Keep score capped at 100.
- Store score in sessions table.
- Store a list of reasons and points in risk context.
- Recalculate after meaningful events.
- Do not use vague labels like “AI suspects a leak.”

Risk labels:

```text
0–29 = LOW RISK
30–59 = MODERATE RISK
60–100 = HIGH RISK
```

## Seeded suspicious session

Create this seeded historical high-risk session:

```text
User: Reviewer_B
Session: EV-1042
Device: Unknown Windows device
Device status: UNKNOWN
Time: 02:14 AM
Actions: 15 question views in 2 minutes
Risk score: 90 / 100
Risk status: HIGH RISK
```

Risk reasons:

```text
Unregistered device (+35)
Outside permitted hours (+25)
High-volume access (+30)
```

Create related audit events:

```text
02:09 — Failed login attempt for Reviewer_B
02:14 — Login successful from unregistered device
02:14 — Question Q-101 viewed
02:15 — Question Q-108 viewed
02:16 — Export attempt blocked
```

The high-risk session should be clearly visible to the investigator after login.

## Risk dashboard

Show:

- Total active sessions.
- Flagged high-risk sessions.
- Risk score list.
- Risk label badges.
- User.
- Session ID.
- Device status.
- Login time.
- Reasons with itemized points.
- Button to open session evidence timeline.

Use this exact language:

```text
The system flags a session for investigation.
```

Never use:

```text
The system proves this user leaked the paper.
```

---

# 16. Module H: Leak Investigation

This is the most important demo screen.

## Leak report workflow

Investigator opens:

```text
/investigator/leaks
```

The page must support:

1. Upload a suspected leaked screenshot.
2. Display image preview.
3. Attempt to extract visible watermark text if local OCR is available.
4. Always provide manual fallback fields:
   - Watermark/session ID
   - Question ID, optional
5. Match submitted data to question, session, account, device, risk score, and relevant audit events.
6. Save a leak report.
7. Display a formal investigation summary.

## OCR requirement

OCR is optional. Do not make the flow dependent on OCR.

Use this match order:

```text
1. Attempt OCR extraction of visible watermark/session token.
2. If OCR is unavailable, unreadable, cropped, or low confidence:
   investigator enters/selects the session token manually.
3. System matches the session token and optionally question ID against stored records.
```

Clearly state in the UI:

```text
OCR is an assistance feature. Manual watermark-token entry is available for cropped or low-quality images.
```

## Demo asset

Create a demo image:

```text
demo-assets/leaked_question_q101.png
```

It must visually show a screenshot-like question layout containing:

```text
CONFIDENTIAL -  Reviewer_B -  EV-1042 -  02:14
```

It should display Q-101 content and be usable in the upload flow.

## Leak investigation result

Show these exact fields:

```text
Leak ID: LEAK-001
Matched Question: Q-101
Match Confidence: High
Matched Session: EV-1042
Associated Account: Reviewer_B
Device: Unknown device
Access Time: 02:14 AM
Risk Score: 90 / 100
Status: Requires Human Investigation
```

Also show an evidence timeline:

```text
02:09 — Failed login attempt for Reviewer_B
02:14 — Login successful from unregistered device
02:14 — Question Q-101 viewed
02:15 — Question Q-108 viewed
02:16 — Export attempt blocked
02:20 — Leaked screenshot identified as Session EV-1042
```

## Mandatory conclusion

Every leak report must always include this exact conclusion:

```text
System conclusion:

The leaked copy matches Reviewer_B's authorised session EV-1042.
The session also showed high-risk access indicators.
This is investigative evidence, not final proof of individual guilt.
```

For real dynamically generated reports, replace user/session values appropriately while preserving the last sentence exactly.

---

# 17. Module I: Paper and CBT Integration Simulation

Do not build a real printing workflow or CBT platform.

Create a conceptual integration page that shows two paths.

## Paper path

```text
ExamVault Final Package
→ Controlled Print Export
→ Secure Printing Workflow
→ Sealed Packets
→ Exam Centres
```

When Approver or Admin_2 triggers simulated print export:

- Allow only FINAL_LOCKED packages.
- Record export timestamp.
- Record user.
- Record simulated print batch ID.
- Add audit event:

```text
PACKAGE_EXPORTED_PRINT
```

## CBT path

```text
ExamVault Final Package
→ Encrypted Content Package
→ Existing CBT Vendor / Centre Server
→ Time-Bound Authorised Decryption
→ Candidate Devices
```

When a simulated CBT handoff is triggered:

- Allow only FINAL_LOCKED packages.
- Record export timestamp.
- Record user.
- Record simulated vendor reference.
- Add audit event:

```text
PACKAGE_EXPORTED_CBT
```

Display clearly:

```text
ExamVault secures the question-content lifecycle and preserves forensic evidence.
It does not evaluate candidate answers or replace an existing CBT vendor.
```

---

# 18. Required Frontend Pages

Build these routes.

## Public

```text
/
 /login
 /about-security-limits
 /access-denied
 /not-found
```

## Shared protected pages

```text
/profile
 /session-details
```

## Setter

```text
/setter/dashboard
/setter/questions
/setter/questions/new
/setter/questions/:questionId
/setter/questions/:questionId/edit
```

## Reviewer

```text
/reviewer/dashboard
/reviewer/questions
/reviewer/questions/:questionId
```

## Approver

```text
/approver/dashboard
/approver/packages/new
/approver/packages/:packageId
```

## Admin_2

```text
/admin2/dashboard
/admin2/packages/:packageId
```

## Investigator

```text
/investigator/dashboard
/investigator/audit-logs
/investigator/risk-sessions
/investigator/risk-sessions/:sessionId
/investigator/leaks
/investigator/leaks/:leakId
/investigator/integrations
```

---

# 19. UI and Visual Design

## Brand and visual style

Create a polished dashboard UI appropriate for an examination authority.

Use:

```text
Primary: Navy blue
Success: Teal/green
Warning: Orange
Danger: Red
Neutral: Slate/gray
Background: Light gray-blue
```

Avoid:

- Neon green hacker visuals.
- Excessive gradients.
- Fake “military” imagery.
- Overly animated components.
- Generic lorem ipsum.

## Home page

Include:

```text
ExamVault
Secure drafting. Controlled access. Traceable investigation.
```

Show a lifecycle diagram:

```text
Draft → Review → Approve → Lock → Deliver → Investigate
```

Show feature cards:

```text
Role-Based Access
Versioned Question Drafting
Session Watermarking
Tamper-Evident Audit Logs
Explainable Risk Signals
Leak Investigation
```

## Dashboard standards

All dashboards should include:

- Sidebar navigation appropriate to role.
- Header with current user, role, session ID, risk indicator, and logout.
- Clear status badges.
- Tables with loading, empty, and error states.
- Confirmation modal before consequential actions.
- Toast notifications for success/failure.
- Responsive desktop-first layout, acceptable tablet support.
- No inaccessible low-contrast text.

## Watermark design

The watermarked question screen must be visually impressive and obvious to hackathon judges.

Overlay example:

```text
CONFIDENTIAL -  Reviewer_B -  EV-1042 -  02:14
```

Repeated diagonally across the question card at readable low opacity.

---

# 20. About Security Limits Page

Create a publicly accessible in-app page titled:

```text
About Security Limits
```

It must state clearly:

1. ExamVault cannot completely prevent a person from photographing a screen with another device.
2. Watermarks can be weakened by cropping, retyping, or rewriting content.
3. A watermark identifies an authorised copy or session, not necessarily the physical person who leaked it.
4. Risk scoring flags unusual behaviour; it does not determine guilt.
5. OTP delivery is simulated in this prototype; a production system needs a real SMS/email or authenticator integration.
6. Production deployment requires privacy review, policy controls, managed devices, secure infrastructure, and integration testing.
7. The platform works alongside printing and CBT systems; it does not replace them.

Include this closing statement exactly:

```text
ExamVault cannot eliminate every human or technical failure. It turns an opaque exam-content process into a controlled, auditable, and investigable lifecycle.
```

---

# 21. API Requirements

Use REST API design. Return meaningful HTTP status codes and clear JSON errors.

Minimum endpoint groups:

```text
GET  /health

POST /api/auth/login
POST /api/auth/verify-otp
POST /api/auth/face-verification
GET  /api/auth/me
POST /api/auth/logout

GET  /api/questions
POST /api/questions
GET  /api/questions/{id}
PUT  /api/questions/{id}
POST /api/questions/{id}/submit-review
GET  /api/questions/{id}/versions
POST /api/questions/{id}/review

GET  /api/packages
POST /api/packages
GET  /api/packages/{id}
POST /api/packages/{id}/initiate-lock
POST /api/packages/{id}/confirm-lock
POST /api/packages/{id}/reject-lock

GET  /api/audit-logs
POST /api/audit-logs/verify
POST /api/dev/simulate-audit-tamper

GET  /api/risk/sessions
GET  /api/risk/sessions/{sessionId}

POST /api/leaks/analyse
GET  /api/leaks
GET  /api/leaks/{id}

POST /api/integrations/packages/{id}/print-export
POST /api/integrations/packages/{id}/cbt-export

GET  /api/dev/seed-status
POST /api/dev/reset-demo-data
GET  /api/dev/users
GET  /api/dev/questions
```

Development-only endpoints must be clearly marked and documented.

---

# 22. Demo Data

Seed at least these questions.

## Q-101

```text
ID: Q-101
Title: Kinematics — Velocity Calculation
Subject: Physics
Status: APPROVED
Created by: Setter_A
Assigned reviewer: Reviewer_B

Question:
A car increases its velocity from 10 m/s to 30 m/s in 5 seconds.
What is its acceleration?

Options:
A. 2 m/s²
B. 4 m/s²
C. 6 m/s²
D. 8 m/s²

Correct answer:
B. 4 m/s²

Explanation:
Acceleration = (final velocity - initial velocity) / time = (30 - 10) / 5 = 4 m/s².
```

## Additional questions

Seed enough questions for dashboards and package selection:

```text
Q-102 — NEEDS_REVISION
Q-103 — UNDER_REVIEW
Q-104 — REJECTED
Q-105 — DRAFT
Q-108 — APPROVED
Q-112 — APPROVED
```

Use fictional, educational physics questions only.

---

# 23. Mandatory Demo Flow

The final application must support this exact demonstration.

## Stage 1: Legitimate workflow

1. Log in as Setter_A.
2. Select Registered Device.
3. Enter password `password123`.
4. Enter simulated OTP.
5. Select Face Verified.
6. Create or edit Question Q-101.
7. Submit Q-101 for review.
8. Log out.
9. Log in as Reviewer_B.
10. Open Q-101.
11. Show visible watermark.
12. Approve Q-101.
13. Log out.
14. Log in as Approver_C.
15. Select approved questions.
16. Initiate final package lock.
17. Log out.
18. Log in as Admin_2.
19. Confirm final package lock.
20. Show final manifest with package hash.

## Stage 2: Suspicious access

1. Log in as Investigator.
2. Open Risk Sessions.
3. Show seeded Reviewer_B session EV-1042.
4. Show unknown device, 02:14 AM time, 15 rapid question views, risk score 90/100.
5. Show exact itemized reasons.

## Stage 3: Leak investigation

1. Open Leak Investigation.
2. Upload `leaked_question_q101.png`.
3. Use OCR if available or manual session token fallback.
4. Match Q-101 and EV-1042.
5. Show Reviewer_B, unknown device, risk score, timeline, and mandatory conclusion.
6. Close with:

```text
ExamVault does not automatically accuse a person.
It gives the exam authority evidence to investigate the likely source account and session quickly.
```

---

# 24. Acceptance Criteria

The project is complete only when all of these work.

- All roles can log in using password plus simulated OTP.
- Device mismatch affects risk and does not hard-block login.
- Face verification failure affects risk and does not hard-block login.
- RBAC is enforced on backend APIs with 403 for unauthorised access.
- Setter can create/edit questions and view version history.
- Reviewer sees only assigned questions.
- Reviewer decision updates question status and creates a review record.
- Sensitive question views show user/session/timestamp watermark.
- Session-specific option ordering works and does not alter answer correctness.
- Approver initiates final lock but cannot immediately final-lock package.
- Admin_2 can confirm or reject package release.
- Final lock produces a manifest and SHA-256 package hash.
- Every sensitive action produces hash-chained audit record.
- Audit integrity validator returns VERIFIED for unchanged chain.
- Demo tampering makes integrity verification return INTEGRITY ALERT.
- Risk engine shows seeded EV-1042 session as 90/100 HIGH RISK with exact reasons.
- Leak investigation matches demo image/session token to Q-101 and EV-1042.
- Leak report includes mandatory investigative-evidence conclusion.
- Print export and CBT handoff simulation create matching audit events.
- About Security Limits page is present and accurate.
- Application runs locally without manual database edits.
- README includes exact setup instructions and all seeded credentials.

---

# 25. Explicitly Out of Scope

Do not build any of these:

```text
Real national-scale CBT system
Candidate exam portal
Real printing-press integration
Blockchain
Full KMS/key-management infrastructure
Continuous webcam monitoring
Advanced real facial recognition
Raw biometric storage
Custom trained AI model
Claims of perfect watermark recovery
Courier tracking
Real SMS/email OTP service
Claims that all leaks can be prevented
```

---

# 26. README Requirements

The root README must include:

1. Product overview.
2. Architecture overview.
3. Stack.
4. Folder structure.
5. Prerequisites.
6. Exact backend setup commands.
7. Exact frontend setup commands.
8. Database reset command.
9. Seeded demo credentials table.
10. Demo flow.
11. API documentation link or route summary.
12. Honest security limitations.
13. This exact closing line:

```text
ExamVault cannot eliminate every human or technical failure. It turns an opaque exam-content process into a controlled, auditable, and investigable lifecycle.
```

---

# 27. Final Engineering Standards

- Use TypeScript on the frontend.
- Use Pydantic validation on all FastAPI input models.
- Use secure password hashing.
- Keep JWT secrets in environment variables with a development fallback documented in `.env.example`.
- Never trust frontend permissions.
- Use clean error messages.
- Include loading states and empty states.
- Do not fake successfully completed actions.
- Do not show data that does not exist.
- Use realistic local demo simulation where external infrastructure would be required.
- Clearly label all simulated features in the UI.
- Keep all user-facing language precise:
  - Say “flagged for investigation.”
  - Do not say “proved guilty.”
  - Say “matches an authorised session.”
  - Do not say “identifies the leaker with certainty.”

Begin with Checkpoint 1 only: scaffold the repository, create database models, create and run seed data, build health endpoint, build basic frontend landing/login placeholder/demo-data page, verify frontend-backend connectivity, then continue checkpoint by checkpoint until the complete MVP is working.