# PayPilot AI: Your Intelligent Autonomous Commerce & Payment Agent

> **PayPal AI Hackathon 2026 Submission**  
> *Theme: Build What's Next with PayPal and AI*

---

## 🌟 Executive Summary

**PayPilot AI** transforms conversational AI from a passive question-answering tool into an active, autonomous commerce agent. It combines:
- **Google Gemini 3 Multi-Agent Architecture**: 6 specialized agents governing intent, discovery, comparison, purchase planning, payments, and financial intelligence.
- **MongoDB Atlas Cloud Database**: 22 dedicated collections storing transactions, purchase orders, products, invoices, audit trails, and agent execution logs.
- **Official PayPal Orders API v2 & Sandbox**: Secure end-to-end checkout with server-side price recalculation, human-in-the-loop authorization gates, idempotency tokens, and anti-double capture protection.
- **Smart Fraud & Anomaly Monitoring**: Real-time velocity heuristics and volume anomaly scoring distinguishing suspicious activity from confirmed fraud.

---

## 🏗️ Architecture & Technology Stack

```
                                  +---------------------------------------+
                                  |         PayPilot AI Frontend          |
                                  |  (React 19, TypeScript, Tailwind CSS) |
                                  +-------------------+-------------------+
                                                      |
                                           REST API / Axios
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |         FastAPI Backend Engine        |
                                  +-------------------+-------------------+
                                                      |
                    +---------------------------------+---------------------------------+
                    |                                 |                                 |
                    v                                 v                                 v
       +-------------------------+      +-------------------------+       +-------------------------+
       |   Google Gemini AI      |      |   MongoDB Atlas Cloud   |       |   PayPal Orders API v2  |
       | Multi-Agent Pipeline:   |      | 22 Collections:         |       | Complete Payment Flow:  |
       | 1. Intent Understanding |      | - users & user_profiles |       | - OAuth Token Generator |
       | 2. Product Discovery    |      | - products & sources    |       | - Orders v2 Creation    |
       | 3. Comparison & Scoring |      | - purchase_orders       |       | - Human Approval Gate   |
       | 4. Purchase Planning    |      | - transactions          |       | - Server-Side Capture   |
       | 5. PayPal Payment Agent |      | - fraud_alerts          |       | - Webhook Verification  |
       | 6. Financial Intel      |      | - agent_execution_logs  |       | - Digital Receipts      |
       +-------------------------+      +-------------------------+       +-------------------------+
```

---

## 🚀 Windows PowerShell Quick Start (No Docker Required)

### 1. Backend Setup
```powershell
# Open terminal in project root
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run FastAPI backend on port 8000
python -m uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
Swagger API Documentation: `http://localhost:8000/docs`

### 2. Frontend Setup
```powershell
# In a new PowerShell window
cd frontend
npm install
npm run dev
```
Frontend will be accessible at: `http://localhost:5173`

---

## 🔑 Demo Account Credentials

- **Email**: `demo@paypilot.ai`
- **Password**: `password123`
*(Auto-seeded with verified demonstration transactions and laptops)*

---

## 🎬 3-Minute Hackathon Demonstration Script

### Act 1: The Core Aha! Shopping Experience (0:00 - 1:15)
1. Log in with `demo@paypilot.ai`.
2. Open **AI Shopping Assistant**.
3. Send: `"Find the best laptop for programming under ₹60,000, compare three products, recommend one and prepare the payment."`
4. **Agent Execution Trace**:
   - `GeminiIntentAgent` extracts the ₹60,000 budget and coding criteria.
   - `ProductDiscoveryAgent` queries the MongoDB database for matching candidates.
   - `ProductComparisonAgent` benchmarks RAM, multi-core CPU, and computes value scores.
   - `PurchasePlanningAgent` computes subtotal, GST (18%), and generates an order card.

### Act 2: Human-in-the-Loop & PayPal Sandbox Settlement (1:15 - 2:05)
1. Review the itemized pre-payment breakdown on the right sidebar.
2. Click **"Approve & Pay with PayPal"**.
3. Backend creates an order via PayPal Orders API v2 and captures the transaction.
4. An immutable digital receipt (`REC-2026-XXXXXX`) and PayPal capture ID are recorded in MongoDB Atlas.

### Act 3: Expense Intelligence & Fraud Anomaly Monitoring (2:05 - 3:00)
1. Navigate to **Expense Intelligence** to see dynamic category allocations and monthly spend velocity charts.
2. Navigate to **Fraud Monitor** to inspect real-time anomaly scores, velocity limit checks, and PayPal buyer protection verification.

