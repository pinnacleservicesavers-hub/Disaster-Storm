# Disaster Direct - Python FastAPI Backend Quickstart

## 🚀 Deploy on Replit

### 1. Create Replit Project
1. Go to [Replit](https://replit.com)
2. Click **"Create Repl"**
3. Select **Python** template
4. Name it: `disaster-direct-api`
5. Click **"Create Repl"**

### 2. Project Structure
```
disaster-direct-api/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── deps.py              # Dependency injection
│   ├── database.py          # PostgreSQL connection
│   ├── models.py            # Data models
│   │
│   ├── agents/              # 6 specialist agents
│   │   ├── supervisor.py
│   │   ├── legal.py
│   │   ├── weather.py
│   │   ├── dispatch.py
│   │   ├── claims.py
│   │   ├── negotiator.py
│   │   └── finance.py
│   │
│   ├── services/            # External integrations
│   │   ├── twilio_svc.py
│   │   ├── stripe_svc.py
│   │   ├── compliance_svc.py
│   │   └── ...
│   │
│   ├── routers/             # API endpoints
│   │   ├── auth.py
│   │   ├── compliance.py
│   │   └── ...
│   │
│   └── utils/
│       └── events.py        # Event bus
│
├── .env                     # Environment variables
└── README.md
```

### 3. Install Dependencies

Replit automatically manages Python packages. The following are already installed:

```
✅ fastapi
✅ uvicorn[standard]
✅ pydantic
✅ httpx
✅ python-multipart
✅ jinja2
✅ openai
✅ anthropic
✅ twilio
✅ stripe
✅ asyncpg
✅ sqlalchemy
✅ python-dotenv
✅ pytz
```

### 4. Configure Environment Variables

Click **"Secrets"** tab (🔒 lock icon) and add:

#### Required for LLM (choose one)
```bash
OPENAI_API_KEY=sk-...          # For GPT-4o-mini
# OR
ANTHROPIC_API_KEY=sk-ant-...   # For Claude
# OR
XAI_API_KEY=xai-...            # For Grok
```

#### Optional External Services
```bash
# SMS/Voice (optional - runs in mock mode without)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Payments (optional - runs in mock mode without)
STRIPE_SECRET_KEY=sk_test_...

# Database (Replit provides automatically)
DATABASE_URL=postgresql://...
```

### 5. Run the Server

**Option 1: Using Replit's Run Button**
Replit auto-detects FastAPI and runs:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Option 2: Manual Command (Shell)**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 6. Access the API

Once running, your API is available at:

- **API**: `https://your-repl-name.your-username.repl.co`
- **Interactive Docs**: `https://your-repl-name.your-username.repl.co/docs`
- **OpenAPI Schema**: `https://your-repl-name.your-username.repl.co/openapi.json`

### 7. Test the Endpoints

#### Health Check
```bash
curl https://your-repl-name.your-username.repl.co/
```

#### Compliance - Check Consent
```bash
curl https://your-repl-name.your-username.repl.co/compliance/consent/user123/sms
```

#### Compliance - Grant Consent
```bash
curl -X POST https://your-repl-name.your-username.repl.co/compliance/consent \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123", "channel": "sms", "opted_in": true}'
```

#### Compliance - Check AOB
```bash
curl -X POST https://your-repl-name.your-username.repl.co/compliance/aob-check \
  -H "Content-Type: application/json" \
  -d '{"state": "FL"}'
```

---

## 🔧 Wire Real Services Incrementally

### Phase 1: LLM Provider (Week 1)
```bash
# Add one of:
OPENAI_API_KEY=sk-...        # Recommended: GPT-4o-mini ($0.15/1M tokens)
ANTHROPIC_API_KEY=sk-ant-... # Alternative: Claude Sonnet
XAI_API_KEY=xai-...          # Alternative: Grok-2
```

**Test LLM:**
- Legal agent generates contracts
- Claims agent writes insurance narratives
- Negotiator drafts rebuttals

### Phase 2: SMS Messaging (Week 1)
```bash
# Twilio (https://www.twilio.com/console)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

**Test SMS:**
- Dispatch agent sends contractor alerts
- Compliance checks opt-in consent
- Quiet hours respected

### Phase 3: Payments (Week 2)
```bash
# Stripe (https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
```

**Test Payments:**
- Finance agent processes invoices
- Membership subscriptions
- Payment reminders

### Phase 4: Weather Data (Week 2)
```bash
# Free: NWS (no key needed)
# Premium: Xweather, Tomorrow.io
XWEATHER_CLIENT_ID=...
XWEATHER_CLIENT_SECRET=...
```

**Test Weather:**
- Weather agent analyzes storm impact
- Contractor deployment predictions

### Phase 5: Property Data (Week 3)
```bash
# Choose one:
SMARTY_AUTH_ID=...           # Address validation
ATTOM_API_KEY=...            # Property details
MELISSA_LICENSE_KEY=...      # Address verification
```

**Test Property:**
- Property lookups by address
- Owner information retrieval

### Phase 6: Legal Services (Week 3)
```bash
# DocuSign (https://developers.docusign.com/)
DOCUSIGN_INTEGRATION_KEY=...
DOCUSIGN_USER_ID=...
DOCUSIGN_ACCOUNT_ID=...

# LienItNow (https://lienitnow.com/)
LIENITNOW_API_KEY=...
```

**Test Legal:**
- E-signature workflows
- Lien deadline calculations

### Phase 7: Cost Estimation (Week 4)
```bash
# Xactimate API (enterprise)
XACTIMATE_API_KEY=...
```

**Test Claims:**
- True Cost vs Xactimate comparables
- Insurance claim generation

---

## 📊 OpenAPI UI (Interactive Docs)

Visit `/docs` for interactive API documentation:

**Features:**
- 🧪 Test all endpoints in browser
- 📝 See request/response schemas
- 🔐 Authenticate with API keys
- 📥 Export OpenAPI schema

**Try It Out:**
1. Visit `https://your-repl.repl.co/docs`
2. Expand `/compliance/consent` endpoint
3. Click **"Try it out"**
4. Enter sample data
5. Click **"Execute"**
6. See live response

---

## 🔄 Development Workflow

### Make Changes
1. Edit files in Replit editor
2. Save (Ctrl+S / Cmd+S)
3. Replit auto-reloads server (FastAPI `--reload` mode)

### Check Logs
- View console output in Replit's "Console" pane
- See HTTP requests and responses
- Monitor agent activity

### Debug
```python
# Add print statements
print(f"🔍 Debug: {variable}")

# Or use logging
import logging
logging.info("Processing event...")
```

### Test Event Bus
```bash
# Publish test event
curl -X POST https://your-repl.repl.co/events/publish \
  -H "Content-Type: application/json" \
  -d '{
    "type": "WEATHER_IMPACT",
    "region": "FL",
    "scopes": ["roofing"],
    "parcels": [{"address": "123 Main St", "lat": 25.76, "lon": -80.19}]
  }'
```

---

## 🚀 Production Deployment

### Replit Deployments
1. Click **"Deploy"** button
2. Choose **"Autoscale"** (recommended)
3. Set custom domain (optional)
4. Configure environment variables
5. Deploy!

**Features:**
- ✅ Auto-scaling based on traffic
- ✅ Zero-downtime deployments
- ✅ HTTPS/TLS certificates (automatic)
- ✅ Custom domain support
- ✅ Database backups
- ✅ 99.9% uptime SLA

### Production Checklist
- [ ] Switch to production API keys (Stripe, Twilio, etc.)
- [ ] Enable database encryption at rest
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerts
- [ ] Review compliance settings
- [ ] Test all integrations end-to-end
- [ ] Document API for contractors

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill existing process
pkill -f uvicorn

# Or use different port
uvicorn app.main:app --port 8001
```

### Import Errors
```bash
# Verify directory structure
ls -la app/

# Check Python path
export PYTHONPATH="${PYTHONPATH}:${PWD}"
```

### Database Connection Issues
```bash
# Check DATABASE_URL exists
echo $DATABASE_URL

# Test connection
python -c "import asyncpg; print('asyncpg installed')"
```

### LLM Not Working
```bash
# Verify API key
echo $OPENAI_API_KEY | cut -c1-10

# Check logs for "✅ LLM: OpenAI" message
```

---

## 📚 Next Steps

1. ✅ **Test Core Features**: Compliance, consent, AOB checking
2. 🔧 **Add Remaining Agents**: Weather, Finance
3. 🌐 **Build Routers**: Auth, Leads, Jobs, Claims, Payments
4. 🧪 **End-to-End Testing**: Full workflow tests
5. 📱 **Mobile App Integration**: Connect to existing TypeScript frontend
6. 🚀 **Launch**: Deploy to production!

---

## 🆘 Support

- **Documentation**: See `COMPLIANCE.md` for compliance details
- **Code Examples**: Check `/docs` for interactive examples
- **Replit Community**: [https://replit.com/talk](https://replit.com/talk)
- **FastAPI Docs**: [https://fastapi.tiangolo.com](https://fastapi.tiangolo.com)

---

**You're ready to build! 🎉**

Start with the interactive docs at `/docs` and wire services incrementally as your business grows.
