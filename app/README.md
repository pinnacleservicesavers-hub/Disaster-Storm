# Disaster Direct - FastAPI Backend

AI-powered storm prediction and contractor deployment platform with intelligent agent orchestration.

## Project Structure

```
app/
├── main.py                 # FastAPI application entry point
├── deps.py                 # Dependency injection container
├── database.py             # Database connection & sessions
├── models.py               # SQLAlchemy models
├── routers/                # API routes
│   ├── auth.py            # Authentication (signup, login)
│   ├── membership.py      # Stripe subscriptions
│   ├── contractor.py      # Contractor profiles
│   ├── leads.py           # Lead generation
│   ├── jobs.py            # Job management
│   ├── claims.py          # Insurance claims
│   ├── payments.py        # Payment processing
│   └── compliance.py      # Legal compliance
├── agents/                 # AI Agent orchestration
│   ├── supervisor.py      # Event-driven orchestrator
│   ├── legal.py           # Contract validation agent
│   ├── weather.py         # Weather analysis agent
│   ├── vision.py          # Image damage detection agent
│   ├── dispatch.py        # Contractor deployment agent
│   ├── claims.py          # Claims management agent
│   ├── negotiator.py      # Insurance negotiation agent
│   └── finance.py         # Payment processing agent
└── services/               # External service integrations
    ├── twilio_svc.py      # SMS notifications
    ├── stripe_svc.py      # Payment processing
    ├── docusign_svc.py    # E-signatures
    ├── weather_svc.py     # Weather data
    └── property_svc.py    # Property information
```

## Quick Start

### 1. Install Dependencies

Since this is a Replit project, Python dependencies should be managed via the Dependencies tool or:

```bash
# Using poetry (Replit default)
poetry add fastapi uvicorn sqlalchemy asyncpg twilio stripe openai anthropic

# Or using pip
pip install -r requirements.txt
```

**Required packages:**
- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `sqlalchemy[asyncio]` - Database ORM
- `asyncpg` - PostgreSQL async driver
- `twilio` - SMS notifications
- `stripe` - Payment processing
- `openai` - AI integration
- `anthropic` - Claude AI integration

### 2. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp app/.env.example .env
```

Update with your actual API keys and credentials.

### 3. Run the Application

```bash
# Development (with hot reload)
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload

# Production
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

### 4. Access Documentation

Once running:
- **API Docs (Swagger)**: http://localhost:5000/api/docs
- **ReDoc**: http://localhost:5000/api/redoc
- **Health Check**: http://localhost:5000/health

## Agent Orchestration System

The platform features a **Supervisor-based agent orchestration** system with 7 specialist agents.

### Event-Driven Architecture

The Supervisor routes business events to appropriate agents:

```python
# Example: Weather triggers contractor deployment
{
  "type": "WEATHER_IMPACT",
  "data": {
    "state": "FL",
    "severity": "extreme"
  }
}
# → Routed to DispatchAgent.broadcast_leads()
```

### Supported Events

| Event Type | Agent | Action |
|------------|-------|--------|
| `WEATHER_IMPACT` | DispatchAgent | Broadcast contractor leads |
| `UPLOAD_CONTRACT` | LegalAgent | Validate/generate contract |
| `MEDIA_UPLOADED` | ClaimAgent | Analyze damage from photos |
| `INVOICE_DISPUTED` | NegotiatorAgent | Prepare insurance rebuttal |
| `PAYMENT_DUE` | FinanceAgent | Send payment reminder |

### API Endpoints

**Execute Agent Task:**
```bash
POST /api/orchestration/task
{
  "type": "weather_analysis",
  "data": {"state": "FL"},
  "priority": "high"
}
```

**Handle Business Event:**
```bash
POST /api/orchestration/event
{
  "type": "WEATHER_IMPACT",
  "data": {"state": "FL", "severity": "extreme"}
}
```

**List All Agents:**
```bash
GET /api/orchestration/agents
```

## Workflow API Routes

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login

### Memberships (Stripe)
- `POST /api/membership/checkout` - Create checkout session
- `POST /api/membership/webhook` - Handle Stripe webhooks

### Contractor Management
- `POST /api/contractor/profile` - Create profile
- `GET /api/contractor/profile/{user_id}` - Get profile

### Leads & Jobs
- `GET /api/leads/` - Get active leads
- `POST /api/jobs/` - Create job
- `PATCH /api/jobs/{id}/status` - Update status

### Claims & Payments
- `POST /api/claims/` - Create insurance claim
- `POST /api/claims/{id}/submit` - Submit to insurer
- `POST /api/payments/` - Process payment

### Legal Compliance
- `POST /api/compliance/validate-contract` - Validate contract
- `POST /api/compliance/lien-deadline` - Calculate deadline

## Database Models

Key entities:
- `User` - Contractors, homeowners, admins
- `Membership` - Stripe subscription tracking
- `ContractorProfile` - Equipment, certifications
- `Property` - Geocoded addresses
- `Job` - Lead → In Progress → Complete → Invoiced → Paid
- `MediaAsset` - Photo/video damage documentation
- `Claim` - Insurance claim with negotiation history
- `Invoice` - Cost breakdown with Xactimate comparison
- `Contract` - State-specific legal agreements

## Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Test Agent Orchestration
```bash
# Weather analysis
curl -X POST http://localhost:5000/api/orchestration/task \
  -H "Content-Type: application/json" \
  -d '{"type":"weather_analysis","data":{"state":"FL"}}'

# Insurance claim workflow
curl -X POST http://localhost:5000/api/orchestration/event \
  -H "Content-Type: application/json" \
  -d '{
    "type":"MEDIA_UPLOADED",
    "data":{
      "job_id":1,
      "media_url":"https://storage.example.com/damage.jpg"
    }
  }'
```

## Deployment on Replit

### Configuration (.replit file)

```toml
run = "uvicorn app.main:app --host 0.0.0.0 --port 5000"
entrypoint = "app/main.py"

[deployment]
run = ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
deploymentTarget = "autoscale"
```

### Secrets

Add via Replit Secrets tool:
- `DATABASE_URL`
- `TWILIO_AUTH_TOKEN`
- `STRIPE_SECRET_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

### Autoscale Deployment

1. Click "Deploy" button
2. Select "Autoscale"
3. Configure: 1 vCPU, 2GB RAM, max 3 machines
4. Deploy

Your API will be live at: `https://your-repl-name.repl.co`

## Production Checklist

- [ ] Set `ENV=production` in environment
- [ ] Configure production database URL
- [ ] Add all API keys to Secrets
- [ ] Set CORS origins to production domains
- [ ] Enable Stripe webhook signing
- [ ] Configure DocuSign API credentials
- [ ] Set up monitoring/logging
- [ ] Add authentication middleware to protected routes

## Architecture Notes

This FastAPI backend mirrors the TypeScript orchestration system with:
- **Event-driven agent orchestration** (Supervisor pattern)
- **7 specialist agents** with clear responsibilities
- **RESTful API** following modern FastAPI patterns
- **Async/await** throughout for performance
- **SQLAlchemy ORM** with async PostgreSQL
- **Pydantic validation** on all inputs

## Support

See the main project `replit.md` for complete system architecture and integration details.
