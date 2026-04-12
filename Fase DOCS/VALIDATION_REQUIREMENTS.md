# Validation Requirements - Bedrijfsgegevens Check

*Prevent data corruption by validating company information*  
Generated: April 12, 2026

---

## 🎯 Problem Statement

**Current Issue:**
Clients invullen "maar wat" bij bedrijfsgegevens → Complete flow crasht → Moneybird invoice fails → Manual cleanup needed

**Solution:**
Real-time validation van KVK, BTW/VAT, en IBAN bij invoer → Block submission if invalid → Save hours of manual fixes

---

## ✅ Required Validations

### 1. KVK Nummer (Chamber of Commerce)

**When:** Bij company registration, user profile edit, invoice generation

**Validation:**
```typescript
async function validateKVK(kvkNumber: string): Promise<boolean> {
  // 1. Format check: exactly 8 digits
  if (!/^\d{8}$/.test(kvkNumber)) {
    throw new Error("KVK nummer moet 8 cijfers zijn")
  }
  
  // 2. API check (KVK API)
  const response = await fetch(
    `https://api.kvk.nl/api/v1/zoeken?kvkNummer=${kvkNumber}`,
    {
      headers: {
        'apikey': process.env.KVK_API_KEY!
      }
    }
  )
  
  const data = await response.json()
  
  if (!data.resultaten || data.resultaten.length === 0) {
    throw new Error("KVK nummer niet gevonden")
  }
  
  return true
}
```

**API Setup:**
- Get API key: https://developers.kvk.nl/
- Add to .env: `KVK_API_KEY=your-key`
- Rate limit: 10 requests/second

**User Feedback:**
```
✅ Valid: "KVK nummer geverifieerd: [Bedrijfsnaam]"
❌ Invalid: "KVK nummer niet gevonden. Controleer het nummer."
⚠️ Format: "KVK nummer moet 8 cijfers zijn (bijv. 12345678)"
```

---

### 2. BTW Nummer / VAT Number

**When:** Bij company registration, invoice generation

**Validation:**
```typescript
async function validateVAT(vatNumber: string): Promise<boolean> {
  // 1. Format check: NL + 9 digits + B + 2 digits
  // Example: NL123456789B01
  if (!/^NL\d{9}B\d{2}$/.test(vatNumber)) {
    throw new Error("BTW nummer format onjuist")
  }
  
  // 2. VIES API check (EU VAT validation)
  const response = await fetch(
    'https://ec.europa.eu/taxation_customs/vies/rest-api/ms/NL/vat/' + 
    vatNumber.replace('NL', '')
  )
  
  const data = await response.json()
  
  if (!data.isValid) {
    throw new Error("BTW nummer niet geldig")
  }
  
  return true
}
```

**API Setup:**
- No API key needed (public VIES API)
- Rate limit: Be respectful (max 1 req/second)
- Backup: Manual check via https://ec.europa.eu/taxation_customs/vies/

**User Feedback:**
```
✅ Valid: "BTW nummer geverifieerd"
❌ Invalid: "BTW nummer niet geldig. Controleer het nummer."
⚠️ Format: "BTW nummer moet format NL123456789B01 zijn"
```

---

### 3. IBAN Validatie

**When:** Bij bank account invoer, payout settings

**Validation:**
```typescript
import { isValidIBAN } from 'ibantools'

function validateIBAN(iban: string): boolean {
  // 1. Clean input (remove spaces)
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()
  
  // 2. Library check (ibantools)
  if (!isValidIBAN(cleanIBAN)) {
    throw new Error("IBAN is niet geldig")
  }
  
  // 3. Optional: Check if NL (if you only accept Dutch IBANs)
  if (!cleanIBAN.startsWith('NL')) {
    throw new Error("Alleen Nederlandse IBAN nummers toegestaan")
  }
  
  return true
}
```

**Library:**
```bash
npm install ibantools
```

**User Feedback:**
```
✅ Valid: "IBAN geverifieerd"
❌ Invalid: "IBAN is niet geldig. Controleer het nummer."
⚠️ Format: "IBAN moet starten met NL (bijv. NL91ABNA0417164300)"
```

---

### 4. Email Domain Verificatie

**When:** Bij user registration, company email

**Validation:**
```typescript
async function validateEmailDomain(email: string): Promise<boolean> {
  const domain = email.split('@')[1]
  
  // 1. Block free email providers
  const blockedDomains = [
    'gmail.com', 'hotmail.com', 'outlook.com', 
    'yahoo.com', 'live.com', 'protonmail.com'
  ]
  
  if (blockedDomains.includes(domain.toLowerCase())) {
    throw new Error("Zakelijke email vereist (geen Gmail, Hotmail, etc.)")
  }
  
  // 2. DNS MX record check (domain has email)
  const dns = require('dns').promises
  try {
    const mxRecords = await dns.resolveMx(domain)
    if (mxRecords.length === 0) {
      throw new Error("Email domein heeft geen mailserver")
    }
  } catch (error) {
    throw new Error("Email domein niet gevonden")
  }
  
  return true
}
```

**User Feedback:**
```
✅ Valid: "Zakelijk email adres geverifieerd"
❌ Blocked: "Gebruik een zakelijk email adres (geen Gmail/Hotmail)"
❌ Invalid: "Email domein niet gevonden"
```

---

## 🎨 UI Implementation

### Form Field with Real-Time Validation

```tsx
export function ValidatedKVKInput() {
  const [kvk, setKvk] = useState('')
  const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
  const [error, setError] = useState('')
  const [companyName, setCompanyName] = useState('')
  
  const validateKvk = async (value: string) => {
    if (value.length !== 8) return
    
    setStatus('validating')
    try {
      const response = await fetch('/api/validate/kvk', {
        method: 'POST',
        body: JSON.stringify({ kvk: value })
      })
      
      const data = await response.json()
      
      if (data.valid) {
        setStatus('valid')
        setCompanyName(data.companyName)
        setError('')
      } else {
        setStatus('invalid')
        setError(data.error)
      }
    } catch (err) {
      setStatus('invalid')
      setError('Validatie mislukt. Probeer opnieuw.')
    }
  }
  
  return (
    <div>
      <label>KVK Nummer *</label>
      <div className="relative">
        <input
          type="text"
          value={kvk}
          onChange={(e) => {
            setKvk(e.target.value)
            if (e.target.value.length === 8) {
              validateKvk(e.target.value)
            }
          }}
          maxLength={8}
          placeholder="12345678"
          className={`
            ${status === 'valid' && 'border-green-500'}
            ${status === 'invalid' && 'border-red-500'}
          `}
        />
        
        {/* Status icon */}
        {status === 'validating' && <Spinner />}
        {status === 'valid' && <CheckIcon className="text-green-500" />}
        {status === 'invalid' && <XIcon className="text-red-500" />}
      </div>
      
      {/* Feedback */}
      {status === 'valid' && (
        <p className="text-green-600 text-sm mt-1">
          ✓ KVK geverifieerd: {companyName}
        </p>
      )}
      {status === 'invalid' && (
        <p className="text-red-600 text-sm mt-1">
          ✗ {error}
        </p>
      )}
    </div>
  )
}
```

---

## 📋 API Endpoints

### POST /api/validate/kvk
```typescript
export async function POST(request: Request) {
  const { kvk } = await request.json()
  
  try {
    const valid = await validateKVK(kvk)
    const companyName = await fetchKVKCompanyName(kvk)
    
    return Response.json({
      valid: true,
      companyName
    })
  } catch (error) {
    return Response.json({
      valid: false,
      error: error.message
    }, { status: 400 })
  }
}
```

### POST /api/validate/vat
```typescript
export async function POST(request: Request) {
  const { vat } = await request.json()
  
  try {
    const valid = await validateVAT(vat)
    
    return Response.json({ valid: true })
  } catch (error) {
    return Response.json({
      valid: false,
      error: error.message
    }, { status: 400 })
  }
}
```

### POST /api/validate/iban
```typescript
export async function POST(request: Request) {
  const { iban } = await request.json()
  
  try {
    const valid = validateIBAN(iban)
    
    return Response.json({ valid: true })
  } catch (error) {
    return Response.json({
      valid: false,
      error: error.message
    }, { status: 400 })
  }
}
```

---

## 🚧 Error Handling

### Validation Failures

**Scenario 1: User submits form with invalid data**
```
1. Prevent form submission
2. Highlight invalid fields (red border)
3. Show specific error message per field
4. Focus first invalid field
5. Keep form data (don't clear)
```

**Scenario 2: API validation timeout**
```
1. Show warning: "Validatie duurt langer dan verwacht"
2. Offer manual override (admin only)
3. Log failed validation for review
```

**Scenario 3: API down**
```
1. Show error: "Validatie tijdelijk niet beschikbaar"
2. Allow submission with warning
3. Flag for manual review
4. Send admin notification
```

---

## ✅ Implementation Checklist

### Phase 1: Basic Validation
- [ ] Install ibantools library
- [ ] Create /api/validate/kvk endpoint
- [ ] Create /api/validate/vat endpoint
- [ ] Create /api/validate/iban endpoint
- [ ] Add KVK_API_KEY to .env
- [ ] Test all validators

### Phase 2: UI Integration
- [ ] ValidatedKVKInput component
- [ ] ValidatedVATInput component
- [ ] ValidatedIBANInput component
- [ ] Real-time validation on blur
- [ ] Loading states
- [ ] Error states
- [ ] Success states

### Phase 3: Form Protection
- [ ] Block submission if invalid
- [ ] Show validation summary
- [ ] Highlight all errors
- [ ] Focus first error
- [ ] Test edge cases

### Phase 4: Monitoring
- [ ] Log validation failures
- [ ] Admin dashboard for failed validations
- [ ] Manual override workflow
- [ ] Email alerts for suspicious patterns

---

## 📊 Success Metrics

**Before Validation:**
- ❌ 15% forms met foute gegevens
- ❌ 3 hours/week manual cleanup
- ❌ Moneybird failures: 8%

**After Validation:**
- ✅ < 1% forms met foute gegevens
- ✅ < 30 min/week manual cleanup
- ✅ Moneybird failures: < 1%

---

## 🔗 Resources

**APIs:**
- KVK API: https://developers.kvk.nl/
- VIES (VAT): https://ec.europa.eu/taxation_customs/vies/
- IBAN Tools: https://www.npmjs.com/package/ibantools

**Documentation:**
- KVK format: https://www.kvk.nl/
- BTW format: https://www.belastingdienst.nl/
- IBAN format: https://www.betaalvereniging.nl/

---

*Validation Requirements - Critical for data quality!*  
*Implement ASAP to prevent manual cleanup work*
