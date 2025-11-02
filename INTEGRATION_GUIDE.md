# Disaster Direct - Frontend → Backend Integration Guide

## 🎯 Current State

### ✅ What You Have

**Python FastAPI Backend** (`backend/`)
```
✅ Routes: auth, membership, contractor, jobs, claims, compliance
✅ Event bus architecture
✅ Agent stubs: legal, dispatch, claims, negotiator, finance
✅ Service stubs ready for: LLM, Twilio, Stripe, DocuSign, weather, property, lienitnow
```

**Next.js Frontend** (in ZIP: `attached_assets/storm-disaster-monorepo_1762094022591.zip`)
```
✅ Routes: /login, /signup, /contractor/dashboard, /contractor/jobs/[id], /homeowner/dashboard
✅ Forms: file upload, cost breakdown, comparables, invoice
```

---

## 🚀 Integration Plan (3 Phases)

### **Phase 1: Extract & Connect Frontend** (Week 1, Days 1-2)
1. Extract Next.js frontend from ZIP
2. Configure environment variables
3. Create TypeScript API client
4. Connect login/signup forms

### **Phase 2: Wire Dashboards** (Week 1, Days 3-5)
1. Implement auth routes (JWT/session)
2. Connect contractor dashboard → jobs/claims endpoints
3. Connect homeowner dashboard → job status
4. Add consent/opt-out flows

### **Phase 3: Payments & Reports** (Week 2)
1. Stripe membership checkout
2. Webhook handling
3. PDF report generation (insurer-facing)
4. Media upload integration

---

## 📦 Phase 1: Extract & Setup Frontend

### Step 1: Extract the ZIP (Manual)

Since I can't automatically extract binary ZIPs, you'll need to:

```bash
# Option A: Extract locally and upload
1. Download: attached_assets/storm-disaster-monorepo_1762094022591.zip
2. Extract it locally
3. Upload the 'frontend' folder to your Replit project root

# Option B: Use Replit's file manager
1. Click on attached_assets/storm-disaster-monorepo_1762094022591.zip
2. Right-click → Download
3. Extract locally
4. Drag & drop 'frontend' folder to Replit
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 3: Configure Environment

Create `frontend/.env.local`:

```bash
# FastAPI Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production on Replit
# NEXT_PUBLIC_API_URL=https://your-repl.repl.co/api

# Stripe Public Key (when ready)
# NEXT_PUBLIC_STRIPE_KEY=pk_test_...
```

### Step 4: Run Both Servers

**Terminal 1 - Python Backend:**
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Next.js Frontend:**
```bash
cd frontend
npm run dev
# Opens on http://localhost:3000
```

---

## 🔗 Phase 2: TypeScript API Client

### Create `frontend/lib/api.ts`

```typescript
// frontend/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth token if available
  if (requireAuth) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Include cookies for session auth
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      error.message || `HTTP ${response.status}`,
      error
    );
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      requireAuth: false,
    }),

  signup: (data: { email: string; password: string; role: string }) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: false,
    }),

  // Contractor
  getContractorProfile: () =>
    apiRequest('/contractor/profile'),

  getJobs: (contractorId?: string) =>
    apiRequest(`/jobs${contractorId ? `?contractor_id=${contractorId}` : ''}`),

  getJob: (id: string) =>
    apiRequest(`/jobs/${id}`),

  updateJobStatus: (id: string, status: string) =>
    apiRequest(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Claims
  submitInvoice: (jobId: string, data: any) =>
    apiRequest(`/jobs/${jobId}/invoice`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getComparables: (invoiceId: string) =>
    apiRequest(`/invoices/${invoiceId}/comparables`, {
      method: 'POST',
    }),

  // Compliance
  checkConsent: (userId: string, channel: string) =>
    apiRequest(`/compliance/consent/${userId}/${channel}`),

  grantConsent: (data: { user_id: string; channel: string }) =>
    apiRequest('/compliance/consent', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  optOut: (data: { phone: string }) =>
    apiRequest('/compliance/opt-out', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Membership
  createCheckout: (plan: string) =>
    apiRequest('/membership/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),

  // Media Upload
  uploadMedia: async (jobId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await fetch(`${API_BASE}/jobs/${jobId}/media`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Upload failed');
    }

    return response.json();
  },
};
```

---

## 🔐 Phase 2: Auth Integration

### Update Backend Auth Routes

Create `backend/app/routers/auth.py`:

```python
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str
    role: str  # contractor, homeowner, insurer

@router.post("/login")
async def login(req: LoginRequest, response: Response):
    # TODO: Implement bcrypt password check
    # For now, mock auth
    if req.email and req.password:
        token = f"mock_token_{req.email}"
        response.set_cookie("session_token", token, httponly=True)
        return {
            "token": token,
            "user": {
                "email": req.email,
                "role": "contractor"  # Mock
            }
        }
    raise HTTPException(400, "Invalid credentials")

@router.post("/signup")
async def signup(req: SignupRequest):
    # TODO: Implement user creation in database
    return {
        "user": {
            "email": req.email,
            "role": req.role
        }
    }
```

### Wire to Main App

Update `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import compliance, auth  # Add auth

app = FastAPI(title="Disaster Direct API")

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.repl.co"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(compliance.router)

# ... rest of your setup
```

### Connect Frontend Login Form

Update `frontend/app/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login(email, password);
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user_role', result.user.role);

      // Redirect based on role
      if (result.user.role === 'contractor') {
        router.push('/contractor/dashboard');
      } else if (result.user.role === 'homeowner') {
        router.push('/homeowner/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Login</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## 💳 Phase 3: Stripe Integration

### Use Replit Stripe Integration

```bash
# Search for Stripe integration
# This will manage API keys securely
```

### Implement Stripe Service

Create `backend/app/services/stripe_svc.py`:

```python
import os
import stripe

class StripeService:
    def __init__(self):
        self.api_key = os.getenv("STRIPE_SECRET_KEY")
        if self.api_key:
            stripe.api_key = self.api_key
            self.enabled = True
        else:
            self.enabled = False
    
    async def create_checkout_session(self, plan: str, customer_email: str):
        if not self.enabled:
            return {"mock": True, "url": "https://checkout.stripe.com/mock"}
        
        prices = {
            "one_time": "price_xxx",  # Replace with real price IDs
            "monthly": "price_yyy"
        }
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': prices.get(plan, prices['one_time']),
                'quantity': 1,
            }],
            mode='subscription' if plan == 'monthly' else 'payment',
            success_url='https://your-app.com/success',
            cancel_url='https://your-app.com/cancel',
            customer_email=customer_email,
        )
        
        return {"url": session.url}
```

### Add Membership Router

Create `backend/app/routers/membership.py`:

```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.deps import get_stripe

router = APIRouter(prefix="/membership", tags=["membership"])

class CheckoutRequest(BaseModel):
    plan: str
    email: str

@router.post("/checkout")
async def create_checkout(req: CheckoutRequest, stripe=Depends(get_stripe)):
    session = await stripe.create_checkout_session(req.plan, req.email)
    return session
```

---

## 📄 Phase 3: PDF Report Generation

### Install PDF Library

Add to `backend/requirements.txt`:

```
reportlab==4.0.7
```

### Create Report Service

Create `backend/app/services/reports_svc.py`:

```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io

class ReportsService:
    async def generate_insurer_report(self, claim_id: str, data: dict):
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        # Header
        c.setFont("Helvetica-Bold", 16)
        c.drawString(100, 750, f"Insurance Claim Report - {claim_id}")
        
        # Cost Comparables
        c.setFont("Helvetica-Bold", 12)
        c.drawString(100, 700, "Cost Analysis")
        c.setFont("Helvetica", 10)
        c.drawString(100, 680, f"Contractor Requested: ${data.get('requested', 0):,.2f}")
        c.drawString(100, 665, f"Xactimate Estimate: ${data.get('xactimate', 0):,.2f}")
        c.drawString(100, 650, f"Delta: {data.get('delta_percent', 0)}%")
        
        # AI Narrative
        c.setFont("Helvetica-Bold", 12)
        c.drawString(100, 620, "AI Analysis")
        c.setFont("Helvetica", 10)
        
        # Word wrap the narrative
        narrative = data.get('narrative', 'No analysis available')
        lines = self._wrap_text(narrative, 80)
        y = 600
        for line in lines[:15]:  # Max 15 lines
            c.drawString(100, y, line)
            y -= 15
        
        # Media List
        c.setFont("Helvetica-Bold", 12)
        c.drawString(100, y - 30, "Attached Media")
        c.setFont("Helvetica", 10)
        
        media = data.get('media', [])
        y = y - 50
        for i, item in enumerate(media[:10], 1):
            c.drawString(100, y, f"{i}. {item.get('filename', 'Unknown')} - {item.get('type', 'image')}")
            y -= 15
        
        c.save()
        buffer.seek(0)
        return buffer
    
    def _wrap_text(self, text: str, width: int) -> list:
        words = text.split()
        lines = []
        current = []
        length = 0
        
        for word in words:
            if length + len(word) + 1 > width:
                lines.append(' '.join(current))
                current = [word]
                length = len(word)
            else:
                current.append(word)
                length += len(word) + 1
        
        if current:
            lines.append(' '.join(current))
        
        return lines
```

### Add Report Endpoint

Create `backend/app/routers/claims.py`:

```python
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.deps import get_reports

router = APIRouter(prefix="/claims", tags=["claims"])

@router.get("/{claim_id}/report")
async def generate_report(claim_id: str, reports=Depends(get_reports)):
    # TODO: Fetch claim data from database
    mock_data = {
        "requested": 12500,
        "xactimate": 10625,
        "delta_percent": 15,
        "narrative": "Analysis shows contractor estimate is within industry standards...",
        "media": [
            {"filename": "roof_damage_1.jpg", "type": "image"},
            {"filename": "roof_damage_2.jpg", "type": "image"}
        ]
    }
    
    pdf_buffer = await reports.generate_insurer_report(claim_id, mock_data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=claim_{claim_id}.pdf"}
    )
```

---

## 🔄 Dependency Injection Updates

Update `backend/app/deps.py`:

```python
import os
from app.services.twilio_svc import TwilioService
from app.services.compliance_svc import ComplianceService
from app.services.templates_svc import TemplatesService
from app.services.stripe_svc import StripeService
from app.services.reports_svc import ReportsService

class Dependencies:
    def __init__(self):
        # Existing services
        self.twilio = TwilioService()
        self.compliance = ComplianceService()
        self.msg = TemplatesService()
        
        # New services
        self.stripe = StripeService()
        self.reports = ReportsService()
        
        # LLM (existing)
        self.llm = self._init_llm()
    
    def _init_llm(self):
        if os.getenv("OPENAI_API_KEY"):
            from openai import OpenAI
            return OpenAI().chat.completions.create
        elif os.getenv("ANTHROPIC_API_KEY"):
            from anthropic import Anthropic
            return Anthropic().messages.create
        return None

deps = Dependencies()

# FastAPI dependency injection
def get_stripe():
    return deps.stripe

def get_reports():
    return deps.reports

def get_compliance():
    return deps.compliance
```

---

## 🧪 Testing the Integration

### 1. Test Auth Flow

```bash
# Terminal 1: Start backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Test login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'
```

### 2. Test Frontend Connection

```bash
# Terminal 3: Start Next.js
cd frontend
npm run dev

# Open http://localhost:3000/login
# Try logging in
```

### 3. Test Compliance

```bash
curl -X POST http://localhost:8000/compliance/consent \
  -H "Content-Type: application/json" \
  -d '{"user_id": "123", "channel": "sms"}'
```

### 4. Test PDF Generation

```bash
curl http://localhost:8000/claims/CLM-123/report -o test_report.pdf
```

---

## 📊 Production Checklist

Before going live:

- [ ] Extract Next.js frontend from ZIP
- [ ] Configure production environment variables
- [ ] Set up Replit Stripe integration
- [ ] Implement real database storage (replace mocks)
- [ ] Add JWT authentication (replace mock tokens)
- [ ] Test all auth flows (login, signup, logout)
- [ ] Test consent/opt-out workflows
- [ ] Test membership checkout
- [ ] Test PDF generation with real data
- [ ] Deploy to production (Replit Autoscale)

---

## 🚀 Quick Start Commands

```bash
# 1. Extract frontend (manual - see Step 1)

# 2. Install backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Install frontend
cd ../frontend
npm install

# 4. Run backend (Terminal 1)
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 5. Run frontend (Terminal 2)
cd frontend
npm run dev

# 6. Open browser
# Frontend: http://localhost:3000
# Backend API docs: http://localhost:8000/docs
```

---

## 📚 Next Steps

1. **Extract the ZIP** - Get your Next.js frontend into the project
2. **Install dependencies** - Run npm install in frontend/
3. **Configure .env** - Set API_URL and other secrets
4. **Test login flow** - Verify frontend → backend auth works
5. **Add Stripe** - Set up membership checkout
6. **Wire dashboards** - Connect contractor/homeowner views to APIs
7. **Generate PDFs** - Test insurer report generation
8. **Deploy!** - Ship to production on Replit

---

**Ready to start?** Extract the ZIP and let's wire everything together! 🚀
