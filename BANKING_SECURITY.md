# Banking Security Documentation

## ⚠️ Current Status: DEVELOPMENT ONLY - NOT PRODUCTION READY

The current banking information management system is **functional for testing** but has **critical security vulnerabilities** that must be addressed before production deployment.

---

## 🔴 Critical Security Issues

### 1. **No Encryption** - Highest Priority
**Current State:**
- Banking data (account numbers, routing numbers) stored in **plain text** in the database
- Database columns: `bank_account_number`, `bank_routing_number` contain raw values

**Risk:**
- Database breach = complete exposure of all contractor banking information
- Compliance violation (PCI DSS, SOC 2, banking regulations)
- Legal liability for data breach

**Required Fix:**
```typescript
// Option A: Application-Level Encryption (AES-256)
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.BANKING_ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString();
}

// Use in API:
const encrypted = encrypt(data.bankAccountNumber);
await db.update(contractorProfiles).set({ bankAccountNumber: encrypted });
```

**Option B: KMS-Based Encryption (Better)**
- Use AWS KMS, Google Cloud KMS, or HashiCorp Vault
- Envelope encryption (data encryption keys encrypted by master key)
- Automatic key rotation
- Audit logs for key access

**Option C: Tokenization (Best)**
- Use payment gateway's tokenization service (Stripe, Plaid)
- Store tokens instead of actual account numbers
- Gateway handles sensitive data, you only store references

---

### 2. **Server-Side Masking Missing**
**Current State:**
- Frontend shows masked values (`****1234`)
- Backend returns full account numbers to API clients
- Logs may capture full banking data

**Risk:**
- Authenticated users with API access can retrieve full account numbers
- Application logs/error messages may leak sensitive data
- Debugging tools may expose data

**Required Fix:**
```typescript
// In GET /contractor/banking/:userId endpoint:
router.get('/contractor/banking/:userId', async (req, res) => {
  const [profile] = await db.select().from(contractorProfiles)...;
  
  // ALWAYS mask before sending to client
  const masked = {
    ...profile,
    bankAccountNumber: maskAccountNumber(profile.bankAccountNumber),
    bankRoutingNumber: maskRoutingNumber(profile.bankRoutingNumber)
  };
  
  res.json(masked);
});

function maskAccountNumber(accountNumber: string | null): string {
  if (!accountNumber || accountNumber.length < 4) return '****';
  return '****' + accountNumber.slice(-4);
}

function maskRoutingNumber(routingNumber: string | null): string {
  if (!routingNumber || routingNumber.length < 4) return '****';
  return '****' + routingNumber.slice(-4);
}
```

---

### 3. **Weak Validation**
**Current State:**
- Only checks length (routing: 9 chars, account: 4-17 chars)
- Allows non-numeric characters
- No ACH checksum validation

**Risk:**
- Invalid data stored in database
- Payment failures when processing ACH transfers
- Potential for injection attacks

**Required Fix:**
```typescript
const bankingSchema = z.object({
  userId: z.string(),
  bankAccountNumber: z.string()
    .regex(/^\d{4,17}$/, 'Account number must be 4-17 digits only')
    .refine((val) => !val.startsWith('0'), 'Account number cannot start with 0'),
  bankRoutingNumber: z.string()
    .length(9, 'Routing number must be exactly 9 digits')
    .regex(/^\d{9}$/, 'Routing number must contain only digits')
    .refine(validateRoutingChecksum, 'Invalid routing number checksum'),
  bankAccountType: z.enum(['checking', 'savings']),
  bankName: z.string().min(1).max(100),
  accountHolderName: z.string().min(1).max(100)
});

// ABA Routing Number Checksum Validation
function validateRoutingChecksum(routingNumber: string): boolean {
  const digits = routingNumber.split('').map(Number);
  const checksum = (
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    1 * (digits[2] + digits[5] + digits[8])
  ) % 10;
  return checksum === 0;
}
```

---

## 🛡️ Production Security Checklist

### **Before Going Live:**

- [ ] **Encryption Implemented**
  - [ ] Application-level encryption OR tokenization
  - [ ] Encryption keys stored in KMS/Vault (not environment variables)
  - [ ] Key rotation policy in place

- [ ] **Server-Side Masking**
  - [ ] All API responses mask banking data
  - [ ] Raw data NEVER returned to frontend
  - [ ] Logs scrubbed of sensitive data

- [ ] **Enhanced Validation**
  - [ ] Digit-only enforcement
  - [ ] ABA routing checksum validation
  - [ ] Bank account number format validation
  - [ ] Reject common test numbers

- [ ] **Access Controls**
  - [ ] Role-based access (only contractors can view their own data)
  - [ ] Admin access requires 2FA
  - [ ] API authentication enforced

- [ ] **Audit Logging**
  - [ ] Log all banking data access (who, when, what)
  - [ ] Alert on suspicious access patterns
  - [ ] Immutable audit trail

- [ ] **Compliance**
  - [ ] PCI DSS compliance review
  - [ ] Data retention policy implemented
  - [ ] Privacy policy updated
  - [ ] User consent captured

- [ ] **Testing**
  - [ ] Penetration testing completed
  - [ ] Security audit passed
  - [ ] Encryption/decryption tested
  - [ ] Data migration tested

---

## 📝 Implementation Roadmap

### **Phase 1: Immediate (Development Testing)**
✅ Current implementation - functional but insecure
- ✅ Database schema extended
- ✅ API endpoints working
- ✅ Frontend UI complete
- ⚠️ **Use ONLY with test data**

### **Phase 2: Security Hardening (Pre-Production)**
Required before any production use:
1. Implement encryption/tokenization
2. Add server-side masking
3. Enhance validation with checksums
4. Add audit logging
5. Implement access controls

### **Phase 3: Compliance & Production**
Final steps for production deployment:
1. Security audit
2. Penetration testing
3. PCI compliance certification
4. Legal review
5. Production deployment

---

## 🔧 Quick Start for Testing (Development Only)

### **Current Functionality:**
You can test the banking UI right now:

1. **Navigate to Banking Settings:**
   ```
   http://localhost:5000/banking-settings
   ```

2. **Use Test Data ONLY:**
   - Bank Name: `Test Bank`
   - Account Holder: `John Doe`
   - Routing Number: `021000021` (valid checksum)
   - Account Number: `123456789`
   - Account Type: `checking`

3. **Verify:**
   - Form submission works
   - Data saves to database
   - Masked display shows `****6789` and `****0021`
   - Edit functionality works

**⚠️ DO NOT enter real banking information!**

---

## 📞 Next Steps

**Option 1: Continue Testing (Current State)**
- Add the 9 platform secrets
- Test payment workflow with test data
- Validate UI/UX functionality

**Option 2: Harden for Production**
- Implement encryption layer
- Add security enhancements
- Complete compliance checklist
- Deploy securely

---

## 📚 Additional Resources

- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [ABA Routing Number Validation](https://en.wikipedia.org/wiki/ABA_routing_transit_number#Check_digit)
- [Stripe Tokenization Guide](https://stripe.com/docs/payments/payment-methods/tokenization)

---

**Last Updated:** November 2, 2025  
**Status:** Development/Testing Only - NOT Production Ready
