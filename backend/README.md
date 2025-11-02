# Disaster Direct - Python FastAPI Backend

AI-powered storm operations and claims management backend with compliance guardrails.

## 🚀 Quick Start

### 1. Create Virtual Environment
```bash
cd backend
python -m venv .venv
```

### 2. Activate Virtual Environment
```bash
# macOS/Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment
```bash
# Copy template
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
```

### 5. Run Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 6. Open Interactive Docs
```
http://localhost:8000/docs
```

---

## 🔑 Required API Keys

Add at least ONE LLM provider to `.env`:

```bash
# Option 1: OpenAI (Recommended)
OPENAI_API_KEY=sk-...

# Option 2: Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Option 3: xAI
XAI_API_KEY=xai-...
```

**Optional Services** (run in mock mode without):
- Twilio (SMS)
- Stripe (Payments)
- Database (PostgreSQL)

---

## 📚 API Documentation

Once running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Available Endpoints

#### Compliance (8 endpoints)
```bash
POST   /compliance/consent           # Grant/revoke consent
POST   /compliance/opt-out            # One-click opt-out
GET    /compliance/consent/{id}/{ch}  # Check consent
GET    /compliance/quiet-hours        # Check quiet hours
POST   /compliance/aob-check          # Validate AOB by state
POST   /compliance/validate-statute   # Verify citations
POST   /compliance/escalate           # Escalate high-risk
POST   /compliance/lien-deadline      # Calculate deadline
```

---

## 🧪 Test the API

```bash
# Check AOB in Texas (prohibited)
curl -X POST http://localhost:8000/compliance/aob-check \
  -H "Content-Type: application/json" \
  -d '{"state": "TX"}'

# Returns: {"allowed": false, "action": "block_aob_and_alert"}
```

---

## 🏗️ Architecture

```
app/
├── main.py              # FastAPI entry point
├── deps.py              # 13 services (auto-detect)
├── utils/events.py      # Event bus
│
├── agents/              # 4 AI agents
│   ├── legal.py         # Contract validation
│   ├── dispatch.py      # SMS alerts
│   ├── claims.py        # Insurance claims
│   └── negotiator.py    # Rebuttals
│
├── services/            # External integrations
│   ├── twilio_svc.py
│   ├── compliance_svc.py
│   └── templates_svc.py
│
└── routers/
    └── compliance.py    # 8 endpoints
```

---

## 🔒 Compliance Features

- ✅ TCPA/CTIA consent management
- ✅ Quiet hours (9 PM - 8 AM)
- ✅ Privacy & data minimization
- ✅ AOB state validation
- ✅ Statute citation verification
- ✅ Human-in-the-loop escalation

---

## 📝 Templates

14 professional templates:
- 4 SMS (storm alerts, jobs, payments)
- 3 Email reminders (Day 30/60/90)
- 3 Legal (lien, demand, AOB)
- 2 Insurance (status, demand)
- 1 Success (payment received)

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9

# Then restart
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Import errors
```bash
# Verify you're in backend/ directory
pwd

# Check virtual environment is activated
which python  # Should show .venv path
```

### Dependencies not found
```bash
# Reinstall
pip install -r requirements.txt --upgrade
```

---

## 🚀 Production Deployment

```bash
# Production mode (no auto-reload)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Environment checklist:**
- [ ] Production API keys in .env
- [ ] DATABASE_URL configured
- [ ] ENV=production
- [ ] Workers = CPU cores

---

## 📚 Documentation

- **QUICKSTART.md** - Replit deployment
- **COMPLIANCE.md** - Legal compliance
- **TEMPLATES.md** - Message templates
- **ROADMAP.md** - Development roadmap

---

## 🆘 Support

- Interactive Docs: http://localhost:8000/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- Issues: GitHub repository

---

**Built with FastAPI, AI agents, and enterprise compliance** 🎉
