# 🚀 ExamVault Prototype — Complete Setup & Quickstart Guide

> **Document Classification:** Technical Setup & Deployment Guide  
> **Target Environment:** Local Developer Machine / Hackathon Evaluation Rig  
> **Supported OS:** Windows / macOS / Linux  
> **Default Ports:** Frontend: `http://localhost:5173` | Backend API: `http://localhost:8000`

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Project Architecture Overview](#2-project-architecture-overview)
3. [Quickstart (Run in 2 Minutes)](#3-quickstart-run-in-2-minutes)
4. [Backend Setup (FastAPI & Cryptography Engine)](#4-backend-setup-fastapi)
5. [Frontend Setup (React + Vite + Tailwind + WebGL)](#5-frontend-setup-react--vite)
6. [Demo Accounts & Credentials Matrix](#6-demo-accounts--credentials-matrix)
7. [Step-by-Step Feature Walkthrough Guide](#7-step-by-step-feature-walkthrough-guide)
8. [Troubleshooting & FAQs](#8-troubleshooting--faqs)

---

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:

| Tool | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.0.0+` | `v20.x` or `v22.x` | `node -v` |
| **npm** | `v9.0.0+` | `v10.x` | `npm -v` |
| **Python** | `3.10+` | `3.11+` | `python --version` |
| **pip** | Latest | Latest | `pip --version` |

---

## 2. Project Architecture Overview

```text
Examvault/
├── backend/                  # FastAPI Cryptographic Backend & OCR Engine
│   ├── main.py               # API Entrypoint (Port 8000)
│   ├── database.py           # Database Connection & Session Management
│   ├── models.py             # SQLAlchemy Relational Models & Schemas
│   ├── security/             # AES-128/256 Fernet Encryption, JWT, Rate Limiter
│   ├── routers/              # API Endpoints (Auth, Questions, Packages, Leaks)
│   └── .env.example          # Environment Configuration Template
│
├── frontend/                 # React 19 + TypeScript + Vite UI
│   ├── src/
│   │   ├── components/       # Reusable UI & Security Modals (OTP, Face, DLP)
│   │   ├── contexts/         # AuthContext, Session State & Role Boundaries
│   │   ├── pages/            # Role Consoles (Setter, Reviewer, Approver, Admin2, Investigator)
│   │   └── index.css         # Zero-Trust DLP Styles & Tailwind Configuration
│   ├── package.json          # Frontend Dependencies
│   └── vite.config.ts        # Vite Bundler Settings
│
├── supabase/migrations/      # PostgreSQL Schema, RLS Policies & Stored Procedures (RPCs)
├── ExamVault_Comprehensive_Security_Specification.pdf # Official 5-Page Security Whitepaper
├── ExamVault_7_Minute_Demo_Script.md                 # Official Video Recording Script
└── README.md                 # High-Level Project Overview
```

---

## 3. Quickstart (Run in 2 Minutes)

Open **two separate terminal windows** inside the `Examvault` root folder:

### 🖥️ Terminal 1 — Start the Backend Server:
```bash
# 1. Install backend Python dependencies
pip install fastapi uvicorn cryptography pydantic python-multipart pillow pytesseract sqlalchemy python-jose passlib reportlab

# 2. Launch FastAPI backend on port 8000
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
> Backend API documentation will be live at: `http://localhost:8000/docs`

---

### 🎨 Terminal 2 — Start the Frontend Application:
```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install node dependencies
npm install

# 3. Start the Vite development server
npm run dev
```
> Open your browser and navigate to: **`http://localhost:5173/`**

---

## 4. Backend Setup (FastAPI)

### Environment Configuration:
1. Inside the `backend/` directory, verify that `.env` exists. If not, copy from `.env.example`:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Key settings inside `backend/.env`:
   * `PORT=8000`
   * `DATABASE_URL=sqlite:///./examvault_hardened.db`
   * `JWT_SECRET_KEY=examvault_super_secret_cryptographic_jwt_signing_key_32bytes_min_length_2026`
   * `FERNET_ENCRYPTION_KEY=dGhpcy1pcy1hLTMyLWJ5dGUtc2VjcmV0LWtleS1mb3ItZmVybmV0PQ==`

### Database Auto-Initialization:
On the first launch of `backend.main:app`, SQLite will automatically create and seed `examvault_hardened.db` with all tables, initial question items, and demo account hashes.

---

## 5. Frontend Setup (React + Vite)

### Clean Build & Typecheck Verification:
To verify that all TypeScript types, routes, and components build cleanly without errors:
```bash
cd frontend
npm run build
```
*(This produces an optimized production bundle inside `frontend/dist/`)*.

---

## 6. Demo Accounts & Credentials Matrix

For streamlined evaluation, ExamVault includes **one-click demo account auto-filling** on the Login Screen (`/login`):

| Persona / Role | Demo Email | Password | 2FA OTP Code | Authorized Workspace |
| :--- | :--- | :--- | :--- | :--- |
| **Setter_A** | `setter_a@examvault.com` | `password123` | `123456` | `/setter/dashboard` |
| **Reviewer_B** | `reviewer_b@examvault.com` | `password123` | `123456` | `/reviewer/dashboard` |
| **Approver_C** | `approver_c@examvault.com` | `password123` | `123456` | `/approver/dashboard` |
| **Admin_2** | `admin2@examvault.com` | `password123` | `123456` | `/admin2/dashboard` |
| **Investigator** | `investigator@examvault.com` | `password123` | `123456` | `/investigator/dashboard` |

---

## 7. Step-by-Step Feature Walkthrough Guide

Follow this guided flow to test every security layer of ExamVault:

### Step 1: Zero-Trust Authentication Gate
1. Navigate to `http://localhost:5173/login`.
2. Click on the **Setter_A** button in the `DEMO ENVIRONMENTS` row.
3. Click **Sign In to Gateway**.
4. Enter `123456` in the **6-digit TOTP challenge modal**.
5. Click **Verify Face** in the **Biometric Face Verification modal**.
6. You will be routed into the **Setter Workspace**.

---

### Step 2: Field-Level AES Encryption & Client-Side DLP
1. Inside the **Setter Workspace**, click **Create New Question**.
2. Draft a question statement and options; mark the correct answer key.
3. Click **Submit for Review** (payload is encrypted with **Fernet AES-128-CBC + HMAC-SHA256**).
4. Hover over any question card. Attempt to select text and press **`Ctrl + C`** or right-click.
5. Notice the **Content Protection Active** floating security banner that intercepts the action.

---

### Step 3: Least-Privilege Access Restriction Modal
1. While logged in as `Setter_A`, click on **REVIEWER** or **ADMIN 2** in the top **Role Switcher** bar.
2. An **Access Boundary Enforcement** security modal will pop up explaining that your credentials are restricted strictly to your authorized role.
3. Click **Understood • Return to My Workspace**.

---

### Step 4: The 2-Man Rule (Dual-Lock Cryptographic Package Sealing)
1. Log in as **Approver_C** (`approver_c@examvault.com` / `password123`).
2. Select 2 approved questions from the right panel, enter package code `PHY-2026-SET-A`, and click **Lock #1 & Route to Admin_2**.
3. Log in as **Admin_2** (`admin2@examvault.com` / `password123`).
4. Click on the pending package in Admin_2's dual-lock queue.
5. Click **Seal Final Lock #2**.
6. Confetti will burst on screen, locking the package to `FINAL_LOCKED` and generating the **Master SHA-256 Manifest Hash**.

---

### Step 5: Anti-Leak Dynamic Watermarking & DOP
1. Inspect any question view. Notice the dynamic, semi-transparent forensic watermark (`Session UUID • Device ID • Timestamp`).
2. Notice how options (A, B, C, D) are shuffled dynamically per session via **Deterministic Option Permutation (DOP)** without altering the underlying answer key.

---

### Step 6: Blockchain-Chained Audit Ledger & Leak OCR Lab
1. Log in as **Investigator** (`investigator@examvault.com` / `password123`).
2. Go to `/investigator/audit-logs`. Inspect the forward-linked SHA-256 hash chains (`Current_Hash = SHA256(data + Prev_Hash)`).
3. Click **Verify Ledger Integrity** to perform a real-time mathematical validation.
4. Go to `/investigator/leaks`. Upload a leaked exam screenshot into the **Forensic Leak Investigation Lab** and click **Analyze & Correlate Leak** to view the extracted micro-watermark and culprit session attribution.

---

## 8. Troubleshooting & FAQs

### Q1: Port 5173 or 8000 is already in use.
* **Fix for Frontend (5173):** Vite will automatically select the next available port (e.g. `5174`), or run:
  ```bash
  npm run dev -- --port 3000
  ```
* **Fix for Backend (8000):** Run uvicorn on a custom port:
  ```bash
  python -m uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload
  ```

### Q2: Tesseract OCR is not detected on backend.
* On Windows, install Tesseract OCR from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki) or the frontend's built-in `tesseract.js` client fallback will automatically process images directly inside the browser.

### Q3: How do I reset the demo database?
* Simply delete `examvault_hardened.db` in the project root and restart the backend server; it will automatically re-create fresh tables and seed data.

---

### 📄 Related Documentation
* 📑 **[Comprehensive Security Whitepaper PDF](file:///c:/Users/shiva/OneDrive/Desktop/Examvault/ExamVault_Comprehensive_Security_Specification.pdf)**
* 📝 **[Full Cryptographic Protocols Markdown](file:///c:/Users/shiva/OneDrive/Desktop/Examvault/ExamVault_Security_Architecture_and_Protocols.md)**
* 🎬 **[7-Minute Official Video Demonstration Script](file:///c:/Users/shiva/OneDrive/Desktop/Examvault/ExamVault_7_Minute_Demo_Script.md)**
