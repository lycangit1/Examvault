import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print total page count
    along with running enterprise headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Suppress running header/footer on cover page (Page 1)
        if self._pageNumber > 1:
            # Running Header
            self.drawString(54, 11 * 72 - 36, "EXAMVAULT — ARCHITECTURAL SECURITY SPECIFICATION & PROTOCOLS")
            self.drawRightString(8.5 * 72 - 54, 11 * 72 - 36, "CONFIDENTIAL / ENTERPRISE")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.6)
            self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)

            # Running Footer
            self.line(54, 46, 8.5 * 72 - 54, 46)
            self.drawString(54, 34, "© 2026 ExamVault Systems • Zero-Trust Examination Lifecycle Security")
            self.drawRightString(8.5 * 72 - 54, 34, f"Page {self._pageNumber} of {page_count}")

        self.restoreState()


def build_pdf(filename="ExamVault_Comprehensive_Security_Specification.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#00236f")    # Deep Navy
    SECONDARY = colors.HexColor("#0284c7")  # Cyan / Electric Blue
    TEXT_DARK = colors.HexColor("#0f172a")  # Slate 900
    TEXT_MUTED = colors.HexColor("#475569") # Slate 600
    BG_LIGHT = colors.HexColor("#f8fafc")   # Slate 50
    BORDER_CLR = colors.HexColor("#e2e8f0") # Slate 200
    ACCENT_AMBER = colors.HexColor("#b45309")
    ACCENT_RED = colors.HexColor("#b91c1c")
    ACCENT_GREEN = colors.HexColor("#047857")

    # Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=TEXT_MUTED,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=TEXT_DARK,
        leftIndent=14,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#00236f"),
        backColor=colors.HexColor("#f1f5f9"),
        borderPadding=4,
        spaceAfter=5
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1e293b")
    )

    story = []

    # ==================== COVER / HEADER ====================
    story.append(Paragraph("EXAMVAULT ENTERPRISE GATEWAY", ParagraphStyle('SuperTitle', fontName='Helvetica-Bold', fontSize=9, textColor=SECONDARY, leading=11, spaceAfter=4)))
    story.append(Paragraph("Comprehensive Security Architecture & Protocols Specification", title_style))
    story.append(Paragraph("A Technical Deep-Dive into Zero-Trust RBAC, Cryptographic SHA-256 Hash Chaining, Dual-Lock Authorization, Field-Level Fernet AES Encryption, Dynamic Watermarking, and Client-Side DLP.", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=12))

    # Meta Table
    meta_data = [
        [Paragraph("<b>Document Classification:</b> Enterprise Technical Whitepaper", body_style), Paragraph("<b>Release Version:</b> 1.0.0-PROD-SEC", body_style)],
        [Paragraph("<b>Target Audience:</b> SecOps, AppSec, Chief Examiners", body_style), Paragraph("<b>Core Architecture:</b> Zero-Trust Defense-in-Depth", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[250, 250])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_CLR),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # ==================== SECTION 1 ====================
    story.append(Paragraph("1. Executive Summary & Core Security Philosophy", h1_style))
    story.append(Paragraph(
        "ExamVault is architected around the core engineering principle of <b>Honesty Over Spectacle</b>. "
        "Standard examination platforms rely on opaque, unverified claims of 'unhackable AI proctoring' or flimsy frontend obfuscation. "
        "ExamVault rejects black-box claims and instead implements a mathematically verifiable, multi-layered <b>Zero-Trust Architecture (ZTA)</b> "
        "with defense-in-depth security controls across the entire examination content lifecycle: from item drafting and moderation to package assembly, dual cryptographic locking, and forensic post-incident attribution.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Core Design Tenets:</b>", body_style
    ))
    story.append(Paragraph("• <b>Zero-Trust Verification:</b> Never trust, always verify. Every database query, API call, and view event is authenticated, watermarked, and audited.", bullet_style))
    story.append(Paragraph("• <b>Strict Least-Privilege & Separation of Duties (SoD):</b> No single administrator or role possesses sufficient cryptographic authority to create, moderate, approve, seal, and export an exam single-handedly.", bullet_style))
    story.append(Paragraph("• <b>Immutable Cryptographic Auditing:</b> Forward-linked SHA-256 hash chains guarantee tamper-evident integrity where retroactive modification triggers automated tripwires.", bullet_style))
    story.append(Paragraph("• <b>Deterministic Evidentiary Attribution:</b> High-entropy dynamic watermarking and cryptographically permuted option orders isolate leaked screen captures directly to the culprit session.", bullet_style))

    # ==================== SECTION 2 ====================
    story.append(Paragraph("2. Layered Threat Model & Mitigation Matrix", h1_style))
    
    threat_matrix = [
        [Paragraph("<b>Threat Vector</b>", body_style), Paragraph("<b>Adversary Profile</b>", body_style), Paragraph("<b>ExamVault Defense Mechanism</b>", body_style), Paragraph("<b>Cryptographic / Enforcement Layer</b>", body_style)],
        [Paragraph("<b>Database Compromise / Dump</b>", body_style), Paragraph("External Hacker / Hostile DBA", body_style), Paragraph("Field-Level AES Encryption + Row Level Security (RLS)", body_style), Paragraph("Fernet AES-128-CBC + HMAC-SHA256 & pgcrypto AES-256", body_style)],
        [Paragraph("<b>Audit Log Tampering</b>", body_style), Paragraph("Rogue Admin Covering Tracks", body_style), Paragraph("Immutable SHA-256 Linear Hash Chaining + Trigger Tripwires", body_style), Paragraph("SHA-256 forward hash linking + verify_audit_integrity RPC", body_style)],
        [Paragraph("<b>Unauthorized Cross-Role Access</b>", body_style), Paragraph("Malicious Insider (Setter/Reviewer)", body_style), Paragraph("Strict RBAC & DB-level RLS isolation (`auth.uid()`)", body_style), Paragraph("PostgreSQL engine-level RLS policies + JWT claims", body_style)],
        [Paragraph("<b>Rogue Package Release</b>", body_style), Paragraph("Compromised Approver Account", body_style), Paragraph("Dual-Custody 2-Man Rule (Approver + Admin_2)", body_style), Paragraph("Multi-Party Cryptographic Signatures & Manifest Hash", body_style)],
        [Paragraph("<b>External Phone Screen Photo</b>", body_style), Paragraph("Corrupt Candidate / Setter", body_style), Paragraph("Dynamic Session Watermark + Deterministic Option Permutation (DOP)", body_style), Paragraph("Session Token Steganography + HMAC(Session_ID, Q_ID)", body_style)],
        [Paragraph("<b>Clipboard Data Scraping</b>", body_style), Paragraph("Automated Browser Script / Insider", body_style), Paragraph("Client-Side DLP Interception & Context Menu Disabling", body_style), Paragraph("JavaScript Event Capture + CSS user-select: none", body_style)],
    ]
    t_threats = Table(threat_matrix, colWidths=[110, 95, 160, 135])
    t_threats.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_CLR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    for r in range(len(threat_matrix)):
        t_threats.setStyle(TableStyle([
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ]))
    story.append(t_threats)
    story.append(Spacer(1, 8))

    # ==================== SECTION 3 ====================
    story.append(Paragraph("3. Identity, Multi-Factor Authentication & Device Posture", h1_style))
    story.append(Paragraph(
        "Authentication in ExamVault operates on a multi-stage zero-trust pipeline designed to eliminate credential theft, session hijacking, and credential-stuffing attacks:",
        body_style
    ))
    story.append(Paragraph("<b>A. Primary Credential Verification:</b> User credentials (email + password) are validated against salted bcrypt password hashes stored in PostgreSQL. Standard plaintext passwords are never cached or logged.", bullet_style))
    story.append(Paragraph("<b>B. Time-Sensitive 2FA OTP Challenge:</b> Every authentication triggers a 6-digit cryptographic OTP challenge bound to a strict 5-minute expiration timestamp (`expires_at`).", bullet_style))
    story.append(Paragraph("<b>C. Biometric Face Liveness Gate:</b> Users undergo real-time biometric face verification before receiving an active session token. Face verification metadata (`face_verified`, `verification_timestamp`) is recorded directly in the session's forensic telemetry.", bullet_style))
    story.append(Paragraph("<b>D. Device Posture Evaluation:</b> The system inspects endpoint hardware headers (Device UUID, Browser WebGL Canvas Fingerprint, IP Subnet). Logins from unregistered or unmanaged devices incur an automatic <b>+35 point risk score penalty</b>.", bullet_style))
    story.append(Paragraph("<b>E. Cryptographically Bound Session Tokens:</b> Successful logins issue short-lived JWT tokens bound to unique `session_id` UUIDs. Sessions are subject to real-time heartbeat monitoring (every 4 seconds) and auto-suspension upon security lockdown.", bullet_style))

    # ==================== SECTION 4 ====================
    story.append(Paragraph("4. PostgreSQL Row Level Security (RLS) & Role-Based Access Control", h1_style))
    story.append(Paragraph(
        "Unlike generic web applications that enforce authorization only at the application routing layer, ExamVault enforces <b>Row Level Security (RLS) at the PostgreSQL database engine level</b>. Even if an attacker compromises the frontend or injects API calls, the database kernel strictly refuses queries outside the authenticated user's security boundary.",
        body_style
    ))
    
    rbac_data = [
        [Paragraph("<b>Role Name</b>", body_style), Paragraph("<b>Security Clearance & Boundary</b>", body_style), Paragraph("<b>PostgreSQL RLS Enforcement Rule</b>", body_style)],
        [Paragraph("<b>SETTER</b>", body_style), Paragraph("Drafts and edits individual questions. Cannot view other setters' drafts, cannot moderate, cannot assemble final packages.", body_style), Paragraph("<code>SELECT/UPDATE WHERE creator_id = auth.uid() AND status IN ('DRAFT', 'NEEDS_REVISION')</code>", code_style)],
        [Paragraph("<b>REVIEWER</b>", body_style), Paragraph("Reviews and moderates assigned question items. Cannot draft new items, cannot create final locked packages.", body_style), Paragraph("<code>SELECT/UPDATE WHERE assigned_reviewer_id = auth.uid() AND status = 'UNDER_REVIEW'</code>", code_style)],
        [Paragraph("<b>APPROVER</b>", body_style), Paragraph("Inspects approved questions and constructs exam packages. Applies Lock #1. Cannot sign Lock #2.", body_style), Paragraph("<code>SELECT WHERE status = 'APPROVED'; INSERT exam_packages; Cannot self-confirm Lock #2</code>", code_style)],
        [Paragraph("<b>ADMIN_2</b>", body_style), Paragraph("Independent gatekeeper. Validates manifest integrity and applies final Lock #2. Cannot create/modify questions or packages.", body_style), Paragraph("<code>UPDATE exam_packages SET status='FINAL_LOCKED' WHERE status='PENDING_DUAL_CONFIRMATION'</code>", code_style)],
        [Paragraph("<b>INVESTIGATOR</b>", body_style), Paragraph("Read-only access to audit ledgers, risk sessions, and leak OCR lab. Zero mutation access to examination questions.", body_style), Paragraph("<code>SELECT ON audit_logs, app_sessions, leak_reports; INSERT ON security_events</code>", code_style)],
    ]
    t_rbac = Table(rbac_data, colWidths=[80, 190, 230])
    t_rbac.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_CLR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_rbac)
    story.append(Spacer(1, 8))

    # ==================== SECTION 5 ====================
    story.append(Paragraph("5. Cryptographic Specifications & Encryption Protocols", h1_style))
    story.append(Paragraph(
        "ExamVault incorporates defense-in-depth cryptographic primitives across data-in-transit, data-in-use, and data-at-rest:",
        body_style
    ))
    story.append(Paragraph("<b>A. Data-in-Transit (TLS 1.3):</b> All communications between client endpoints, FastAPI backend, and Supabase PostgreSQL utilize TLS 1.3 with Perfect Forward Secrecy (ECDHE-ECDSA-AES256-GCM-SHA384). Legacy SSL/TLS 1.0/1.1 are disabled.", bullet_style))
    story.append(Paragraph("<b>B. Field-Level Symmetric Fernet Encryption:</b> Sensitive columns (<code>question_text</code>, <code>correct_answer</code>, <code>explanation</code>) are encrypted prior to database insertion using Fernet authenticated symmetric encryption. Fernet guarantees: (1) 128-bit AES in CBC mode with PKCS7 padding; (2) HMAC-SHA256 message authentication code; (3) 128-bit initialization vector (IV); (4) 64-bit timestamp validation.", bullet_style))
    story.append(Paragraph("<b>C. Database Storage Volume Encryption:</b> PostgreSQL volume data and write-ahead logs (WAL) are encrypted at rest using AES-256 XTS encryption.", bullet_style))
    story.append(Paragraph("<b>D. Web Crypto API In-Browser Verification:</b> The frontend utilizes native Web Crypto API (<code>crypto.subtle.digest('SHA-256')</code>) for hardware-accelerated client-side integrity validation.", bullet_style))

    # ==================== SECTION 6 ====================
    story.append(Paragraph("6. Immutable SHA-256 Hash-Chained Audit Ledger", h1_style))
    story.append(Paragraph(
        "To prevent rogue administrators or database intruders from covering their tracks, ExamVault implements a linear cryptographic ledger inspired by blockchain block-hashing. Every security event forms an unbroken mathematical chain:",
        body_style
    ))
    story.append(Paragraph(
        "<code>Current_Log_Hash = SHA256( Event_ID || User_ID || Action || Resource_ID || Canonical_Metadata || Previous_Log_Hash )</code>",
        code_style
    ))
    story.append(Paragraph(
        "<b>Mathematical Guarantees:</b><br/>"
        "1. <b>Pre-image & Collision Resistance:</b> Because SHA-256 is cryptographically one-way, it is computationally infeasible ($2^{256}$ operations) to alter past metadata without producing an entirely different hash.<br/>"
        "2. <b>Cascade Invalidation:</b> Modifying even a single character in Event #4 automatically invalidates the stored hashes of Events #5, #6, ..., #N.<br/>"
        "3. <b>Automated Tripwire RPC:</b> The PostgreSQL procedure <code>verify_audit_integrity()</code> recalculates the forward hash chain from Genesis to tip. If any mismatch is detected, the database immediately flags an <code>INTEGRITY_ALERT</code>, locks non-investigator access, and alerts the Security Operations Center.",
        body_style
    ))

    # ==================== SECTION 7 ====================
    story.append(Paragraph("7. Dual-Lock Cryptographic Custody (2-Man Rule)", h1_style))
    story.append(Paragraph(
        "In high-stakes examinations (e.g., UPSC, JEE, Medical Boards), single-party approval is a critical security vulnerability. ExamVault enforces a multi-party cryptographic authorization gate for package generation:",
        body_style
    ))
    story.append(Paragraph("• <b>Step 1 — Package Assembly & Lock #1:</b> Approver_1 verifies questions, defines the exam manifest, and signs Lock #1. The package enters state <code>PENDING_DUAL_CONFIRMATION</code>.", bullet_style))
    story.append(Paragraph("• <b>Step 2 — Independent Audit & Lock #2:</b> Admin_2 (operating from an isolated clearance terminal) inspects the package contents, verifies question distribution, and applies Lock #2.", bullet_style))
    story.append(Paragraph("• <b>Manifest Package Hash:</b> The master SHA-256 certificate is computed across all verified question hashes: <code>Package_Hash = SHA256( Q1_Hash || Q2_Hash || ... || Approver1_Signature || Admin2_Signature || Timestamp )</code>.", bullet_style))
    story.append(Paragraph("• <b>Rejection & Return Protocol:</b> If Admin_2 identifies anomalies, the package is rejected with formal reasons logged to the audit ledger and returned to the authoring pipeline.", bullet_style))

    # ==================== SECTION 8 ====================
    story.append(Paragraph("8. Dynamic Forensic Watermarking & Content Fingerprinting", h1_style))
    story.append(Paragraph(
        "ExamVault incorporates active forensic defense mechanisms against unauthorized physical screen photography and insider leaking:",
        body_style
    ))
    story.append(Paragraph("<b>A. Dynamic Canvas Micro-Watermarking:</b> Every viewing session renders low-opacity, high-entropy forensic watermarks directly onto the UI canvas. Watermark tokens encode: <code>User_ID • Session_UUID • Device_ID • Timestamp • IP_Hash</code>. Even if a smartphone captures the physical screen, the watermark identifies the viewing session.", bullet_style))
    story.append(Paragraph("<b>B. Deterministic Option Permutation (DOP):</b> Multiple-choice question options (A, B, C, D) are deterministically shuffled per session using a cryptographic seed: <code>Seed = HMAC_SHA256(Session_ID, Question_ID)</code>. The answer key is dynamically re-mapped in memory. If a leaker shares option letters (e.g., 'Q1 is B, Q2 is D'), the sequence is mathematically unique to their session.", bullet_style))
    story.append(Paragraph("<b>C. Forensic Leak Investigation Lab:</b> Investigators upload suspected leak photos into the FastAPI OCR engine. Tesseract OCR + OpenCV image enhancement extracts watermarks, parses text fragments, and correlates the leak against historical session logs to generate formal evidentiary reports.", bullet_style))

    # ==================== SECTION 9 ====================
    story.append(Paragraph("9. Explainable Risk Engine & Automated Lockdown Protocols", h1_style))
    story.append(Paragraph(
        "ExamVault rejects opaque 'AI black-box' claims in favor of a deterministic, point-based behavioral risk scoring engine:",
        body_style
    ))

    risk_data = [
        [Paragraph("<b>Risk Signal</b>", body_style), Paragraph("<b>Score Penalty</b>", body_style), Paragraph("<b>Detection Logic & Security Rationale</b>", body_style)],
        [Paragraph("<b>Unregistered Device</b>", body_style), Paragraph("+35 pts", body_style), Paragraph("Device posture mismatch; client fingerprint not found in corporate registry.", body_style)],
        [Paragraph("<b>Outside-Hours Access</b>", body_style), Paragraph("+25 pts", body_style), Paragraph("Activity detected outside authorized operational time window (22:00 - 06:00).", body_style)],
        [Paragraph("<b>High Velocity Views</b>", body_style), Paragraph("+30 pts", body_style), Paragraph("Rapid sequential item requests exceeding human reading velocity (>15 items/min).", body_style)],
        [Paragraph("<b>IP Subnet Shift</b>", body_style), Paragraph("+40 pts", body_style), Paragraph("Geographic or ISP subnet change mid-session indicating proxy or token theft.", body_style)],
        [Paragraph("<b>Failed 2FA Retries</b>", body_style), Paragraph("+20 pts", body_style), Paragraph("Repeated incorrect OTP challenges indicating brute-force attempt.", body_style)],
    ]
    t_risk = Table(risk_data, colWidths=[130, 80, 290])
    t_risk.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_CLR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_risk)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Threat Level Response Thresholds:</b>", body_style))
    story.append(Paragraph("• <b>NORMAL (Score 0–39):</b> Full access within authorized workspace boundary.", bullet_style))
    story.append(Paragraph("• <b>ELEVATED (Score 40–69):</b> Step-up biometric challenge triggered; real-time telemetry flagged in Investigator console.", bullet_style))
    story.append(Paragraph("• <b>HIGH RISK / SUSPENDED (Score 70–100):</b> Automated session termination. Active token revoked, database status set to <code>SUSPENDED</code>, and investigator triage required.", bullet_style))
    story.append(Paragraph("• <b>SYSTEM LOCKDOWN:</b> Emergency broadcast via Supabase WebSockets. Restricts all non-investigator access across the entire platform instantly.", bullet_style))

    # ==================== SECTION 10 ====================
    story.append(Paragraph("10. Client-Side Sandbox & Data Loss Prevention (DLP)", h1_style))
    story.append(Paragraph(
        "To prevent casual or automated text scraping at the browser client level, ExamVault integrates active DLP controls:",
        body_style
    ))
    story.append(Paragraph("• <b>Text Selection Blocking:</b> Applied CSS <code>user-select: none</code> across all question cards and package tables.", bullet_style))
    story.append(Paragraph("• <b>Clipboard Interception:</b> Intercepts <code>copy</code>, <code>cut</code>, and <code>selectall</code> events globally in protected workspaces. Displays real-time security alerts upon violation.", bullet_style))
    story.append(Paragraph("• <b>Context Menu Suppression:</b> Disables right-click context menus over sensitive examination content.", bullet_style))
    story.append(Paragraph("• <b>Active Workspace Isolation:</b> Workspace navigation bars, sidebars, and routes strictly isolate access to authorized profiles.", bullet_style))

    # ==================== SUMMARY BOX ====================
    story.append(Spacer(1, 10))
    summary_box = [
        [Paragraph("<b>EXAMVAULT ARCHITECTURAL COMPLIANCE STATEMENT</b>", ParagraphStyle('SumTitle', fontName='Helvetica-Bold', fontSize=10, textColor=PRIMARY, spaceAfter=4))],
        [Paragraph("This specification certifies that ExamVault v1.0 meets and enforces the security requirements for high-stakes examination protection: Zero-Trust Least Privilege, PostgreSQL Engine RLS, Field-Level Fernet AES Encryption, Cryptographic SHA-256 Hash Chained Auditing, 2-Man Dual-Lock Custody, and Dynamic Session Watermarking. Plaintext sensitive content is never stored raw, and every administrative action produces an immutable mathematical audit record.", callout_style)]
    ]
    t_sum = Table(summary_box, colWidths=[500])
    t_sum.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 1, SECONDARY),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_sum)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {filename}")

if __name__ == "__main__":
    out_pdf = "c:/Users/shiva/OneDrive/Desktop/Examvault/ExamVault_Comprehensive_Security_Specification.pdf"
    build_pdf(out_pdf)
