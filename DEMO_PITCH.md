# 🎯 5-Minute Demo Pitch & Presentation Script
> **Project**: RevPulse AI
> **Track**: AI Revenue Recovery Track (Razorpay AI Buildathon)

---

## 1. Pitch Structure (5 Minutes Total)

### Minute 0:00 - 0:45 | The Hook & Problem
- *"Indian businesses lose over ₹15,000 Crores annually to recoverable payment drop-offs — UPI timeouts, expired card mandates, abandoned checkout carts, and unpaid invoices."*
- *"Current solutions rely on dumb time-based retries that annoy customers or spam payment links blindly."*

### Minute 0:45 - 1:30 | The Solution (RevPulse AI)
- *"Meet **RevPulse AI**: An autonomous, bounded AI agent built specifically for Razorpay merchants."*
- *"Instead of dumb rules, RevPulse operates on a 6-step lifecycle: **Detect → Diagnose → Decide → Act → Verify → Measure**."*

### Minute 1:30 - 3:30 | Live Product Demo (Show, Don't Tell)
1. **Executive Dashboard**: Show Revenue at Risk (₹) vs Recovered Revenue (₹) and Recharts recovery trajectory.
2. **Live AI Agent Simulator**:
   - Click "Run Live Simulation" on a UPI timeout failure.
   - Show real-time step badges lighting up.
   - Point out the **AI Decision Matrix**: Category classification, business guardrails checklist (Max retries $\le 2$ verified), and bounded tool execution (Razorpay Payment Link generated).
3. **Human-in-the-Loop Escalation Center**:
   - Show how high-value enterprise SaaS invoices ($> ₹50,000$) or VIP accounts are safely routed to the Merchant Approval Inbox.
   - Click "Approve Strategy" with 1-click execution.

### Minute 3:30 - 4:15 | Architecture & Business Impact
- *"Built on Next.js 14, FastAPI, SQLite, and OpenAI GPT-4o structured JSON outputs."*
- *"Zero hallucination risk because every LLM response is bounded by strict business guardrails."*
- *"Pre-seeded with 1,000+ realistic Indian transaction lifecycles."*

### Minute 4:15 - 5:00 | Conclusion & Q&A
- *"RevPulse AI turns lost payment failures into a reliable, autonomous revenue recovery stream for Razorpay merchants."*

---

## 2. Step-by-Step Demo Click Script for Judges

1. Open `http://localhost:3000`.
2. Highlight the **Executive Metrics Bar**: Notice the instant calculation of ₹ Revenue at Risk and Net Recovered Revenue.
3. Scroll to the **Live AI Agent Simulator**:
   - Change customer tier to **VIP** and failure code to **UPI Gateway Timeout**.
   - Click **Run Live Simulation**.
   - Watch the 6 steps execute visually.
   - Point to the **Business Guardrails Checklist**: Highlight how Rule 1 (Retries $\le 2$) and Rule 4 (VIP account escalation) were automatically enforced.
4. Navigate to **Merchant Approvals**:
   - Show the pending high-value escalation item.
   - Click **Approve Strategy**. Notice the status instantly update to RECOVERED in the audit trail!
