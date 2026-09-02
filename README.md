# ExamVault — Secure Examination-Content Lifecycle Platform

**Version:** 1.0.0 (SIH MVP)  
**Team:** ATARAXIA  
**Build Environment:** Antigravity  
**Application Type:** Secure Web Application  

---

## 1. Product Overview

**ExamVault is a secure examination-content lifecycle platform that combines role-based access control, versioned drafting, session watermarking, tamper-evident audit logs, explainable risk scoring, and forensic leak analysis to make exam-paper leaks harder, detectable, and traceable.**

Most examination systems focus on candidate testing in examination rooms. ExamVault protects sensitive examination content **before it ever reaches the examination room, printing press, or CBT terminal**, securing the full preparation lifecycle:

$$\text{Draft (Setter)} \longrightarrow \text{Review (Reviewer)} \longrightarrow \text{Assembly (Approver)} \longrightarrow \text{Dual Lock (Admin\_2)} \longrightarrow \text{Delivery Handoff} \longrightarrow \text{Leak Investigation}$$

---

## 2. Architecture Overview

ExamVault uses a **Supabase PostgreSQL & Security-Definer Backend** paired with a **React 19 + TypeScript + Tailwind CSS Frontend**:

```text
Google Stitch / React 19 Frontend
        ↓
Supabase JavaScript Client (Anon Key)
        ↓
Supabase Auth (Email + Password + 2FA Challenge)
        ↓
PostgreSQL Row Level Security (RLS)
        ↓
Security-Definer RPC Engine (Audit Hash Chain, Dual Auth, Risk Scoring)
        ↓
Private Supabase Storage Buckets (Attachments & Leak Evidence)
```

### Core Innovations & Security Pillars
1. **Least-Privilege RBAC & PostgreSQL RLS:** Database kernel enforces that Setters see only own drafts, Reviewers see only assigned questions, and Approvers cannot confirm their own locked packages.
2. **Dynamic Live Watermarking & Content Fingerprinting:** Diagonal forensic watermark (`CONFIDENTIAL • <User> • <Session> • <Time>`) rendered across inspection cards. MCQ options are deterministically shuffled per session seed without altering answer correctness.
3. **Cryptographic SHA-256 Hash-Chained Audit Trail:** Linear cryptographic ledger where `current_hash = SHA256(canonical_payload + previous_hash)`. Includes one-click integrity verification and demo tampering simulation.
4. **Explainable Rule-Based Risk Engine:** Transparent point accumulation (Unregistered device +35, Off-hours access +25, High-volume rapid views +30, Face failure +35) without black-box AI claims.
5. **Forensic Leak Investigation Suite:** Drag-and-drop leak evidence uploader, OCR assist, manual session token fallback, and official evidentiary report generation with non-accusatory legal standards.

---

## 3. Seeded Demo Accounts & Credentials

All accounts are pre-seeded in Supabase Auth and `public.profiles`:

| User Persona | Email | Password | Role | Registered Device |
|---|---|---|---|---|
| **Setter_A** | `setter_a@examvault.demo` | `password123` | `SETTER` | `SETTER_A-LAPTOP-01` |
| **Reviewer_B** | `reviewer_b@examvault.demo` | `password123` | `REVIEWER` | `REVIEWER_B-LAPTOP-01` |
| **Approver_C** | `approver_c@examvault.demo` | `password123` | `APPROVER` | `APPROVER_C-LAPTOP-01` |
| **Admin_2** | `admin2@examvault.demo` | `password123` | `ADMIN_2` | `ADMIN_2-CONSOLE-01` |
| **Investigator** | `investigator@examvault.demo` | `password123` | `INVESTIGATOR` | `INVESTIGATOR-CONSOLE-01` |

---

## 4. Local Setup & Startup Instructions

### Prerequisites
- Node.js (v18+)
- Active Supabase Project (`xgchwmkktznrtjsochvh` configured in `.env`)

### Running Frontend Locally
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start local Vite development server
npm run dev
```

The application will be accessible at: `http://localhost:5173`

---

## 5. Repository Structure

```text
Examvault/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # WatermarkOverlay, Badge, OtpModal, FaceModal
│   │   │   └── layout/          # Navbar, Sidebar, AppLayout
│   │   ├── contexts/            # AuthContext (Sessions, Role Switcher)
│   │   ├── lib/                 # Supabase client, watermark, fingerprinting
│   │   ├── pages/
│   │   │   ├── setter/          # Authoring dashboard, editor, version snapshots
│   │   │   ├── reviewer/        # Assigned queue, watermarked moderation panel
│   │   │   ├── approver/        # Package assembly and lock initiation
│   │   │   ├── admin2/          # Dual control gatekeeper, manifest certificate
│   │   │   └── investigator/    # Audit ledger, risk sessions, leak analyzer
│   │   ├── types/               # TypeScript data definitions
│   │   ├── App.tsx              # Router & RBAC guards
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   │   └── demo-assets/         # Leaked question demo assets
│   ├── package.json
│   └── vite.config.ts
│
├── supabase/
│   └── migrations/              # PostgreSQL schema, RLS, functions, seeds
│
├── demo-assets/
│   └── leaked_question_q101.png # Sample leaked question screenshot for testing
│
├── scripts/
│   └── create_demo_image_pure.py # Pure Python PNG generator
│
├── prd.md                       # Product Requirements Document
├── tad backend.md               # Technical Architecture Document
└── README.md
```

---

## 6. Step-by-Step Hackathon Demo Script

### Stage 1: Legitimate Lifecycle Workflow
1. **Login as Setter_A:**
   - Go to `/login` and click `Setter_A` quick autofill.
   - Select `Registered Device`, enter password `password123`.
   - Complete 2FA OTP (`482913`) and select `Face Verified`.
   - On the Setter Dashboard, view `Q-101` or create a new question. Click **Submit for Moderation**.
2. **Login as Reviewer_B:**
   - Use top bar fast role switcher to switch to `REVIEWER`.
   - Open question `Q-101` from the assigned moderation queue.
   - Observe the live diagonal dynamic watermark overlay (`CONFIDENTIAL • Reviewer_B • EV-XXXX • Time`).
   - Enter review comment and click **Approve Question**.
3. **Login as Approver_C:**
   - Switch to `APPROVER`.
   - On the Assembly Dashboard, select approved questions (`Q-101`, `Q-108`, `Q-112`).
   - Click **Lock Final Package** $\rightarrow$ Package status transitions to `PENDING_DUAL_CONFIRMATION`.
4. **Login as Admin_2 (Dual Authorization):**
   - Switch to `ADMIN_2`.
   - Inspect the pending package release request.
   - Click **Confirm & Cryptographically Seal** $\rightarrow$ Master SHA-256 package hash is generated and immutable manifest certificate is displayed.

### Stage 2: Suspicious Access & Anomaly Detection
1. **Login as Investigator:**
   - Switch to `INVESTIGATOR` and open **Risk Sessions Monitor** (`/investigator/risk-sessions`).
   - Select historical session **`EV-1042`** (User: `Reviewer_B`).
   - Inspect the **90 / 100 HIGH RISK** score with exact itemized reasons:
     - Unregistered device (+35 pts)
     - Outside permitted hours: 02:14 AM (+25 pts)
     - High-volume access: 15 questions in 2 min (+30 pts)
   - View the correlated activity timeline (02:09 failed login, 02:14 unknown device login, 02:14 Q-101 viewed, 02:16 export blocked).

### Stage 3: Forensic Leak Investigation
1. Open **Leak Investigation** (`/investigator/leaks`).
2. Upload `demo-assets/leaked_question_q101.png` (or use drag-and-drop).
3. Observe OCR extraction assistance and manual session token fallback `EV-1042`.
4. Click **Execute Forensic Correlation**.
5. Inspect the formal investigation report displaying **High Confidence match** to `Reviewer_B`'s session `EV-1042` and the legal evidentiary conclusion.

### Stage 4: Cryptographic Audit Hash-Chain & Tamper Test
1. Open **Tamper-Evident Logs** (`/investigator/audit-logs`).
2. Click **Verify Audit Integrity** $\rightarrow$ Status displays: `Audit Chain Status: VERIFIED ✓ (Unbroken SHA-256 Hash Chain)`.
3. Click **Demo: Simulate Audit Tampering** $\rightarrow$ Alters a historical record's metadata.
4. Click **Verify Audit Integrity** $\rightarrow$ Immediate alert: `Audit Chain Status: INTEGRITY ALERT ⚠` with broken link identified!

---

## 7. Security Boundaries & Transparent Limits

1. **External Screen Capture:** Watermarks establish an evidentiary link between a photograph and an authorized viewing session, but cannot physically block an external secondary camera.
2. **Investigative Evidence Standard:** A detected watermark identifies an authorized session and account context; it serves as evidentiary material for human inquiry, not automated proof of personal physical guilt.
3. **Explainable Risk Scoring:** Risk rules flag anomalies transparently rather than making opaque automated accusations.

---

## 8. Security Hardening Implementation

ExamVault has been hardened with defense-in-depth platform security controls across both the FastAPI backend and React frontend:

### Backend Controls (FastAPI)
1. **Strict Pydantic Schema Validation:** All request payloads are strictly validated using Pydantic v2 schemas with `extra = 'forbid'` and `strict = True`. Any unpermitted or unexpected fields are immediately rejected with `422 Unprocessable Entity`.
2. **SQLAlchemy Parameterized Queries:** All database interactions are executed strictly through SQLAlchemy ORM models with parameterized query binding, eliminating SQL injection vectors.
3. **Adaptive 5-Strike Rate Limiter:** Protects `/auth/login` and `/auth/otp-verify` against brute-force credential stuffing. If an IP or account registers 5 failed attempts within 10 minutes, the account is locked for 5 minutes (`429 Too Many Requests`), logging `RATE_LIMIT_TRIGGERED`.
4. **Hardened JWT Lifecycle & Refresh:** Access tokens are signed using `HS256` with strong secrets loaded from environment variables, enforced with a short **30-minute expiration window**. A secure `/auth/refresh` endpoint allows session renewal with a valid refresh token without requiring OTP re-entry.
5. **Session Idle Timeout (15-Minute Rule):** Background activity tracking monitors session activity. Sessions idle for $\ge 15$ minutes are auto-terminated, returning `401 Unauthorized` with `SESSION_EXPIRED`.
6. **Content-Based Magic Byte File Upload Validation:** Restricts leak-evidence uploads to authentic `image/png`, `image/jpeg`, and `application/pdf` files. Inspects header magic bytes server-side (rather than relying on spoofable file extensions) and enforces a strict 10MB limit.
7. **Secret Isolation & Key Management:** All sensitive keys (JWT signing secret, Fernet symmetric encryption key, database credentials) are isolated in `backend/.env`, excluded via `.gitignore`, and documented in `backend/.env.example`.
8. **Field-Level Fernet Symmetric Encryption:** Sensitive fields (`question_text` and `correct_answer`) in the `questions` and `question_versions` tables are encrypted at rest using AES-128-CBC with HMAC-SHA256 authenticated encryption (`cryptography.fernet.Fernet`). Plaintext exists only in memory during authorized access.

### Frontend Controls (React + TypeScript)
1. **Zero `dangerouslySetInnerHTML`:** Verified across the entire frontend codebase that all user-supplied content (question drafts, review comments, administrative justification notes) is rendered exclusively via standard React JSX text nodes, natively preventing XSS.
2. **Secure Token Storage & Handling:** Auth tokens are managed in secure application context and standard Authorization Bearer header injection via `frontend/src/lib/api.ts`.
3. **Graceful Session Expiry Handling:** Global 401 response interceptor traps expired sessions, clears active credentials, and redirects users to `/login` with an explicit notice: *"Your session expired. Please log in again."*

### Dependency Hygiene Audit
* **Frontend (`npm audit`):** `found 0 vulnerabilities` (0 Low, 0 Moderate, 0 High, 0 Critical).
* **Backend (`pip-audit`):** Fully audited against the Python Advisory Database (PyPA/OSV).

---

## 9. Production Security Roadmap (Future Scope)

The following enterprise capabilities are outside the scope of this hackathon prototype and are documented honestly as future production milestones:

- [ ] **Web Application Firewall (WAF) & DDoS Mitigation:** Deployment behind Cloudflare or AWS CloudFront/WAF with managed rate limiting and IP reputation filtering.
- [ ] **Hardware Security Module (HSM) Key Storage:** Transitioning Fernet symmetric keys from environment variables to AWS KMS, Azure Key Vault, or a dedicated FIPS 140-2 Level 3 HSM.
- [ ] **Formal Third-Party Penetration Testing:** External CREST-accredited red-team assessment and dynamic application security testing (DAST).
- [ ] **Automated CI/CD Vulnerability & Container Scanning:** Automated GitHub Actions workflows running Snyk, Trivy, and SonarQube on every pull request.
- [ ] **Isolated VPC & Database Network Firewalls:** Deploying the PostgreSQL cluster within private subnets with mutual TLS (mTLS) zero-trust network boundaries.

---

> “ExamVault cannot eliminate every human or technical failure. It turns an opaque exam-content process into a controlled, auditable, and investigable lifecycle.”

