# Compliance & Safety Guardrails

## Overview
Disaster Direct Python FastAPI backend implements comprehensive compliance and safety guardrails for TCPA/CTIA regulations, privacy protection, and legal safeguards.

---

## 1️⃣ Consent Management (TCPA/CTIA)

### Implementation
- **Service**: `app/services/compliance_svc.py`
- **Agents**: `DispatchAgent` checks consent before every SMS
- **Router**: `/compliance/consent`, `/compliance/opt-out`

### Features
✅ **Opt-in Required**: No SMS/voice without explicit consent  
✅ **Audit Trail**: All consent logged with timestamp, IP, channel  
✅ **One-Click Opt-Out**: STOP keyword handler  
✅ **Multi-Channel**: Separate consent for SMS, voice, email  

### Usage
```python
# Check consent before messaging
has_consent = await deps.compliance.check_consent(user_id, "sms")

# Log consent
await deps.compliance.log_consent(user_id, "sms", True)

# Handle opt-out
await deps.compliance.handle_opt_out(user_id, "sms")
```

### API Endpoints
```bash
# Grant consent
POST /compliance/consent
{"user_id": "123", "channel": "sms", "opted_in": true}

# Check consent
GET /compliance/consent/{user_id}/sms

# Opt-out (STOP keyword)
POST /compliance/opt-out
{"user_id": "123", "channel": "sms"}
```

---

## 2️⃣ Rate Limiting & Quiet Hours

### Implementation
- **Service**: `ComplianceService.is_quiet_hours()`
- **Agent**: `DispatchAgent` respects quiet hours before SMS

### Features
✅ **Quiet Hours**: 9 PM - 8 AM local time  
✅ **Timezone Aware**: Respects contractor location  
✅ **No Spam**: Checks before every broadcast  

### Usage
```python
# Check quiet hours by timezone
if self.compliance.is_quiet_hours(contractor.timezone):
    print("⏰ Skipping - quiet hours")
    continue
```

### API Endpoint
```bash
GET /compliance/quiet-hours?timezone=America/New_York
# Returns: {"is_quiet_hours": true, "message": "Messaging paused (8 PM - 8 AM)"}
```

---

## 3️⃣ Privacy & Data Minimization

### Implementation
- **Service**: `ComplianceService.minimal_data_policy()`

### Features
✅ **Minimal Storage**: Only essential fields stored  
✅ **Encryption at Rest**: Database encryption enabled  
✅ **Permitted Sources Only**: Property data from authorized APIs  
✅ **Auto-Redaction**: SSN, DOB, credit cards redacted  

### Allowed Fields
- `name`, `address`, `phone`, `email`, `property_id`

### Redacted Fields
- `ssn`, `dob`, `credit_card`, `bank_account`

### Usage
```python
# Filter and redact data before storage
clean_data = deps.compliance.minimal_data_policy(raw_data)
```

---

## 4️⃣ AOB (Assignment of Benefits) Awareness

### Implementation
- **Service**: `ComplianceService.check_aob_allowed()`
- **Agent**: `LegalAgent` validates and blocks AOB in prohibited states

### Prohibited States
❌ Texas (TX)  
❌ Louisiana (LA)  
❌ South Carolina (SC)  
❌ Oklahoma (OK)  
❌ Kentucky (KY)  

### Features
✅ **Pre-Signature Alert**: Contractor warned before signing  
✅ **Auto-Block**: AOB clause removed in prohibited states  
✅ **Contract Validation**: Rejects contracts with illegal AOB  

### Usage
```python
# Check AOB status
aob_check = self.compliance.check_aob_allowed("FL")
# Returns: {"allowed": True, "message": "AOB permitted in FL"}

aob_check = self.compliance.check_aob_allowed("TX")
# Returns: {"allowed": False, "message": "AOB PROHIBITED in TX", "action": "block_aob_and_alert"}
```

### API Endpoint
```bash
POST /compliance/aob-check
{"state": "TX"}
# Returns: {"allowed": false, "action": "block_aob_and_alert"}
```

---

## 5️⃣ No Statute Invention

### Implementation
- **Service**: `ComplianceService.validate_statute_citation()`
- **Agent**: `LegalAgent` instructed to cite only verified standards

### Features
✅ **Known Sources Only**: Validates against known statute URLs  
✅ **Source Linking**: Returns official statute URL  
✅ **LLM Instruction**: "DO NOT invent statutes"  

### Verified Sources
- FL Stat § 713 (Lien Law)
- TX Prop Code § 53 (Lien Law)
- OSHA 1926 (Construction Safety)

### Usage
```python
# Validate statute citation
result = await deps.compliance.validate_statute_citation("FL Stat § 713")
# Returns: {"valid": True, "source_url": "https://www.flsenate.gov/Laws/Statutes/2024/Chapter713"}

result = await deps.compliance.validate_statute_citation("Made Up Law § 999")
# Returns: {"valid": False, "warning": "⚠️ Unverified statute"}
```

### API Endpoint
```bash
POST /compliance/validate-statute
{"citation": "FL Stat § 713"}
# Returns: {"valid": true, "source_url": "..."}
```

---

## 6️⃣ Human-in-the-Loop (High-Risk Actions)

### Implementation
- **Service**: `ComplianceService.escalate_high_risk()`
- **Router**: `/compliance/escalate`, `/compliance/lien-deadline`

### High-Risk Actions
⚠️ **Lien Filing**  
⚠️ **Lawsuit Initiation**  
⚠️ **Foreclosure**  
⚠️ **Contract Termination**  

### Features
✅ **Auto-Escalation**: High-risk actions flagged for human review  
✅ **Context Capture**: Full context provided for review  
✅ **No Auto-Approval**: Requires explicit human confirmation  

### Usage
```python
# Check if action requires escalation
result = await deps.compliance.escalate_high_risk("lien_filing", {
    "job_id": 123,
    "state": "FL",
    "amount": 15000
})

# Returns:
{
    "escalated": True,
    "action": "lien_filing",
    "requires_human": True,
    "message": "⚠️ High-risk action 'lien_filing' requires human approval",
    "context": {...}
}
```

### API Endpoint
```bash
POST /compliance/escalate?action=lien_filing
{"job_id": 123, "state": "FL", "amount": 15000}

# Returns escalation with human approval requirement
```

---

## Implementation Status

### ✅ Complete
1. ✅ Compliance Service (`app/services/compliance_svc.py`)
2. ✅ Consent Management (opt-in, opt-out, audit trail)
3. ✅ Quiet Hours & Rate Limiting
4. ✅ AOB State Validation
5. ✅ Statute Citation Validation
6. ✅ High-Risk Action Escalation
7. ✅ Privacy & Data Minimization
8. ✅ Compliance Router (`app/routers/compliance.py`)
9. ✅ DispatchAgent Integration (consent + quiet hours)
10. ✅ LegalAgent Integration (AOB checking)

### 📊 API Endpoints
- `POST /compliance/consent` - Grant/revoke consent
- `POST /compliance/opt-out` - One-click opt-out
- `GET /compliance/consent/{user_id}/{channel}` - Check consent
- `GET /compliance/quiet-hours` - Check quiet hours
- `POST /compliance/aob-check` - Validate AOB by state
- `POST /compliance/validate-statute` - Verify statute citations
- `POST /compliance/escalate` - Escalate high-risk actions
- `POST /compliance/lien-deadline` - Calculate lien deadline (with escalation)

---

## Security & Privacy

### Encryption at Rest
- PostgreSQL database encryption enabled
- Sensitive fields (SSN, DOB) auto-redacted

### Data Retention
- Consent logs: 7 years (TCPA requirement)
- Property data: Minimal retention, deleted after job completion
- User data: Deleted upon request (GDPR/CCPA)

### Access Control
- Role-based access to high-risk operations
- Audit trail for all compliance actions

---

## Testing Compliance

### Test Consent Flow
```bash
# 1. Check consent (should be false initially)
curl -X GET http://localhost:8000/compliance/consent/user123/sms

# 2. Grant consent
curl -X POST http://localhost:8000/compliance/consent \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123", "channel": "sms", "opted_in": true}'

# 3. Verify consent
curl -X GET http://localhost:8000/compliance/consent/user123/sms

# 4. Opt-out
curl -X POST http://localhost:8000/compliance/opt-out \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123", "channel": "sms"}'
```

### Test AOB Validation
```bash
# Allowed state
curl -X POST http://localhost:8000/compliance/aob-check \
  -H "Content-Type: application/json" \
  -d '{"state": "FL"}'
# Returns: {"allowed": true}

# Prohibited state
curl -X POST http://localhost:8000/compliance/aob-check \
  -H "Content-Type: application/json" \
  -d '{"state": "TX"}'
# Returns: {"allowed": false, "action": "block_aob_and_alert"}
```

### Test High-Risk Escalation
```bash
curl -X POST http://localhost:8000/compliance/escalate?action=lien_filing \
  -H "Content-Type: application/json" \
  -d '{"job_id": 123, "state": "FL"}'
# Returns: {"escalated": true, "requires_human": true}
```

---

## Legal Disclaimer

This compliance system implements industry best practices and regulatory requirements as of November 2025. Consult with legal counsel to ensure full compliance with:

- Telephone Consumer Protection Act (TCPA)
- CTIA Messaging Principles
- State-specific AOB laws
- Data privacy regulations (GDPR, CCPA)
- Construction lien laws by state

**Note**: Compliance rules and regulations change frequently. Review and update this system regularly.
