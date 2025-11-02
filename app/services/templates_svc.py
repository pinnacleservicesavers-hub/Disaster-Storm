from datetime import datetime, timedelta
from typing import Dict, Any


class TemplatesService:
    """Message templates for various stages of the workflow"""
    
    def __init__(self):
        self.templates = {
            # SMS Templates
            "storm_lead": self._storm_lead,
            "job_opportunity": self._job_opportunity,
            "job_assigned": self._job_assigned,
            "payment_reminder": self._payment_reminder,
            
            # Email Templates
            "reminder_day_30": self._reminder_day_30,
            "reminder_day_60": self._reminder_day_60,
            "reminder_day_90": self._reminder_day_90,
            "lien_warning": self._lien_warning,
            "payment_received": self._payment_received,
            
            # Legal Templates
            "demand_letter": self._demand_letter,
            "aob_notice": self._aob_notice,
            
            # Insurance Templates
            "claim_status_request": self._claim_status_request,
            "insurance_demand": self._insurance_demand,
        }
    
    def render(self, template_name: str, context: Dict[str, Any]) -> str:
        """Render template with context"""
        if template_name not in self.templates:
            return f"Template '{template_name}' not found"
        
        return self.templates[template_name](context)
    
    # SMS Templates
    def _storm_lead(self, ctx: Dict[str, Any]) -> str:
        return (
            f"🚨 Storm Alert: {ctx.get('region', 'Unknown')} - "
            f"{len(ctx.get('parcels', []))} affected properties. "
            f"Reply YES for leads."
        )
    
    def _job_opportunity(self, ctx: Dict[str, Any]) -> str:
        return (
            f"New Job: {ctx.get('description', 'Job available')} "
            f"at {ctx.get('address', 'location TBD')}. "
            f"Reply YES to accept."
        )
    
    def _job_assigned(self, ctx: Dict[str, Any]) -> str:
        return (
            f"Job #{ctx.get('job_id')} assigned. "
            f"Address: {ctx.get('address')}. "
            f"Contact homeowner ASAP."
        )
    
    def _payment_reminder(self, ctx: Dict[str, Any]) -> str:
        amount = ctx.get('amount', 0)
        return (
            f"💰 Payment Due: Invoice #{ctx.get('invoice_id')} "
            f"for ${amount:,.2f}. Pay now to avoid delays."
        )
    
    # Email Templates
    def _reminder_day_30(self, ctx: Dict[str, Any]) -> str:
        """Day 30 Payment Reminder (Polite)"""
        invoice_id = ctx.get('invoice_id', 'N/A')
        amount = ctx.get('amount', 0)
        homeowner = ctx.get('homeowner_name', 'Homeowner')
        contractor = ctx.get('contractor_name', 'Your Contractor')
        date_completed = ctx.get('completion_date', 'N/A')
        
        return f"""Subject: Payment Reminder - Invoice #{invoice_id}

Dear {homeowner},

We hope you're satisfied with the emergency repairs completed on {date_completed}.

This is a friendly reminder that Invoice #{invoice_id} for ${amount:,.2f} is now 30 days past due.

Invoice Details:
- Amount Due: ${amount:,.2f}
- Original Due Date: {ctx.get('due_date', 'N/A')}
- Work Completed: {ctx.get('work_description', 'Emergency storm repairs')}

Payment Options:
1. Online: {ctx.get('payment_link', 'https://pay.example.com')}
2. Check: Mail to {contractor}, {ctx.get('contractor_address', 'Address on file')}
3. Phone: Call {ctx.get('contractor_phone', '(555) 123-4567')} to arrange payment

If you've already submitted payment, please disregard this notice and accept our thanks.

If you have questions about this invoice, please contact us immediately.

Best regards,
{contractor}
{ctx.get('contractor_email', 'billing@example.com')}
{ctx.get('contractor_phone', '(555) 123-4567')}

---
This is an automated reminder. Your satisfaction is our priority.
"""
    
    def _reminder_day_60(self, ctx: Dict[str, Any]) -> str:
        """Day 60 Payment Reminder (Firm)"""
        invoice_id = ctx.get('invoice_id', 'N/A')
        amount = ctx.get('amount', 0)
        homeowner = ctx.get('homeowner_name', 'Homeowner')
        contractor = ctx.get('contractor_name', 'Your Contractor')
        
        return f"""Subject: URGENT: Payment Overdue 60 Days - Invoice #{invoice_id}

Dear {homeowner},

Invoice #{invoice_id} for ${amount:,.2f} is now 60 days past due.

Despite our previous reminder, we have not received payment or heard from you regarding this outstanding balance.

Amount Due: ${amount:,.2f}
Days Overdue: 60
Late Fee: ${ctx.get('late_fee', 0):,.2f}
Total Due: ${amount + ctx.get('late_fee', 0):,.2f}

IMMEDIATE ACTION REQUIRED:
We must receive payment within 10 business days to avoid:
- Additional late fees
- Referral to collections
- Potential lien filing on your property
- Impact to your credit rating

Payment Options:
- Online (Fastest): {ctx.get('payment_link', 'https://pay.example.com')}
- Phone: {ctx.get('contractor_phone', '(555) 123-4567')}

If you're experiencing financial hardship, please contact us immediately to discuss payment arrangements. We're here to help find a solution.

Sincerely,
{contractor}
Billing Department
{ctx.get('contractor_email', 'billing@example.com')}
{ctx.get('contractor_phone', '(555) 123-4567')}

---
This is a formal payment demand. Please remit immediately to avoid further action.
"""
    
    def _reminder_day_90(self, ctx: Dict[str, Any]) -> str:
        """Day 90 Payment Reminder (Final Notice)"""
        invoice_id = ctx.get('invoice_id', 'N/A')
        amount = ctx.get('amount', 0)
        homeowner = ctx.get('homeowner_name', 'Homeowner')
        contractor = ctx.get('contractor_name', 'Your Contractor')
        state = ctx.get('state', 'FL')
        
        lien_deadline = ctx.get('lien_deadline', 'within 90 days')
        
        return f"""Subject: FINAL NOTICE - Legal Action Pending - Invoice #{invoice_id}

CERTIFIED MAIL RECOMMENDED

Dear {homeowner},

This is your FINAL NOTICE before legal action.

Invoice #{invoice_id} for ${amount:,.2f} is now 90 days past due. Despite multiple attempts to contact you, this balance remains unpaid.

CURRENT BALANCE DUE:
- Original Amount: ${amount:,.2f}
- Late Fees: ${ctx.get('late_fee', 0):,.2f}
- Interest: ${ctx.get('interest', 0):,.2f}
- TOTAL DUE: ${amount + ctx.get('late_fee', 0) + ctx.get('interest', 0):,.2f}

LEGAL ACTION WILL BE TAKEN IF PAYMENT IS NOT RECEIVED WITHIN 10 DAYS:

1. Mechanics Lien Filing
   - A lien will be placed on your property title
   - You will be unable to sell or refinance until paid
   - Deadline to file: {lien_deadline}
   - Filing fee and legal costs added to balance

2. Collections Referral
   - Account reported to credit bureaus
   - Impact to credit score
   - Additional collection fees

3. Court Action
   - Small claims or civil court filing
   - Potential judgment against you
   - Wage garnishment possible
   - Additional legal fees and court costs

AVOID LEGAL ACTION - PAY NOW:
- Online: {ctx.get('payment_link', 'https://pay.example.com')}
- Certified Check: {ctx.get('contractor_address', 'Address on file')}
- Wire Transfer: Contact {ctx.get('contractor_phone', '(555) 123-4567')}

This is your last opportunity to resolve this matter without legal intervention.

If payment or payment arrangements are not made within 10 days, we will proceed with lien filing and/or collections without further notice.

Legal Department
{contractor}
{ctx.get('contractor_email', 'legal@example.com')}
{ctx.get('contractor_phone', '(555) 123-4567')}

Attorney: {ctx.get('attorney_name', 'Name on File')}
{ctx.get('attorney_firm', 'Law Firm')}

---
FINAL NOTICE - LEGAL ACTION PENDING
Consult with an attorney if you dispute this debt.
This is an attempt to collect a debt. Any information obtained will be used for that purpose.
"""
    
    def _lien_warning(self, ctx: Dict[str, Any]) -> str:
        """Notice of Intent to File Lien"""
        amount = ctx.get('amount', 0)
        homeowner = ctx.get('homeowner_name', 'Property Owner')
        property_address = ctx.get('property_address', 'Property Address')
        state = ctx.get('state', 'FL')
        
        return f"""Subject: NOTICE OF INTENT TO FILE MECHANICS LIEN

CERTIFIED MAIL - SIGNATURE REQUIRED

{homeowner}
{property_address}

Re: Notice of Intent to File Mechanics Lien
    Property: {property_address}
    Amount Due: ${amount:,.2f}

Dear {homeowner},

Pursuant to {state} statutes governing construction liens, this letter serves as formal notice of our intent to file a Mechanics Lien on the above-referenced property.

LIEN DETAILS:
- Amount Due: ${amount:,.2f}
- Work Performed: {ctx.get('work_description', 'Emergency storm repairs')}
- Completion Date: {ctx.get('completion_date', 'N/A')}
- Invoice Date: {ctx.get('invoice_date', 'N/A')}
- Days Overdue: {ctx.get('days_overdue', 90)}

STATUTORY DEADLINE:
Under {state} law, we have until {ctx.get('lien_deadline', 'DATE')} to file this lien. If payment is not received by {ctx.get('payment_deadline', 'DATE')}, we will proceed with filing.

CONSEQUENCES OF LIEN FILING:
1. Cloud on property title
2. Inability to sell or refinance
3. Additional filing fees and legal costs
4. Potential foreclosure action
5. Credit rating impact

AVOID LIEN FILING - IMMEDIATE PAYMENT REQUIRED:
You have 10 days from receipt of this notice to pay the outstanding balance in full to prevent lien filing.

Payment must be made by certified check, wire transfer, or cashier's check to:

{ctx.get('contractor_name', 'Contractor Name')}
{ctx.get('contractor_address', 'Address')}

For wire transfer instructions, call: {ctx.get('contractor_phone', '(555) 123-4567')}

If you believe this claim is in error or wish to dispute the amount, you must notify us in writing within 5 business days.

This is a formal legal notice. Please consult with an attorney immediately.

Sincerely,

{ctx.get('contractor_name', 'Contractor Name')}
License #: {ctx.get('contractor_license', 'N/A')}

cc: County Clerk's Office
    {ctx.get('attorney_name', 'Attorney Name')}

---
NOTICE OF INTENT TO FILE MECHANICS LIEN
This is a legal document. Failure to respond may result in lien filing.
"""
    
    def _demand_letter(self, ctx: Dict[str, Any]) -> str:
        """Formal Demand Letter (Pre-Legal)"""
        return f"""Subject: FORMAL DEMAND FOR PAYMENT

CERTIFIED MAIL

{ctx.get('homeowner_name', 'Property Owner')}
{ctx.get('property_address', 'Address')}

Re: Demand for Payment - Invoice #{ctx.get('invoice_id', 'N/A')}

Dear {ctx.get('homeowner_name', 'Property Owner')}:

DEMAND IS HEREBY MADE for immediate payment of ${ctx.get('amount', 0):,.2f} plus accrued interest and fees.

This law firm represents {ctx.get('contractor_name', 'Contractor')} in connection with unpaid invoices for emergency repairs to your property.

Despite good faith efforts to resolve this matter, you have failed to pay for services rendered.

AMOUNT DUE:
- Principal: ${ctx.get('amount', 0):,.2f}
- Late Fees: ${ctx.get('late_fee', 0):,.2f}
- Interest: ${ctx.get('interest', 0):,.2f}
- Legal Fees: ${ctx.get('legal_fees', 0):,.2f}
- TOTAL: ${ctx.get('total_due', 0):,.2f}

You have TEN (10) DAYS from receipt of this letter to pay in full or contact our office to arrange payment.

Failure to respond will result in:
- Mechanics lien filing
- Small claims or civil court action
- Collections referral
- Credit bureau reporting

Make payment payable to:
{ctx.get('contractor_name', 'Contractor Name')}
c/o {ctx.get('attorney_firm', 'Law Firm')}
{ctx.get('attorney_address', 'Address')}

This is a formal demand. No further notice will be given.

Very truly yours,

{ctx.get('attorney_name', 'Attorney Name')}
{ctx.get('attorney_firm', 'Law Firm')}
Attorney for {ctx.get('contractor_name', 'Contractor')}

---
FORMAL DEMAND FOR PAYMENT
"""
    
    def _aob_notice(self, ctx: Dict[str, Any]) -> str:
        """Assignment of Benefits Notice (for allowed states)"""
        state = ctx.get('state', 'FL')
        
        return f"""NOTICE OF ASSIGNMENT OF BENEFITS

Property Owner: {ctx.get('homeowner_name', 'Name')}
Property Address: {ctx.get('property_address', 'Address')}
Insurance Company: {ctx.get('insurance_company', 'Insurer')}
Policy Number: {ctx.get('policy_number', 'N/A')}

Dear {ctx.get('insurance_company', 'Insurer')}:

This letter serves as formal notice that the above-named property owner has executed an Assignment of Benefits (AOB) in favor of:

{ctx.get('contractor_name', 'Contractor Name')}
License #: {ctx.get('contractor_license', 'N/A')}
{ctx.get('contractor_address', 'Address')}

ASSIGNMENT DETAILS:
- Work Performed: {ctx.get('work_description', 'Emergency storm repairs')}
- Date of Loss: {ctx.get('loss_date', 'N/A')}
- Claim Number: {ctx.get('claim_number', 'N/A')}
- Estimated Amount: ${ctx.get('amount', 0):,.2f}

Pursuant to the signed AOB agreement dated {ctx.get('aob_date', 'N/A')}, the property owner has assigned all rights, benefits, and proceeds under the insurance policy to our company for this claim.

We hereby request that:
1. All communications regarding this claim be directed to our office
2. All claim payments be made payable to {ctx.get('contractor_name', 'Contractor')}
3. We be included in all inspections, negotiations, and settlement discussions

We will be submitting a detailed estimate and supporting documentation under separate cover.

Please acknowledge receipt of this notice and provide the name and contact information for the adjuster assigned to this claim.

Sincerely,

{ctx.get('contractor_name', 'Contractor Name')}
{ctx.get('contractor_email', 'email@example.com')}
{ctx.get('contractor_phone', '(555) 123-4567')}

Enclosures:
- Signed Assignment of Benefits
- Proof of contractor license
- Preliminary damage estimate

---
ASSIGNMENT OF BENEFITS NOTICE - {state}
This assignment is executed in accordance with {state} law.
"""
    
    def _payment_received(self, ctx: Dict[str, Any]) -> str:
        """Payment Receipt/Thank You"""
        return f"""Subject: Payment Received - Thank You!

Dear {ctx.get('homeowner_name', 'Valued Customer')},

Thank you for your payment of ${ctx.get('amount', 0):,.2f} received on {ctx.get('payment_date', 'today')}.

PAYMENT DETAILS:
- Invoice #: {ctx.get('invoice_id', 'N/A')}
- Amount Paid: ${ctx.get('amount', 0):,.2f}
- Payment Method: {ctx.get('payment_method', 'N/A')}
- Remaining Balance: ${ctx.get('remaining_balance', 0):,.2f}

Your account is now {"PAID IN FULL" if ctx.get('remaining_balance', 0) == 0 else "current"}.

We appreciate your business and hope you're satisfied with our emergency repair services. If you need future assistance, please don't hesitate to contact us.

REFERRAL BONUS:
Refer a friend or neighbor and receive $100 credit toward future services!

Thank you for choosing {ctx.get('contractor_name', 'us')}!

Best regards,
{ctx.get('contractor_name', 'Your Contractor')}
{ctx.get('contractor_phone', '(555) 123-4567')}

---
Keep this email for your records.
"""
    
    def _claim_status_request(self, ctx: Dict[str, Any]) -> str:
        """Insurance Adjuster Follow-Up - Claim Status Request"""
        claim_no = ctx.get('claim_number', 'N/A')
        address = ctx.get('property_address', 'Property Address')
        adjuster_name = ctx.get('adjuster_name', 'Adjuster')
        invoice_no = ctx.get('invoice_id', 'N/A')
        contractor_name = ctx.get('contractor_name', 'Contractor')
        contractor_email = ctx.get('contractor_email', 'contact@example.com')
        contractor_phone = ctx.get('contractor_phone', '(555) 123-4567')
        
        return f"""Subject: Status Request – Claim #{claim_no} for {address}

Hello {adjuster_name},

We are following up regarding the above claim. Mitigation and repairs were performed to prevent further loss and restore habitability. Please advise status of payment for Invoice {invoice_no}. Supporting documentation is attached.

Thank you,
{contractor_name}
{contractor_email}
{contractor_phone}

---
Attachments:
- Invoice #{invoice_no}
- Work completion photos
- Signed work authorization
- Damage assessment report
"""
    
    def _insurance_demand(self, ctx: Dict[str, Any]) -> str:
        """Concise Insurance Demand Letter (for claims with AOB)"""
        claim_no = ctx.get('claim_number', 'N/A')
        address = ctx.get('property_address', 'Property Address')
        contractor_name = ctx.get('contractor_name', 'Contractor')
        has_aob = ctx.get('has_aob', False)
        
        return f"""Subject: Demand for Payment – Claim #{claim_no}

Pursuant to the signed agreement{' (and AOB where applicable)' if has_aob else ''}, we demand payment of the outstanding balance for the necessary and completed work at {address}. Continued delay may require exercising lien rights as permitted by state law. Please respond within 7 days.

{contractor_name}
{ctx.get('contractor_email', 'contact@example.com')}
{ctx.get('contractor_phone', '(555) 123-4567')}
License #: {ctx.get('contractor_license', 'N/A')}
"""
