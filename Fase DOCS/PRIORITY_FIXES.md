# Priority Bug Fixes - Critical Issues First

*Fix these in order - from breaking to nice-to-have*  
Generated: April 12, 2026  
Based on: OpenCode's CURRENT_STATE_REPORT.md analysis

---

## 🔴 CRITICAL (Fix Today - System Breaking)

### 1. Admin "Add User" Creates NO Real Auth User

**Problem:**
```
Admin clicks "Add User" → 
Form submits → 
Creates record in `users` table → 
BUT no Supabase Auth user created → 
User CANNOT login (no auth.users record)
```

**Impact:** ❌ New users cannot be created at all  
**Priority:** 🔴 **CRITICAL**  
**File:** `app/(agency)/management/users/page.tsx`

**Current Code (BROKEN):**
```typescript
// Only creates database record, NOT auth user!
const { data, error } = await supabase
  .from('users')
  .insert({
    email: formData.email,
    full_name: formData.name,
    role: formData.role,
    organization_id: formData.organizationId
  })
```

**Fix:**
```typescript
// Step 1: Create Supabase Auth user FIRST
const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
  email: formData.email,
  password: generateRandomPassword(), // Or send invite email
  email_confirm: true,
  user_metadata: {
    full_name: formData.name,
    role: formData.role
  }
})

if (authError) {
  throw new Error(`Failed to create auth user: ${authError.message}`)
}

// Step 2: Create users table record with auth user ID
const { error: dbError } = await supabase
  .from('users')
  .insert({
    id: authUser.user.id, // Link to auth.users!
    email: formData.email,
    full_name: formData.name,
    role: formData.role,
    organization_id: formData.organizationId
  })

if (dbError) {
  // Rollback: delete auth user if database insert fails
  await supabase.auth.admin.deleteUser(authUser.user.id)
  throw new Error(`Failed to create database record: ${dbError.message}`)
}

// Step 3: Send password reset email (so user can set password)
await supabase.auth.resetPasswordForEmail(formData.email, {
  redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
})
```

**Test:**
1. Create new user as admin
2. Check Supabase Dashboard → Authentication → Users (should see new user)
3. User receives password reset email
4. User can set password and login

---

### 2. Fee Percentage Hardcoded at 5%

**Problem:**
```
Ad account fee set in database: 3%
Fee calculator shows: 5% (HARDCODED!)
Invoice generated with: 5% (WRONG!)
```

**Impact:** ❌ Clients overcharged/undercharged, invoice errors  
**Priority:** 🔴 **CRITICAL**  
**Files:** Multiple (fee calculator, top-up logic, invoice generation)

**Current Code (BROKEN):**
```typescript
// components/ad-accounts/FeeCalculator.tsx
const FEE_PERCENTAGE = 5 // HARDCODED!

function calculateFee(amount: number) {
  const fee = amount * (FEE_PERCENTAGE / 100)
  const vat = fee * 0.21
  return { fee, vat, total: amount + fee + vat }
}
```

**Fix:**
```typescript
// Fetch fee from ad_accounts table
interface FeeCalculatorProps {
  amount: number
  adAccountId: string // Need account ID to fetch fee!
}

function FeeCalculator({ amount, adAccountId }: FeeCalculatorProps) {
  const { data: account } = useQuery({
    queryKey: ['ad-account', adAccountId],
    queryFn: async () => {
      const { data } = await supabase
        .from('ad_accounts')
        .select('fee_percentage')
        .eq('id', adAccountId)
        .single()
      return data
    }
  })
  
  if (!account) return <LoadingSpinner />
  
  const fee = amount * (account.fee_percentage / 100) // Use database value!
  const vat = fee * 0.21
  const total = amount + fee + vat
  
  return (
    <div>
      <p>Fee ({account.fee_percentage}%): €{fee.toFixed(2)}</p>
      <p>VAT (21%): €{vat.toFixed(2)}</p>
      <p>Total: €{total.toFixed(2)}</p>
    </div>
  )
}
```

**Files to Update:**
```
✅ components/ad-accounts/FeeCalculator.tsx
✅ app/api/ad-accounts/[id]/top-up/route.ts
✅ lib/utils/fees.ts (if exists)
✅ Any invoice generation code
```

**Test:**
1. Create account with 3% fee
2. Request top-up for €1000
3. Verify calculator shows: €1000 + €30 + €6.30 = €1036.30
4. Approve top-up
5. Verify invoice has correct fee

---

### 3. Platform Hardcoded as 'meta'

**Problem:**
```
User selects "Google Ads" in form →
Database saves: platform = 'meta' (HARDCODED!)
Admin sees: "Meta" everywhere
Actual platform: Google
```

**Impact:** ❌ Wrong platform, confusion, incorrect account management  
**Priority:** 🔴 **CRITICAL**  
**File:** `components/ad-accounts/RequestAdAccountModal.tsx`

**Current Code (BROKEN):**
```typescript
// Hardcoded platform!
const { error } = await supabase
  .from('ad_account_requests')
  .insert({
    platform: 'meta', // HARDCODED!
    // ... other fields
  })
```

**Fix:**
```typescript
// Add platform dropdown
<select
  value={formData.platform}
  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
  required
>
  <option value="">Selecteer platform...</option>
  <option value="meta">Meta (Facebook/Instagram)</option>
  <option value="google">Google Ads</option>
  <option value="tiktok">TikTok Ads</option>
</select>

// Use selected platform
const { error } = await supabase
  .from('ad_account_requests')
  .insert({
    platform: formData.platform, // Use form value!
    // ... other fields
  })
```

**Test:**
1. Request Google Ads account
2. Check database: platform should be 'google'
3. Admin dashboard should show "Google Ads"
4. Request Meta account
5. Check database: platform should be 'meta'

---

## 🟡 HIGH (Fix This Week - Data Integrity)

### 4. Wallet Balance Update Race Condition

**Problem:**
```
Concurrent top-ups:
Request A: €100 (balance: €1000 → €1100)
Request B: €200 (balance: €1000 → €1200)
Both execute simultaneously
Final balance: €1200 (should be €1300!)
Lost €100!
```

**Impact:** ⚠️ Money lost in race conditions  
**Priority:** 🟡 **HIGH**  
**File:** Wallet balance update logic

**Current Code (BROKEN):**
```typescript
// Non-atomic update (race condition!)
const { data: wallet } = await supabase
  .from('wallets')
  .select('balance_cents')
  .eq('id', walletId)
  .single()

const newBalance = wallet.balance_cents + amountCents

await supabase
  .from('wallets')
  .update({ balance_cents: newBalance })
  .eq('id', walletId)
```

**Fix (Use Database Transaction):**
```typescript
// Atomic update with SQL function
await supabase.rpc('increment_wallet_balance', {
  p_wallet_id: walletId,
  p_amount_cents: amountCents
})

// Create SQL function in Supabase:
CREATE OR REPLACE FUNCTION increment_wallet_balance(
  p_wallet_id UUID,
  p_amount_cents BIGINT
) RETURNS void AS $$
BEGIN
  UPDATE wallets
  SET balance_cents = balance_cents + p_amount_cents,
      updated_at = NOW()
  WHERE id = p_wallet_id;
END;
$$ LANGUAGE plpgsql;
```

**Test:**
1. Start with balance €1000
2. Approve 2 top-ups simultaneously (€100 + €200)
3. Final balance should be €1300 (not €1100 or €1200)

---

### 5. Missing .env for All Configs

**Problem:**
```
Bank details hardcoded in component
VAT rate hardcoded (21%)
Moneybird config in database
Deployment requires code changes
```

**Impact:** ⚠️ Hard to deploy, hard to clone for new clients  
**Priority:** 🟡 **HIGH**  
**Files:** All components with hardcoded values

**Fix:**
See `ENV_CONFIGURATION.md` for complete guide.

**Move to .env:**
```
✅ Bank details (IBAN, BIC, beneficiary)
✅ VAT percentage
✅ Moneybird API keys
✅ Resend email keys
✅ All feature flags
```

---

## 🟢 MEDIUM (Fix This Month - UX Issues)

### 6. Resend + Moneybird API Keys Missing

**Problem:**
Email notifications fail silently (no error shown)  
Invoice generation fails (no retry logic)

**Impact:** ⚠️ Users don't receive notifications, manual invoicing needed  
**Priority:** 🟢 **MEDIUM**

**Fix:**
```bash
# Add to .env.local
RESEND_API_KEY=re_xxxxxxxxxxxx
MONEYBIRD_API_KEY=your-key-here
MONEYBIRD_ADMINISTRATION_ID=your-admin-id
```

**Add Error Handling:**
```typescript
try {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: user.email,
    subject: 'Top-up Approved',
    html: template
  })
} catch (error) {
  // Log error
  console.error('Email failed:', error)
  
  // Show in UI
  toast.error('Top-up approved but email failed. Check your inbox.')
  
  // Store in database for retry
  await supabase.from('failed_emails').insert({
    to: user.email,
    template: 'top_up_approved',
    error: error.message
  })
}
```

---

### 7. Missing Validation on Company Data

**Problem:**
Users enter fake KVK/VAT numbers  
Moneybird invoice fails  
Manual cleanup needed

**Impact:** ⚠️ Wasted admin time  
**Priority:** 🟢 **MEDIUM**

**Fix:**
See `VALIDATION_REQUIREMENTS.md` for complete implementation.

---

## 🔵 LOW (Nice to Have - Polish)

### 8. Loading States Missing

**Problem:**
Button click → nothing happens for 2 seconds → success  
User clicks again → duplicate request

**Impact:** Minor UX issue  
**Priority:** 🔵 **LOW**

**Fix:**
```typescript
const [isLoading, setIsLoading] = useState(false)

async function handleSubmit() {
  setIsLoading(true)
  try {
    await submitRequest()
  } finally {
    setIsLoading(false)
  }
}

<button disabled={isLoading}>
  {isLoading ? <Spinner /> : 'Submit'}
</button>
```

---

### 9. Error Messages Not User-Friendly

**Problem:**
Error: "RLS policy violation"  
User: "Wat betekent dit?"

**Impact:** Minor UX issue  
**Priority:** 🔵 **LOW**

**Fix:**
```typescript
function formatError(error: Error): string {
  if (error.message.includes('RLS')) {
    return 'Je hebt geen toegang tot deze data.'
  }
  if (error.message.includes('duplicate')) {
    return 'Dit record bestaat al.'
  }
  return 'Er is iets misgegaan. Probeer het opnieuw.'
}
```

---

## ✅ Fix Order Summary

**Week 1 (CRITICAL):**
```
Day 1: Fix #1 - Admin Add User
Day 2: Fix #2 - Fee Percentage Variable
Day 3: Fix #3 - Platform Selection
```

**Week 2 (HIGH):**
```
Day 1: Fix #4 - Race Condition
Day 2-3: Fix #5 - Move to .env
```

**Week 3 (MEDIUM):**
```
Day 1: Fix #6 - API Keys + Error Handling
Day 2-3: Fix #7 - Validation
```

**Week 4 (LOW + Polish):**
```
Day 1: Fix #8 - Loading States
Day 2: Fix #9 - Error Messages
Day 3: Testing + QA
```

---

## 📋 Implementation Checklist

### Critical Fixes
- [ ] #1: Admin creates real auth users
- [ ] #2: Fee percentage from database
- [ ] #3: Platform selectable
- [ ] Test all critical fixes

### High Priority
- [ ] #4: Atomic wallet balance updates
- [ ] #5: All configs in .env
- [ ] Test high priority fixes

### Medium Priority
- [ ] #6: API keys + error handling
- [ ] #7: Company validation
- [ ] Test medium priority fixes

### Polish
- [ ] #8: Loading states everywhere
- [ ] #9: User-friendly errors
- [ ] Final QA

---

## 🎯 OpenCode Instructions

**Copy-paste this to OpenCode:**

```
Fix these bugs in priority order:

CRITICAL (Today):
1. Admin "Add User" - use supabase.auth.admin.createUser()
2. Fee percentage - read from ad_accounts.fee_percentage
3. Platform - add dropdown (meta/google/tiktok)

HIGH (This Week):
4. Wallet balance - use atomic SQL function
5. Move configs to .env - see ENV_CONFIGURATION.md

MEDIUM (This Month):
6. Add API error handling
7. Add validation - see VALIDATION_REQUIREMENTS.md

Test each fix before moving to next!
```

---

*Priority Bug Fixes - Start with Critical!*  
*Test thoroughly after each fix*  
*Don't skip to Medium before Critical is done!*
