# Message Templates Guide

## Overview
The `TemplatesService` provides 13 professional message templates for the complete Lead → Job → Claim → Payment workflow.

---

## 📱 SMS Templates (4)

### 1. Storm Lead Alert
**Template**: `storm_lead`  
**Use**: Notify contractors of storm opportunities

```python
msg = deps.templates.render("storm_lead", {
    "region": "Miami-Dade, FL",
    "parcels": [
        {"address": "123 Main St"},
        {"address": "456 Oak Ave"}
    ]
})
```

**Output**:
```
🚨 Storm Alert: Miami-Dade, FL - 2 affected properties. Reply YES for leads.
```

### 2. Job Opportunity
**Template**: `job_opportunity`  
**Use**: Offer job to contractor

```python
msg = deps.templates.render("job_opportunity", {
    "description": "Emergency roof tarping",
    "address": "123 Main St, Miami, FL"
})
```

**Output**:
```
New Job: Emergency roof tarping at 123 Main St, Miami, FL. Reply YES to accept.
```

### 3. Job Assigned
**Template**: `job_assigned`  
**Use**: Confirm job assignment

```python
msg = deps.templates.render("job_assigned", {
    "job_id": 12345,
    "address": "123 Main St, Miami, FL"
})
```

**Output**:
```
Job #12345 assigned. Address: 123 Main St, Miami, FL. Contact homeowner ASAP.
```

### 4. Payment Reminder (SMS)
**Template**: `payment_reminder`  
**Use**: Quick payment reminder

```python
msg = deps.templates.render("payment_reminder", {
    "invoice_id": "INV-001",
    "amount": 12500.00
})
```

**Output**:
```
💰 Payment Due: Invoice #INV-001 for $12,500.00. Pay now to avoid delays.
```

---

## 📧 Email Templates - Payment Reminders (3)

### 5. Day 30 Reminder (Polite)
**Template**: `reminder_day_30`  
**Use**: First payment reminder

```python
email = deps.templates.render("reminder_day_30", {
    "invoice_id": "INV-001",
    "amount": 12500.00,
    "homeowner_name": "John Smith",
    "contractor_name": "ProStorm Contractors",
    "completion_date": "2024-10-15",
    "due_date": "2024-11-15",
    "work_description": "Emergency roof repairs",
    "payment_link": "https://pay.example.com/inv-001",
    "contractor_address": "123 Business St, Miami, FL",
    "contractor_email": "billing@prostorm.com",
    "contractor_phone": "(305) 555-1234"
})
```

### 6. Day 60 Reminder (Firm)
**Template**: `reminder_day_60`  
**Use**: Escalated payment reminder with late fees

```python
email = deps.templates.render("reminder_day_60", {
    "invoice_id": "INV-001",
    "amount": 12500.00,
    "late_fee": 625.00,  # 5% late fee
    "homeowner_name": "John Smith",
    "contractor_name": "ProStorm Contractors"
})
```

### 7. Day 90 Reminder (Final Notice)
**Template**: `reminder_day_90`  
**Use**: Final notice before legal action

```python
email = deps.templates.render("reminder_day_90", {
    "invoice_id": "INV-001",
    "amount": 12500.00,
    "late_fee": 625.00,
    "interest": 312.50,
    "homeowner_name": "John Smith",
    "contractor_name": "ProStorm Contractors",
    "state": "FL",
    "lien_deadline": "2025-01-15"
})
```

---

## 📄 Legal Templates (3)

### 8. Lien Warning
**Template**: `lien_warning`  
**Use**: Notice of Intent to File Mechanics Lien

```python
email = deps.templates.render("lien_warning", {
    "homeowner_name": "John Smith",
    "property_address": "123 Main St, Miami, FL 33101",
    "amount": 12500.00,
    "state": "FL",
    "work_description": "Emergency roof repairs",
    "completion_date": "2024-10-15",
    "invoice_date": "2024-10-20",
    "days_overdue": 90,
    "lien_deadline": "2025-01-15",
    "payment_deadline": "2024-12-25",
    "contractor_name": "ProStorm Contractors",
    "contractor_license": "CGC1234567",
    "contractor_address": "123 Business St, Miami, FL",
    "contractor_phone": "(305) 555-1234",
    "attorney_name": "Jane Doe, Esq."
})
```

### 9. Demand Letter
**Template**: `demand_letter`  
**Use**: Formal legal demand (pre-lawsuit)

```python
email = deps.templates.render("demand_letter", {
    "homeowner_name": "John Smith",
    "property_address": "123 Main St, Miami, FL 33101",
    "invoice_id": "INV-001",
    "amount": 12500.00,
    "late_fee": 625.00,
    "interest": 312.50,
    "legal_fees": 1500.00,
    "total_due": 14937.50,
    "contractor_name": "ProStorm Contractors",
    "attorney_name": "Jane Doe, Esq.",
    "attorney_firm": "Construction Law Group",
    "attorney_address": "456 Legal Plaza, Miami, FL"
})
```

### 10. AOB Notice
**Template**: `aob_notice`  
**Use**: Assignment of Benefits notification to insurer

```python
email = deps.templates.render("aob_notice", {
    "homeowner_name": "John Smith",
    "property_address": "123 Main St, Miami, FL 33101",
    "insurance_company": "State Farm Insurance",
    "policy_number": "POL-123456",
    "contractor_name": "ProStorm Contractors",
    "contractor_license": "CGC1234567",
    "contractor_address": "123 Business St, Miami, FL",
    "work_description": "Emergency roof repairs",
    "loss_date": "2024-09-28",
    "claim_number": "CLM-789",
    "amount": 12500.00,
    "aob_date": "2024-10-01",
    "state": "FL",
    "contractor_email": "claims@prostorm.com",
    "contractor_phone": "(305) 555-1234"
})
```

---

## 💼 Insurance Templates (1)

### 11. Claim Status Request
**Template**: `claim_status_request`  
**Use**: Follow up with insurance adjuster

```python
email = deps.templates.render("claim_status_request", {
    "claim_number": "CLM-2024-789",
    "property_address": "123 Main St, Miami, FL 33101",
    "adjuster_name": "Sarah Johnson",
    "invoice_id": "INV-001",
    "contractor_name": "ProStorm Contractors",
    "contractor_email": "claims@prostorm.com",
    "contractor_phone": "(305) 555-1234"
})
```

**Output**:
```
Subject: Status Request – Claim #CLM-2024-789 for 123 Main St, Miami, FL 33101

Hello Sarah Johnson,

We are following up regarding the above claim. Mitigation and repairs were performed to prevent further loss and restore habitability. Please advise status of payment for Invoice INV-001. Supporting documentation is attached.

Thank you,
ProStorm Contractors
claims@prostorm.com
(305) 555-1234

---
Attachments:
- Invoice #INV-001
- Work completion photos
- Signed work authorization
- Damage assessment report
```

---

## 🎉 Success Templates (1)

### 12. Payment Received
**Template**: `payment_received`  
**Use**: Thank you for payment

```python
email = deps.templates.render("payment_received", {
    "homeowner_name": "John Smith",
    "amount": 12500.00,
    "payment_date": "2024-12-01",
    "invoice_id": "INV-001",
    "payment_method": "Credit Card",
    "remaining_balance": 0,
    "contractor_name": "ProStorm Contractors",
    "contractor_phone": "(305) 555-1234"
})
```

---

## 🔧 Using Templates in Agents

### Example: Claims Agent sends adjuster follow-up

```python
class ClaimAgent:
    def __init__(self, deps):
        self.templates = deps.templates
        self.msg = deps.msg
    
    async def send_adjuster_followup(self, claim):
        # Render template
        email = self.templates.render("claim_status_request", {
            "claim_number": claim.claim_number,
            "property_address": claim.property_address,
            "adjuster_name": claim.adjuster_name,
            "invoice_id": claim.invoice_id,
            "contractor_name": "ProStorm Contractors",
            "contractor_email": "claims@prostorm.com",
            "contractor_phone": "(305) 555-1234"
        })
        
        # Send email
        await self.msg.send_email(
            to=claim.adjuster_email,
            subject=f"Status Request – Claim #{claim.claim_number}",
            body=email
        )
```

### Example: Finance Agent sends payment reminders

```python
class FinanceAgent:
    def __init__(self, deps):
        self.templates = deps.templates
        self.msg = deps.msg
        self.db = deps.db
    
    async def send_payment_reminder(self, invoice):
        days_overdue = (datetime.now() - invoice.due_date).days
        
        # Choose template based on days overdue
        if days_overdue <= 30:
            template = "reminder_day_30"
        elif days_overdue <= 60:
            template = "reminder_day_60"
        else:
            template = "reminder_day_90"
        
        # Render email
        email = self.templates.render(template, {
            "invoice_id": invoice.id,
            "amount": invoice.amount,
            "late_fee": invoice.late_fee,
            "homeowner_name": invoice.homeowner_name,
            "contractor_name": "ProStorm Contractors"
        })
        
        # Send
        await self.msg.send_email(
            to=invoice.homeowner_email,
            subject=f"Payment {'Reminder' if days_overdue <= 60 else 'FINAL NOTICE'} - Invoice #{invoice.id}",
            body=email
        )
```

---

## 🚀 API Endpoint Example

Create a router endpoint to send templates:

```python
from fastapi import APIRouter
from pydantic import BaseModel
from app.deps import build_dependencies

router = APIRouter()
deps = build_dependencies()


class SendTemplateRequest(BaseModel):
    template_name: str
    context: dict
    recipient_email: str


@router.post("/templates/send")
async def send_template(req: SendTemplateRequest):
    # Render template
    content = deps.templates.render(req.template_name, req.context)
    
    # Send email
    await deps.msg.send_email(
        to=req.recipient_email,
        subject=f"Message from {req.context.get('contractor_name', 'Contractor')}",
        body=content
    )
    
    return {"sent": True, "template": req.template_name}
```

---

## 📊 Complete Template List

| # | Template Name | Type | Use Case |
|---|---------------|------|----------|
| 1 | `storm_lead` | SMS | Contractor storm alerts |
| 2 | `job_opportunity` | SMS | Job offers |
| 3 | `job_assigned` | SMS | Job confirmations |
| 4 | `payment_reminder` | SMS | Quick payment reminder |
| 5 | `reminder_day_30` | Email | Polite payment reminder |
| 6 | `reminder_day_60` | Email | Firm payment notice |
| 7 | `reminder_day_90` | Email | Final notice (pre-legal) |
| 8 | `lien_warning` | Email | Notice of Intent to file lien |
| 9 | `demand_letter` | Email | Formal legal demand |
| 10 | `aob_notice` | Email | AOB notification to insurer |
| 11 | `claim_status_request` | Email | Adjuster follow-up |
| 12 | `payment_received` | Email | Payment thank you |

---

## 🎯 Workflow Integration

### Complete Payment Workflow
```
Day 0: Job completed → Invoice sent
Day 30: reminder_day_30 (polite)
Day 60: reminder_day_60 (firm, late fees)
Day 90: reminder_day_90 (final notice)
Day 100: lien_warning (intent to file lien)
Day 110: demand_letter (attorney demand)
Day 120: File lien / Collections
```

### Insurance Claim Workflow
```
Day 0: Work completed → AOB signed
Day 1: aob_notice sent to insurer
Day 7: claim_status_request (first follow-up)
Day 14: claim_status_request (second follow-up)
Day 21: Escalate to negotiator agent
Day 30: Final demand for payment
```

---

**All templates are production-ready and compliance-aware!** 🎉
