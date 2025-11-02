# Disaster Direct - Security Implementation Guide

## Current State (MVP Demo)
All 25+ workflow endpoints are **FUNCTIONAL** but **UNAUTHENTICATED** for demo purposes.

## CRITICAL: Production Security Requirements

### 1. Authentication Middleware
**Status:** Middleware created at `server/middleware/auth.ts`  
**Implementation:** Session-based auth using Express sessions + PostgreSQL store

```typescript
import { requireAuth, requireRole, verifyOwnership } from '../middleware/auth';

// Protected route example:
router.post('/jobs', requireAuth, async (req: AuthRequest, res) => {
  // req.userId and req.userRole available
});

// Role-based example:
router.post('/contractor/profile', requireAuth, requireRole('contractor'), ...);
```

### 2. Endpoint Security Matrix

| Endpoint | Auth Required | Role | Ownership Check |
|----------|--------------|------|-----------------|
| POST /auth/signup | No | - | - |
| POST /auth/login | No | - | - |
| POST /membership/checkout | Yes | Any | Self only |
| POST /membership/webhook | No (Stripe sig) | - | - |
| POST /contractor/profile | Yes | contractor | Self only |
| GET /contractor/profile/:userId | Yes | Any | Self/admin |
| POST /contractor/contracts/* | Yes | contractor | - |
| POST /properties | Yes | homeowner | Self only |
| GET /properties/:id | Yes | Any | Owner/linked contractor/admin |
| POST /jobs | Yes | Any | homeownerId must match |
| GET /jobs/:id | Yes | Any | homeowner/contractor on job |
| PATCH /jobs/:id/status | Yes | contractor | contractorId on job |
| POST /jobs/:id/media | Yes | contractor | contractorId on job |
| POST /jobs/:id/analyze | Yes | contractor | contractorId on job |
| POST /jobs/:id/invoice | Yes | contractor | contractorId on job |
| GET /invoices/:id | Yes | Any | Related to job |
| PATCH /invoices/:id/status | Yes | contractor | contractorId on job |
| POST /invoices/:id/* | Yes | contractor | contractorId on job |
| POST /jobs/:id/contract/sign | Yes | Any | homeowner/contractor on job |

### 3. Stripe Webhook Security
**Issue:** Webhook route requires raw body for signature verification

**Fix Required in `server/index.ts`:**
```typescript
import express from 'express';

// BEFORE general JSON parser:
app.post(
  '/api/membership/webhook',
  express.raw({ type: 'application/json' }),
  workflowRoutes
);

// THEN add JSON parser for other routes:
app.use(express.json());
app.use('/api', workflowRoutes);
```

### 4. State Transition Validation
**Current:** Accepts any status change  
**Required:** Enforce valid state machine transitions

```typescript
const validTransitions = {
  job: {
    'lead': ['in_progress'],
    'in_progress': ['complete'],
    'complete': ['invoiced'],
    'invoiced': ['paid']
  },
  invoice: {
    'draft': ['sent'],
    'sent': ['disputed', 'approved'],
    'disputed': ['sent', 'approved'],
    'approved': ['paid']
  }
};

// Validate before update:
function canTransition(entity: 'job'|'invoice', from: string, to: string): boolean {
  return validTransitions[entity][from]?.includes(to) ?? false;
}
```

### 5. Ownership Verification Pattern
```typescript
router.patch('/jobs/:id/status', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  // Get job to verify ownership
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Verify contractor owns this job
  if (job.contractorId !== req.userId && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Proceed with status update...
});
```

## Implementation Priority (Production)

### Phase 1: Critical Security (1-2 days)
- [ ] Add `requireAuth` to all protected endpoints
- [ ] Configure raw body handling for Stripe webhook
- [ ] Add role-based authorization to contractor-only endpoints

### Phase 2: Data Protection (2-3 days)
- [ ] Implement ownership verification for all resource access
- [ ] Add state transition validation for jobs/invoices
- [ ] Add audit logging for sensitive operations

### Phase 3: Production Hardening (1-2 days)
- [ ] Rate limiting on authentication endpoints
- [ ] CSRF protection for state-changing operations
- [ ] Input sanitization and validation
- [ ] Error message sanitization (don't leak internal details)

## Testing Security
```bash
# Test authentication:
curl -X POST http://localhost:5000/api/jobs # Should return 401

# Login first:
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password"}'

# Then use session:
curl -b cookies.txt -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"homeownerId":"user-123",...}' # Should succeed

# Test ownership:
curl -b cookies.txt -X GET http://localhost:5000/api/jobs/other-user-job-id
# Should return 403 Forbidden
```

## Notes
- Session store already configured (PostgreSQL via connect-pg-simple)
- Auth middleware ready at `server/middleware/auth.ts`
- Login endpoint sets `session.userId` and `session.userRole`
- All endpoints currently functional but need auth added

---
**MVP Demo Status:** ✅ All endpoints working  
**Production Ready:** ❌ Security implementation required  
**Estimated Security Implementation Time:** 4-7 days
