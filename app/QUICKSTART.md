# FastAPI Backend - Quick Start Guide

## What You Have Now

✅ **Event-Driven Architecture** with pub/sub event bus  
✅ **7 Specialist Agents** handling business logic  
✅ **8 API Routers** for complete workflow  
✅ **PostgreSQL Database** with async SQLAlchemy  

## Architecture

```
Event → EventBus → Supervisor → Specialist Agent → Business Logic
```

### Event Flow Example

```python
# User uploads damage photo
POST /api/events/publish
{
  "type": "MEDIA_UPLOADED",
  "data": {
    "job_id": 123,
    "media_url": "https://storage/damage.jpg"
  }
}

# ↓ EventBus publishes to all subscribers
# ↓ Supervisor receives event
# ↓ Routes to ClaimAgent.analyze_and_update()
# ↓ ClaimAgent calls VisionAgent for AI analysis
# ↓ Updates claim with damage estimate
# → Returns result
```

## Quick Test

### 1. Install Dependencies

```bash
# Via Replit Dependencies tool:
# Add: fastapi, uvicorn, sqlalchemy, asyncpg

# Or manually:
poetry add fastapi uvicorn[standard] sqlalchemy[asyncio] asyncpg
```

### 2. Run the Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

### 3. Test Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "orchestration": "active",
  "event_bus": "0 events logged"
}
```

## Event Bus Usage

### Publish Event (Business Events)

```bash
# Weather triggers contractor deployment
curl -X POST http://localhost:5000/api/events/publish \
  -H "Content-Type: application/json" \
  -d '{
    "type": "WEATHER_IMPACT",
    "data": {
      "state": "FL",
      "severity": "extreme"
    }
  }'
```

### Execute Task Directly (Agent Tasks)

```bash
# Direct weather analysis
curl -X POST http://localhost:5000/api/orchestration/task \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weather_analysis",
    "data": {
      "state": "FL",
      "city": "Miami"
    }
  }'
```

### View Event Log

```bash
curl http://localhost:5000/api/events/recent?limit=10
```

## Supported Event Types

### Business Events (via Event Bus)

| Event | Agent | Action |
|-------|-------|--------|
| `WEATHER_IMPACT` | DispatchAgent | Broadcast contractor leads |
| `UPLOAD_CONTRACT` | LegalAgent | Validate/generate contract |
| `MEDIA_UPLOADED` | ClaimAgent | AI damage analysis |
| `INVOICE_DISPUTED` | NegotiatorAgent | Prepare rebuttal |
| `PAYMENT_DUE` | FinanceAgent | Payment reminder |

### Direct Tasks (Task-Based)

| Task | Agent | Action |
|------|-------|--------|
| `weather_analysis` | WeatherAgent | Analyze weather |
| `dispatch_contractor` | DispatchAgent | Send notification |
| `create_claim` | ClaimAgent | Create claim |
| `negotiate_claim` | NegotiatorAgent | Counter-offer |
| `validate_contract` | LegalAgent | Legal validation |
| `analyze_image` | VisionAgent | Damage detection |
| `process_payment` | FinanceAgent | Stripe payment |

## API Endpoints

### Core APIs

- `GET /` - Health check
- `GET /health` - Detailed status
- `GET /api/docs` - Swagger documentation

### Event Bus

- `POST /api/events/publish` - Publish event
- `GET /api/events/recent` - View event log

### Orchestration

- `POST /api/orchestration/task` - Execute agent task
- `GET /api/orchestration/agents` - List all agents

### Workflow Routes

- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `POST /membership/checkout` - Stripe checkout
- `POST /contractor/profile` - Create profile
- `POST /jobs/` - Create job
- `POST /claims/` - Create claim
- `POST /payments/` - Process payment
- `POST /compliance/validate-contract` - Validate contract

## File Structure

```
app/
├── main.py                 # FastAPI app with event bus
├── deps.py                 # Dependencies container
├── database.py             # PostgreSQL connection
├── models.py               # SQLAlchemy models
│
├── utils/
│   └── events.py          # EventBus pub/sub system
│
├── agents/
│   ├── supervisor.py      # Event router
│   ├── legal.py           # Contract validation
│   ├── weather.py         # Weather analysis
│   ├── vision.py          # AI damage detection
│   ├── dispatch.py        # Contractor notifications
│   ├── claims.py          # Insurance claims
│   ├── negotiator.py      # Claim negotiation
│   └── finance.py         # Payment processing
│
└── routers/               # API routes (8 routers)
    ├── auth.py
    ├── membership.py
    ├── contractor.py
    ├── leads.py
    ├── jobs.py
    ├── claims.py
    ├── payments.py
    └── compliance.py
```

## Run Examples

```bash
# Test all examples
python app/examples.py
```

This will demonstrate:
1. Weather event → Contractor deployment
2. Photo upload → Damage analysis
3. Invoice dispute → AI negotiation
4. Direct task execution
5. Complete insurance claim workflow

## Next Steps

1. ✅ **Test event bus**: Run `python app/examples.py`
2. ✅ **Test API**: Visit `http://localhost:5000/api/docs`
3. 🔧 **Add real integrations**: Connect Twilio, Stripe, weather APIs
4. 🔧 **Implement auth**: Add JWT/session authentication
5. 🚀 **Deploy**: Publish to Replit Autoscale

## Environment Variables

Copy `app/.env.example` to `.env` and configure:

```bash
ENV=development
DATABASE_URL=postgresql://...
TWILIO_AUTH_TOKEN=...
STRIPE_SECRET_KEY=...
OPENAI_API_KEY=...
```

## Troubleshooting

**Import errors?**
```bash
# Make sure all __init__.py files exist
ls app/__init__.py app/agents/__init__.py app/routers/__init__.py
```

**Database errors?**
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL
```

**Port already in use?**
```bash
# Change port in main.py or:
PORT=8000 uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Comparison: TypeScript vs Python

Your TypeScript orchestration system (current):
- ✅ Production-ready
- ✅ Fully tested
- ✅ Integrated with existing codebase

This Python FastAPI backend (new):
- ✅ Event bus architecture
- ✅ Complete agent implementation
- ✅ Ready for testing
- ⚠️ Needs real API integration

**Recommendation:** Keep TypeScript for deadline, use Python as reference or future microservice.

## Support

- Full documentation: `app/README.md`
- Examples: `app/examples.py`
- Project overview: `replit.md`
