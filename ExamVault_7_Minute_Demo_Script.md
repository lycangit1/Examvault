# 🎬 ExamVault: Complete 7-Minute Official Video Demonstration Script

> **Document Classification:** Official Hackathon & Jury Video Demonstration Script  
> **Target Duration:** ~7:00 Minutes (Comfortable, deliberate speaking pace)  
> **Key Themes:** Zero-Trust Architecture, Field-Level AES-128 Encryption, 2-Man Dual-Lock Custody, Blockchain-Chained SHA-256 Auditing, Dynamic Watermarking, Deterministic Option Permutation (DOP), Client-Side DLP, and Forensic OCR Attribution.

---

## ⏱️ [0:00 – 0:45] Scene 1: The Hook & Architectural Vision
* **🖥️ On-Screen Visuals:**
  1. Start on the **ExamVault Landing Page** (`http://localhost:5173/`).
  2. Show the hero headline with the subtle particle drift background.
  3. Smoothly scroll down across the **Security Protocols Pill** (`PostgreSQL RLS Active • Cryptographic Hash Chaining`) and highlight the **6 Security Disclosures**.
* **🎙️ Voiceover Script:**
  > *"Every year, millions of students dedicate their lives to competitive exams, only for paper leaks to compromise national trust in minutes.
  >
  > The core flaw isn't external hackers — it's internal single points of failure: unencrypted databases, rogue administrators, and untracked smartphone screenshots.
  >
  > Meet **ExamVault** — an enterprise-grade Zero-Trust examination gateway built on a simple principle: **Never trust, always verify.**
  >
  > From field-level AES encryption to blockchain-chained audit logs and dual cryptographic custody, here is how ExamVault safeguards the entire examination lifecycle."*

---

## ⏱️ [0:45 – 1:40] Scene 2: Identity, Multi-Factor Authentication & Device Posture
* **🖥️ On-Screen Visuals:**
  1. Click **Launch Enterprise Gateway** (or navigate to `/login`).
  2. Click the **Setter_A** pill in the *Demo Environments* row (notice email `setter_a@examvault.com` and credentials auto-fill).
  3. Click **Sign In to Gateway**.
  4. The **6-Digit TOTP Challenge** modal appears. Type `123456` and click **Verify OTP Token**.
  5. The **Biometric Face Verification** modal activates. Click **Verify Face & Complete Authentication**.
* **🎙️ Voiceover Script:**
  > *"Every session in ExamVault begins with zero-trust multi-factor identity gating. 
  > 
  > First, user credentials are validated against salted bcrypt password hashes.
  > 
  > Second, the system requires a time-sensitive 6-digit OTP challenge bound to a strict 5-minute expiration.
  > 
  > Third, mandatory biometric face liveness validation guarantees that a real, authorized human is physically present at the terminal.
  > 
  > At the same time, endpoint hardware headers, browser WebGL canvas fingerprints, and network subnets are evaluated — automatically penalizing unregistered devices with risk points."*

---

## ⏱️ [1:40 – 2:45] Scene 3: Setter Console, Field-Level AES Encryption & Client DLP
* **🖥️ On-Screen Visuals:**
  1. You are now in the **Setter Workspace** (`/setter/dashboard`).
  2. Click **Create New Question**.
  3. Enter a question statement (e.g., Quantum Mechanics / Kinematics), formulate options (A, B, C, D), and mark the correct answer.
  4. Click **Submit for Review**.
  5. Hover over a question card in the inventory.
  6. Attempt to highlight and copy text with **`Ctrl + C`** or right-click on the card.
  7. Point your cursor to the **Content Protection Active** floating security banner that immediately intercepts the action.
* **🎙️ Voiceover Script:**
  > *"Inside the Setter Workspace, setters draft and revise examination items in strict isolation. Under PostgreSQL Row-Level Security, a setter can only view their own drafts.
  > 
  > Crucially, sensitive fields — including question statements, answer options, and solution formulas — are never stored in raw plaintext. They are encrypted before database insertion using **Fernet AES-128-CBC with HMAC-SHA256 authenticated encryption**.
  > 
  > Furthermore, look at our active client-side **Data Loss Prevention (DLP)**: text selection is disabled with `user-select: none`, and any attempt to copy with `Ctrl+C`, cut, or right-click is intercepted in real time with an active security alert."*

---

## ⏱️ [2:45 – 3:30] Scene 4: Reviewer Workspace & Least-Privilege Role Boundaries
* **🖥️ On-Screen Visuals:**
  1. Click **REVIEWER** in the top Role Switcher.
  2. The **Least-Privilege Role Restriction** security modal pops up with: `Access Boundary Enforcement`.
  3. Click **Understood • Return to My Workspace**, then log out and log in as `Reviewer_B` (`reviewer_b@examvault.com`).
  4. In the Reviewer dashboard, open an assigned draft, review the technical parameters, and click **Approve Question**.
* **🎙️ Voiceover Script:**
  > *"Notice what happens if a logged-in user tries to jump into another workspace: ExamVault's **Least-Privilege Role Restriction** immediately blocks cross-role access, ensuring strict separation of duties.
  > 
  > Logging in as Reviewer_B, we access the moderation queue. Reviewers have clearance strictly to evaluate, comment, and verify assigned questions — they cannot draft new questions, alter author identity, or assemble final packages. 
  > 
  > Once approved, the question is cryptographically signed and advanced to the assembly pool."*

---

## ⏱️ [3:30 – 4:45] Scene 5: The 2-Man Rule — Dual-Lock Cryptographic Custody
* **🖥️ On-Screen Visuals:**
  1. Switch to **Approver_C** (`approver_c@examvault.com`).
  2. On the **Approver Console**, select 2 approved questions from the right inventory.
  3. Enter a Package Code (`PHY-2026-SET-A`) and Title (`Physics Master Examination`).
  4. Click **Lock #1 & Route to Admin_2**. The package status changes to `PENDING_DUAL_CONFIRMATION`.
  5. Switch to **Admin_2** (`admin2@examvault.com`).
  6. In Admin_2's dual-lock queue, click on the pending package to inspect the question distribution and Lock #1 signature.
  7. Click **Seal Final Lock #2**.
  8. Confetti bursts on screen! Show the status changing to `FINAL_LOCKED` and the **Master SHA-256 Package Manifest Hash**.
* **🎙️ Voiceover Script:**
  > *"In high-stakes exams, single-party approval is a catastrophic vulnerability. ExamVault enforces a mandatory **2-Man Cryptographic Rule**.
  > 
  > Step 1: Approver_C selects verified items from the pool and applies **Lock #1**, sealing the initial manifest. The package enters `PENDING_DUAL_CONFIRMATION`.
  > 
  > Step 2: Admin_2 — operating with independent administrative clearance — audits the manifest from an isolated terminal and signs **Lock #2**.
  > 
  > Upon dual confirmation, ExamVault computes a deterministic **Master SHA-256 Manifest Hash** across all verified question signatures and timestamps. No single official can generate or release an examination package alone."*

---

## ⏱️ [4:45 – 5:45] Scene 6: Dynamic Watermarking & Deterministic Option Permutation (DOP)
* **🖥️ On-Screen Visuals:**
  1. Open a question preview card.
  2. Point out the dynamic forensic watermark pattern across the card: `User ID • Session UUID • Device ID • Timestamp`.
  3. Explain the option ordering (A, B, C, D) on the screen.
* **🎙️ Voiceover Script:**
  > *"What if an authorized official takes out a smartphone and photographs their screen?
  > 
  > ExamVault deploys two active anti-leak mechanisms:
  > 
  > First, **Dynamic Canvas Micro-Watermarking**: every viewing viewport is rendered with a high-entropy forensic watermark containing the viewer's user ID, session UUID, device hardware fingerprint, and exact timestamp.
  > 
  > Second, **Deterministic Option Permutation (DOP)**: Multiple-choice options (A, B, C, D) are cryptographically shuffled per viewer using an HMAC seed: `Seed = HMAC_SHA256(Session_ID, Question_ID)`.
  > 
  > The answer key is dynamically re-mapped in memory. If someone leaks a sequence like 'Q1 is C, Q2 is A', that permutation exists for only one session in the entire database — instantly identifying the culprit."*

---

## ⏱️ [5:45 – 6:45] Scene 7: Blockchain-Chained Audit Ledger & Forensic Leak OCR Lab
* **🖥️ On-Screen Visuals:**
  1. Switch to **Investigator** (`investigator@examvault.com`).
  2. Navigate to **Audit Logs** (`/investigator/audit-logs`).
  3. Point out the linear hash chain where `Current_Hash = SHA256(canonical_payload + Previous_Hash)`.
  4. Click **Verify Ledger Integrity** (a green verified notification confirms the entire mathematical chain).
  5. Navigate to **Leak Investigation Lab** (`/investigator/leaks`).
  6. Upload a sample leaked screenshot image and click **Analyze & Correlate Leak**.
  7. Show the Tesseract OCR engine extracting the micro-watermark, calculating high correlation, and highlighting the exact user session responsible!
* **🎙️ Voiceover Script:**
  > *"In the Investigator suite, every single user action, encryption event, and login creates a record in our **SHA-256 Hash-Chained Audit Ledger**, inspired by blockchain block hashing.
  > 
  > Because every event hash incorporates the previous event's hash, altering even one byte in past logs breaks the entire forward chain, tripping an immediate integrity alert.
  > 
  > If a leaked image appears online, investigators upload it to our **Forensic Leak Investigation Lab**. Our backend OCR and image-enhancement pipeline extracts the embedded micro-watermark tokens and matches them against historical session logs, producing undeniable evidentiary attribution within seconds."*

---

## ⏱️ [6:45 – 7:15] Scene 8: Anomaly Risk Telemetry, Emergency Lockdown & Conclusion
* **🖥️ On-Screen Visuals:**
  1. Navigate to **Risk Sessions & Security Events** (`/investigator/risk-sessions`).
  2. Show the real-time risk scores (Unregistered Device +35, Off-Hours +25, High Velocity +30).
  3. Point out the **Global Threat Alert Banner / System Lockdown**.
  4. Smoothly pan back to the ExamVault brand header.
* **🎙️ Voiceover Script:**
  > *"ExamVault continuously monitors active sessions with explainable, point-based risk scoring. Anomaly spikes automatically trigger step-up authentication or global system lockdown via real-time WebSockets.
  > 
  > By unifying zero-trust identity, field-level AES encryption, 2-man dual custody, blockchain-chained auditing, and forensic attribution, ExamVault provides an unbreachable defense for high-stakes examinations.
  > 
  > Thank you — ExamVault is ready for production deployment."*

---

### 📋 Demo Recording Checklist & Tips:
* [x] **Browser Zoom:** Set browser zoom to 90% or 100% so full dashboards fit crisply on screen.
* [x] **Audio Quality:** Use a clean microphone in a quiet room with confident, steady pacing.
* [x] **Live Credentials:**
  * `setter_a@examvault.com` / `password123`
  * `reviewer_b@examvault.com` / `password123`
  * `approver_c@examvault.com` / `password123`
  * `admin2@examvault.com` / `password123`
  * `investigator@examvault.com` / `password123`
  * 2FA OTP: `123456`
