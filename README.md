# EcoTrace AI 🌍

**Carbon Footprint Awareness Platform — 100% Free, 100% Open Source**

No paid APIs. No account required. Your data stays on your device.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## 🏗️ Architecture Highlights

- **Async First:** Powered by FastAPI and `aiosqlite` to prevent database blocking
- **Worker Offloading:** Heavy ML tasks (OCR, NLP) run in Web Workers, keeping the UI at 60fps
- **Privacy Native:** OCR runs locally in the browser. CLI agent uses safe system APIs only
- **3-Tier AI:** Ollama (local LLM) → Transformers.js (browser) → Algorithmic fallback
- **Zero API Keys:** No cloud services, no leaked credentials, no vendor lock-in

## 📊 Modules

| Module | Description |
|--------|-------------|
| **Carbon Calculator** | Transport, food, energy & shopping emissions using IPCC AR6 factors |
| **Bill Parser** | Browser-side OCR via Tesseract.js Web Worker for electricity bills & receipts |
| **Digital Tracker** | CLI agent monitoring device power consumption via psutil + py-cpuinfo |
| **AI Insights** | 3-tier recommendation engine with personalized carbon reduction tips |

## 🚀 Quick Start

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

# CLI Agent (optional — for digital footprint tracking)
cd cli-agent && pip install -r requirements.txt
python ecotrace_agent.py --country IN
```

## 🛡️ Security

- **Pydantic v2** strict validation on all API endpoints
- **Magic-byte MIME validation** on file uploads (not extension-based)
- **10MB file size limits** enforced server-side
- **No subprocess calls** — CLI agent uses py-cpuinfo native API
- **Rate limiting** via slowapi on heavy endpoints
- **CSP security headers** on all responses
- **No API keys** in the codebase

## ♿ Accessibility (WCAG 2.1 AA)

- `SkipToMain` link for keyboard users
- Focus trapping in modal dialogs
- `aria-live` regions for OCR progress and calculation results
- `sr-only` data tables paired with every chart
- Space + Enter activation on all custom interactive elements
- 4.5:1 contrast ratio verified across the color palette

## 🧪 Testing

```bash
# Frontend unit tests
cd frontend && npx vitest run

# Backend tests
cd backend && python -m pytest tests/ -v

# E2E tests
cd frontend && npx playwright test
```

### Test Coverage Targets
- Frontend utilities: ≥80%
- Backend routes: ≥80%
- E2E: Core user flow covered

## 📁 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| OCR | Tesseract.js v5 (Web Worker) |
| Browser AI | @xenova/transformers |
| Backend | Python FastAPI + aiosqlite |
| Validation | Pydantic v2 |
| CLI Agent | psutil + py-cpuinfo |
| Testing | Vitest + Pytest + Playwright |

## 📄 Emission Factor Sources

- IPCC AR6 (2021)
- UK BEIS (2023)
- India CEA (2022)
- EPA eGRID (2023)
- Poore & Nemecek (2018) — Food LCA data

## 📜 License

MIT License — Free for personal and commercial use.
