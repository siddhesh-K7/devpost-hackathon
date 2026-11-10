# PayPilot AI: Autonomous Commerce, Multi-Agent Engine & PayPal Payment Orchestration

> **PayPal AI Hackathon 2026 Submission**  
> *Theme: Build What's Next with PayPal and AI*

[![PayPal Orders API v2](https://img.shields.io/badge/PayPal-Orders_API_v2-003087?style=flat&logo=paypal&logoColor=white)](https://developer.paypal.com/docs/api/orders/v2/)
[![Google Gemini 3](https://img.shields.io/badge/Google-Gemini_3_Flash-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![MongoDB Isolated Port 27018](https://img.shields.io/badge/MongoDB-Port_27018-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React 19 & Vite](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![FastAPI Python 3.13](https://img.shields.io/badge/Backend-FastAPI_0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Unslop UI Craft](https://img.shields.io/badge/UI_Design-Unslop_Craft-black?style=flat)](https://github.com/heydamir/unslop)

---

## 🌟 Detailed Project Overview

**PayPilot AI** transforms conversational artificial intelligence from a passive chatbot into a **fully autonomous commerce orchestration engine**. Instead of merely generating text suggestions, PayPilot AI autonomously analyzes user shopping intent, evaluates product catalogs across multiple e-commerce sources (Amazon, Flipkart), optimizes budgets, manages an autonomous commerce wallet, and initiates and settles real transactions via the **PayPal Orders API v2 Sandbox**.

### The Core Problem PayPilot AI Solves:
1. **Decision Paralysis & Fragmentation:** Shopping online across multiple retail platforms involves comparing technical specs, tracking price volatility, checking warranty terms, and calculating taxes manually.
2. **Disconnected Payment Friction:** Traditional chatbots recommend links that force users to leave the conversational context, enter checkouts, and navigate authentication flows from scratch.
3. **Lack of Autonomous Financial Guardrails:** Users want AI that can act on their behalf (e.g., auto-purchasing an item when a deal is identified) but fear unauthorized spending, lack of transparency, and payment fraud.

---

## 🧠 Multi-Agent Architecture (Google Gemini Pipeline)

PayPilot AI employs a specialized multi-agent workflow where each agent is responsible for an atomic phase of the commerce lifecycle:

```
                                  +---------------------------------------+
                                  |         PayPilot AI Frontend          |
                                  |   (React 19, TypeScript, Tailwind v4) |
                                  |   Light & Dark Mode + Unslop Craft    |
                                  +-------------------+-------------------+
                                                      |
                                           REST API / Axios (Port 8000)
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
        |   Google Gemini AI      |      |   MongoDB Isolated DB   |       |   PayPal Orders API v2  |
        | Multi-Agent Pipeline:   |      |   Port 27018 (22 Colls):|       | Complete Payment Flow:  |
        | 1. GeminiIntentAgent    |      | - users & user_profiles |       | - OAuth Bearer Tokens   |
        | 2. ProductDiscovery     |      | - products & sources    |       | - Orders v2 Creation    |
        | 3. ComparisonAgent      |      | - purchase_orders       |       | - Human Approval Gate   |
        | 4. PurchasePlanning     |      | - user_wallets & txns   |       | - Server-Side Capture   |
        | 5. AutonomousBuyAgent   |      | - refunds & invoices    |       | - Instant 1-Click Refund|
        | 6. FraudMonitoringAgent |      | - fraud_alerts & audit  |       | - Digital Receipts      |
        +-------------------------+      +-------------------------+       +-------------------------+
```

### 1. `GeminiIntentAgent`
- Analyzes natural language prompts (`"I need a laptop for programming under ₹60,000"` or `"Buy Huawei Matebook X Pro"`).
- Extracts hard constraints: target price ceiling, categories, performance specifications, and buying mode (interactive consultation vs. 100% autonomous buying).

### 2. `ProductDiscoveryAgent`
- Queries the MongoDB catalog across 28 synchronized retail categories and 250+ active product listings.
- Evaluates stock availability, warranty conditions, seller reputations, and real-time pricing.

### 3. `ProductComparisonAgent`
- Normalizes disparate technical specifications (RAM, CPU cores, display resolution, GPU, battery life).
- Computes multi-attribute benchmark scores to rank recommendations objectively.

### 4. `PurchasePlanningAgent`
- Calculates itemized subtotals, mandatory GST (18%), shipping costs, and applicable coupons (`SAVE10`, `WELCOME10`, `PAYPILOT500`).
- Generates an immutable purchase order contract stored in MongoDB.

### 5. `AIAutonomousBuyingAgent` & Smart Wallet
- Detects autonomous buying intent: checks the user's PayPilot Autonomous Smart Wallet balance.
- If funds are short, the agent auto-allocates the exact differential into the wallet, debits the total, creates a confirmed purchase order, and generates a BlueDart priority dispatch receipt without manual clicks.

### 6. `FraudMonitoringAgent` & Expense Intelligence
- Evaluates velocity bounds, volume anomalies, and purchase frequency.
- Generates transparent risk scores and flags suspicious transactions before payment processing.
- Aggregates categorized spending velocity into interactive visual analytics.

---

## 💳 PayPal Integration & Gateway Orchestration

PayPilot AI is deeply engineered with official PayPal developer standards:
- **PayPal Orders API v2 Sandbox:** Direct server-to-server integration (`/v2/checkout/orders` and `/v2/checkout/orders/{id}/capture`).
- **Human-in-the-Loop Safeguard:** High-value purchases require explicit user confirmation before execution, preventing unconstrained AI purchases.
- **Server-Side Price Validation:** Every item total and currency conversion is recalculated on the backend to prevent frontend tampering.
- **Double-Capture Protection:** Cryptographic idempotency headers (`PayPal-Request-Id`) ensure duplicate network retries never cause multiple charges.
- **Instant Automated Refunds:** Single-click refund management credits funds directly back via the gateway or back to the user's Smart Wallet.
- **Automated Tax Invoicing:** Generates downloadable GST-compliant PDF invoices with unique receipt identifiers (`REC-YYYYMMDD-XXXXXX`).

---

## 🎨 Design Philosophy: `unslop` UI Craft & Dual Theme

The user interface follows the design principles established in [heydamir/unslop](https://github.com/heydamir/unslop):
- **Quiet Chrome:** Navigation bars, sidebars, borders, and card backgrounds remain calm and unobtrusive (`slate-950` / `zinc-900` palette), directing richness toward real product photos, charts, and transaction receipts.
- **Zero AI-Slop Tells:** No rainbow purple-to-cyan gradients, no gradient text in headings, no fuzzy neon drop shadows (`shadow-blue-500/30`), and no emoji icons in headers.
- **Strict 4px Spacing Grid:** All padding, margins, and gaps adhere to a uniform 4px scale.
- **Light & Dark Mode:** Integrated theme context with persistent `localStorage` retention and dynamic 1-click toggling (☀️ / 🌙) in the navigation header.

---

## 🛡️ Dedicated Database Architecture & Isolation

PayPilot AI communicates exclusively with a dedicated, isolated MongoDB server:
- **Port:** `127.0.0.1:27018`
- **Database:** `paypilot_ai_db`
- **Data Directory:** `C:\data\paypilot-mongodb`
- **Isolation Safeguard:** Strict boundary validation ensures port `27017` (reserved exclusively for existing live databases) is never accessed or modified.

### Key MongoDB Collections:
`users`, `user_profiles`, `user_addresses`, `products`, `product_sources`, `shopping_carts`, `cart_items`, `checkout_sessions`, `saved_payment_methods`, `purchase_orders`, `order_items`, `payment_orders`, `payment_captures`, `upi_payments`, `transactions`, `user_wallets`, `wallet_transactions`, `refunds`, `coupons`, `invoices`, `fraud_alerts`, `agent_execution_logs`.

---

## 🚀 Development Quick Start Guide (Windows PowerShell)

### Prerequisites
- Python 3.11+ (Python 3.13 tested)
- Node.js 18+ & npm
- MongoDB Server (installed locally)

### 1. Dedicated MongoDB Server (Port 27018)
Start the isolated PayPilot MongoDB instance:
```powershell
& "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --config "C:\data\paypilot-mongodb\mongod.cfg"
```

### 2. Backend Setup & Startup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run FastAPI backend with auto-reload on port 8000
python -m uvicorn app.main:app --reload --port 8000
```
- **Backend API Base:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

### 3. Frontend Setup & Startup
```powershell
# In a separate terminal
cd frontend
npm install
npm run dev
```
- **Frontend Application:** `http://localhost:5173`

---

## 👤 Pre-Seeded Demonstration Account

- **Email:** `demo@paypilot.ai`
- **Password:** `password123`
*(Pre-loaded with verified shopping history, an active ₹150,000 Smart Wallet, and synchronized multi-category retail products).*
