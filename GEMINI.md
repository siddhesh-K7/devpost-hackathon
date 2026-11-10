# GEMINI.md — Project Engineering & Craft Standards (PayPilot AI)

## 1. Project Identity & Architecture
- **Project Name:** PayPilot AI
- **Purpose:** Autonomous Commerce, Multi-Agent Shopping Engine & PayPal Payment Orchestration
- **Stack:**
  - **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts
  - **Backend:** FastAPI (Python 3.13), Uvicorn, PyMongo (AsyncMongoClient)
  - **Database:** Dedicated MongoDB Server on Port `27018` (`paypilot_ai_db`)
  - **Payment Gateways:** PayPal Orders API v2 (Sandbox), Razorpay UPI / Cards fallback, Autonomous AI Smart Wallet

---

## 2. Integrated Skills & Quality Frameworks

### A. `unslop` — UI Craft & Anti-Slop Discipline
*(Source: [heydamir/unslop](https://github.com/heydamir/unslop))*

Vibecoded UI fails in predictable ways: glowing surfaces, emoji labels, random spacing, and gratuitous gradient text. Unslopping fixes the craft and keeps the product deliberate.

#### Nine-Pass Refinement Flow:
1. **Spacing**:
   - Everything sits strictly on a **4px grid** (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`).
   - Remove arbitrary offsets (`mt-[13px]`, `py-[11px]`).
   - Equal heights and gaps across lists and cards.
2. **Color & Quiet Chrome**:
   - Build from one neutral ramp (`slate`/`zinc`) tinted toward the domain.
   - Keep navigation chrome, sidebars, borders, and surfaces quiet.
   - 🚫 **No slop visual tells**: Remove purple-to-cyan rainbow gradients, gradient text in headings (`bg-clip-text text-transparent`), colored neon glows (`shadow-blue-500/30`), and floating blurred blobs.
3. **Icons**:
   - 🚫 Eliminate emoji used as icons or decorations (e.g. 🚀, ✨, 🔥, 💰).
   - Use consistent single-stroke Lucide line icons (`16px`/`18px` with consistent stroke).
   - Remove decorative `Sparkles` badges on static titles.
4. **Typography**:
   - Restraint in weights: avoid overuse of `font-black` (weight 900) on regular elements.
   - Reserve high contrast for primary headings (`font-bold` or `font-extrabold`); keep body text calm and legible.
5. **Rich Content Moments**:
   - Direct richness to real product data, data charts, and verified transaction receipts rather than decorative buttons and colored backgrounds.

---

### B. MongoDB Isolation Rules
- **Port 27018 Exclusivity:** All PayPilot AI operations communicate strictly with `mongodb://127.0.0.1:27018/paypilot_ai_db`.
- **Live Lab Safeguard:** Port `27017` belongs exclusively to the Live Lab Project (`portfolio` database) and must never be accessed, written, or modified.

---

### C. Testing & Verification Gates
Before claiming completion, verify:
1. `cd frontend && npm run build` (Must pass with 0 TypeScript/Vite errors).
2. Endpoint tests using `curl` or automated Python scripts.
3. PayPal Sandbox Order API v2 flow and wallet transaction updates.
