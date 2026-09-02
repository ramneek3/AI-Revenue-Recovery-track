# RevPulse AI — Autonomous AI Revenue Recovery Agent
> **Razorpay AI Buildathon Submission — AI Revenue Recovery Track**

RevPulse AI is an enterprise-grade, autonomous, bounded AI Revenue Recovery Agent designed to protect and recover lost merchant revenue across failed payment gateways, abandoned checkout sessions, expired subscription mandates, and overdue SaaS invoices.

---

## Key Highlights

- **Complete 6-Step Autonomous Engine**: `Detect` → `Diagnose` → `Decide` → `Act` → `Verify` → `Measure`.
- **Bounded Tool Actions**: Smart Payment Retries, Razorpay Instant Payment Link Generation, Multi-Channel WhatsApp/SMS Reminders, and Merchant Escalations.
- **100% Guardrail Enforced**: Strict stopping rules (Max Retries $\le 2$, Max Contacts $\le 3$, Fraud Risk Detection, Cooling-off periods).
- **Human-in-the-Loop Safeguards**: High-value transactions ($> ₹50,000$) and VIP accounts automatically route to the Merchant Approval Portal for sign-off.
- **Explainability & Auditability**: Every decision is logged with LLM prompt context, confidence scores, verified business rules, and immutable audit logs.
- **Realistic Synthetic Engine**: Out-of-the-box seeding for 1,000+ realistic Indian context transactions (UPI, Credit Cards, NetBanking, Autopay mandates).

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router, TypeScript), Tailwind CSS, shadcn/ui aesthetics, Recharts, Framer Motion, Lucide Icons.
- **Backend**: Python FastAPI, Pydantic v2, Async SQLAlchemy, Uvicorn.
- **Database**: SQLite (via `aiosqlite`) for zero-config portable local execution.
- **AI/LLM**: OpenAI GPT-4o / GPT-4o-mini structured JSON schema output with fallback deterministic rule engine.

---

## Quick Start (Local Run)

### 1. Backend Setup
```bash
cd backend
python3 -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt

# Seed 1,000 Synthetic Transactions
python3 seed_runner.py

# Start FastAPI Backend Server
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Running Automated Verification Suite

To run integration tests verifying FastAPI backend routes, metrics calculation, and AI decision logic:
```bash
cd backend
PYTHONPATH=. ../venv/bin/pytest tests/test_api.py
```

---

## System Architecture

```
Ingestion (Webhooks/1K Data) ──> 6-Step Engine (Detect, Diagnose, Decide, Act, Verify, Measure)
                                             │
                                             ▼
                       Bounded Actions: Payment Retry | Payment Link | WhatsApp | Escalation
```
