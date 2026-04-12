# AdCure Client Portal - OpenCode Context Document

*Complete Project Context for AI-Assisted Development*  
*Read this FIRST before implementing any features*  
Last Updated: April 10, 2026

---

## 🎯 Project Overview

### What We're Building
A **complete rebuild** of the AdCure client portal - a multi-tenant SaaS platform where advertising agencies manage client wallets and ad account top-ups. The old system (Base44) has critical bugs and needs a fresh start.

### Core Purpose
**For Clients:** Self-service portal to add funds via bank transfer, request ad accounts, and top up advertising budgets  
**For Agency:** Admin panel to verify payments, approve requests, manage users, and automate invoicing via Moneybird

### Success Metrics
- Zero Base44-related errors
- 100% of top-ups processed within 30 minutes
- Moneybird invoices auto-generated without bugs
- User-friendly experience matching old portal's good features

---

## 👥 User Roles & Access

### Client Role
- **Who:** Advertising clients of AdCure Agency
- **Access:** Own organization data only (RLS enforced)
- **Can:**
  - View wallet balance and transaction history
  - Add funds via bank transfer (upload proof)
  - Request new ad accounts (Meta/Google/TikTok)
  - Top up ad accounts (wallet OR bank transfer)
  - Download invoices
- **Cannot:**
  - See other clients' data
  - Access admin panel
  - Modify fees or account settings

### Agency Admin Role
- **Who:** AdCure Agency staff (service@adcure.agency)
- **Access:** All organizations and data (RLS allows)
- **Can:**
  - View all client wallets and accounts
  - Approve/reject account requests
  - Verify and approve wallet top-ups
  - Manage all users (create/edit/delete)
  - View analytics and reports
  - Manually adjust balances
- **Cannot:**
  - Impersonate clients
  - Bypass audit logs

---

## 💰 Critical Business Rules

### 1. Payment Flow: Bank Transfer ONLY

**Why:** Payment processor fees (1-2%) would eliminate profit margins on low-fee accounts.

**Current Situation:**
- Supplier charges 2% per transaction
- Some accounts have 2% client fees → would lose money with Stripe/Mollie
- Solution: Manual bank transfer flow (no processor fees)

**Bank Details (Revolut Business):**
```
Beneficiary: Adcure Agency
IBAN: NL14REV0766119691
BIC: REV0NL22
Reference: Client's email (for matching)
```

**Flow:**
1. Client sees bank details in modal
2. Client makes transfer from their bank
3. Client uploads proof (screenshot/PDF)
4. Admin views proof and verifies in Revolut
5. Admin approves → wallet balance updated → invoice generated

### 2. Variable Fees Per Account

**CRITICAL:** Each ad account has its own fee percentage (NOT fixed!)

**Examples from Live Portal:**
- Account "sdf": 5% top-up fee
- Account "asd": 3% top-up fee
- Account "xyz": 2% top-up fee

**Why Variable:**
- Different clients negotiate different rates
- Agency can offer discounts to high-volume clients
- Competitive pricing strategy

**Implementation:**
- Database: `ad_accounts.fee_percentage DECIMAL(5,2)` (e.g., 5.00 for 5%)
- Admin sets fee when creating account
- Client sees fee on account card: "Top-up fee: 5%"
- Fee calculator shows breakdown on top-up

### 3. Fee Calculation Formula

**For Ad Account Top-Ups:**
```typescript
// Example: €1000 top-up with 5% fee
const adAmount = 1000.00
const feePercentage = 5.0

const fee = adAmount * (feePercentage / 100)        // €50.00
const vat = fee * 0.21                               // €10.50 (21% VAT on fee only)
const total = adAmount + fee + vat                   // €1,060.50

// Breakdown shown to client:
// Ad Account Amount:  €1,000.00
// Top-up Fee (5%):    €50.00
// VAT (21% of fee):   €10.50
// ─────────────────────────────
// Total to Pay:       €1,060.50
```

**For Wallet Top-Ups:**
```typescript
// Wallet top-ups have NO fees (just bank transfer)
const depositAmount = 1000.00
const fee = 0.00
const vat = 0.00
const total = 1000.00

// Client pays exactly what they deposit
```

**VAT Rule:** 21% BTW/VAT applies ONLY to the fee, NOT the ad account amount  
**Why:** Ad spend is "doorbelaste kosten" (passed-through costs) - not taxable

### 4. Dual Payment Options (Ad Account Top-Ups)

**Option 1: Pay from Wallet** (Preferred)
- Processing time: 10 minutes
- Immediate deduction from wallet
- No proof upload needed
- Balance check: `wallet.balance >= total`
- If insufficient → disable option + show message

**Option 2: Bank Transfer**
- Processing time: 30 minutes
- Upload proof required
- Admin verification needed
- Slower but always available

**Important:** Wallet top-ups = bank transfer only (no dual option)

### 5. Google Sheet Workflow

**For New Ad Account Requests:**

Admin receives request with:
- Account Name
- Domain Name
- Business Manager ID
- Currency
- Timezone

Admin copies this data to **supplier's Google Sheet** → Supplier creates account in Meta/Google/TikTok → Admin marks as approved in portal

**Why Not Automated:**
- Supplier uses their own systems
- Manual step ensures quality control
- Future: Could integrate with supplier API

### 6. Moneybird Integration (Invoicing)

**Trigger:** Wallet top-up status changes to 'completed'

**Auto-Process:**
1. Calculate invoice amounts (amount + 21% VAT)
2. Create invoice in database
3. Send to Moneybird API
4. Moneybird generates PDF
5. Email PDF to client
6. Update invoice status to 'sent'

**Current Problem:** Existing integration is buggy (sometimes works, sometimes doesn't)  
**Solution:** Rebuild from scratch with proper error handling

**Moneybird Invoice Format:**
```
Client: [client_name]
Description: Wallet top-up - [date]
Amount: €1000.00
VAT (21%): €210.00
Total: €1210.00
```

**Future Enhancement:** MCP servers for automated bookkeeping (Moneybird + Revolut)

---

## 🗄️ Database Schema Summary

### Core Tables

**organizations** (Multi-tenant root)
- `id` (UUID, PK)
- `name` (text)
- `type` ('client' | 'agency')

**users** (Auth + Profile)
- `id` (UUID, PK, FK to auth.users)
- `organization_id` (UUID, FK to organizations)
- `email` (text, unique)
- `full_name`, `phone`, `company_name`
- `role` ('client' | 'agency_admin')

**wallets** (Client funds)
- `id` (UUID, PK)
- `organization_id` (UUID, FK, unique)
- `balance_cents` (bigint, >= 0)
- `currency` (text, default 'EUR')

**ad_accounts** (Advertising accounts)
- `id` (UUID, PK)
- `organization_id` (UUID, FK)
- `name`, `account_id`, `platform` ('meta' | 'google' | 'tiktok')
- `currency`, `timezone`
- **`fee_percentage` (DECIMAL(5,2)) ← VARIABLE!**
- `status` ('active' | 'disabled')
- `balance_cents` (bigint)

**transactions** (All money movements)
- `id` (UUID, PK)
- `wallet_id` (UUID, FK)
- `type` ('top_up' | 'transfer' | 'refund' | 'adjustment')
- `amount_cents` (bigint)
- `status` ('pending' | 'completed' | 'rejected')
- `reference`, `proof_url`, `notes`
- `ad_account_id` (UUID, FK, nullable)
- `created_by`, `reviewed_by`, `reviewed_at`

**ad_account_requests** (New account applications)
- `id` (UUID, PK)
- `organization_id` (UUID, FK)
- `account_name`, `domain_name`, `business_manager_id`
- `currency`, `timezone`, `platform`
- `status` ('pending' | 'approved' | 'rejected')
- `reviewed_by`, `reviewed_at`, `rejection_reason`

**invoices** (Auto-generated)
- `id` (UUID, PK)
- `organization_id` (UUID, FK)
- `transaction_id` (UUID, FK)
- `invoice_number` (text, unique)
- `moneybird_id` (text, nullable)
- `amount_cents`, `vat_cents`, `total_cents`
- `status` ('created' | 'sent' | 'paid')
- `pdf_url`, `sent_at`

### Row Level Security (RLS)

**Critical Security Rules:**

1. **Clients see ONLY their organization's data**
   ```sql
   WHERE organization_id = auth.user_organization_id()
   ```

2. **Agency admins see ALL data**
   ```sql
   WHERE auth.user_role() = 'agency_admin'
   ```

3. **No cross-tenant data leaks**
   - RLS policies on ALL tables
   - Helper functions: `auth.user_organization_id()`, `auth.user_role()`

---

## 🎨 Design System

### Color Palette (from Lovable site)
```css
Background:     #0A0E14  (very dark)
Sidebar:        #1A1F2B  (dark gray)
Primary Blue:   #2D7FF9  (CTAs, links)
Success Green:  #10B981  (active, approved)
Warning Yellow: #F59E0B  (pending)
Error Red:      #EF4444  (rejected, errors)
Text Primary:   #FFFFFF  (headings)
Text Secondary: #94A3B8  (body)
```

### Typography
- Font: Inter (or similar modern sans-serif)
- Headings: Bold, large
- Body: Regular, readable
- Numbers: Bold, prominent

### Components (shadcn/ui)
- Button, Card, Badge, Input, Select, Textarea
- Dialog, Dropdown Menu, Tabs, Table
- Toast, Loading Spinner, Skeleton

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Query (server state)

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Supabase Edge Functions (optional)

**Integrations:**
- Moneybird API (invoicing)
- Resend.com (emails, optional)
- Supabase Storage (proof uploads)

**Deployment:**
- Vercel (frontend)
- Supabase Pro (backend)
- Custom domain: portal.adcure.agency

---

## 📂 Project Structure

```
adcure-portal/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (client)/
│   │   ├── dashboard/page.tsx
│   │   ├── wallet/page.tsx
│   │   ├── ad-accounts/page.tsx
│   │   └── invoices/page.tsx
│   ├── (agency)/
│   │   ├── dashboard/page.tsx
│   │   ├── ad-accounts/page.tsx
│   │   ├── wallets/page.tsx
│   │   └── management/
│   │       ├── users/page.tsx
│   │       └── monitoring/page.tsx
│   ├── api/
│   │   ├── wallet/
│   │   ├── ad-accounts/
│   │   └── upload/
│   └── layout.tsx
├── components/
│   ├── layouts/
│   ├── wallet/
│   ├── ad-accounts/
│   └── shared/
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── moneybird/
│   └── utils/
├── types/
│   └── database.types.ts
├── supabase/
│   └── migrations/
└── docs/
    └── fase-docs/
        ├── phase-1-foundation-spec.md
        ├── phase-2-core-client-features-spec.md
        ├── phase-3-admin-panel-spec.md
        └── phase-4-polish-integration-spec.md
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (12-14 hours)
**What:** Database schema, RLS policies, auth system, layouts  
**Deliverables:** Login works, dashboards render, RLS enforced  
**Doc:** `docs/fase-docs/phase-1-foundation-spec.md`

### Phase 2: Core Client Features (25-27 hours)
**What:** Wallet management, ad accounts, requests, fee calculator  
**Deliverables:** Clients can add funds, request accounts, view fees  
**Doc:** `docs/fase-docs/phase-2-core-client-features-spec.md`

### Phase 3: Admin Panel (25-27 hours)
**What:** Request approval, wallet verification, user management  
**Deliverables:** Admins can approve requests, verify deposits, manage users  
**Doc:** `docs/fase-docs/phase-3-admin-panel-spec.md`

### Phase 4: Polish & Integration (24 hours)
**What:** Moneybird integration, email notifications, deployment  
**Deliverables:** Auto-invoicing works, emails sent, production live  
**Doc:** `docs/fase-docs/phase-4-polish-integration-spec.md`

**Total Estimated Time:** 85-95 hours (6-8 weeks at 12-14h/week)

---

## ⚠️ Critical Constraints & Rules

### DO:
✅ Use bank transfer flow (NO Stripe/Mollie/Revolut payment processors)  
✅ Support variable fees per account (free-form input)  
✅ Calculate VAT ONLY on fee (not on ad amount)  
✅ Enforce RLS on ALL tables  
✅ Use Revolut bank details (IBAN: NL14REV0766119691)  
✅ Upload proof to Supabase Storage  
✅ Auto-generate invoices via Moneybird  
✅ Show fee calculator on ad account top-ups (NOT wallet top-ups)  
✅ Dual payment options for ad account top-ups  
✅ Copy ad account data to Google Sheet (manual step)  

### DON'T:
❌ Add payment processor fees (destroys margins)  
❌ Use fixed fee percentages (must be variable)  
❌ Apply VAT to ad account amounts (only to fees)  
❌ Skip RLS policies (security critical)  
❌ Auto-create ad accounts (manual Google Sheet step)  
❌ Show fee calculator on wallet top-ups (fee-free)  
❌ Allow clients to see other clients' data  
❌ Skip proof upload for bank transfers  

---

## 🧪 Testing Requirements

### Must Test:
- [ ] RLS policies: Client cannot see other clients' data
- [ ] Fee calculation: Correct for variable percentages
- [ ] Wallet payment: Balance check prevents overdraft
- [ ] Bank transfer: Proof upload required
- [ ] Moneybird: Invoice generation works every time
- [ ] Email: Notifications sent on status changes
- [ ] Auth: Role-based routing works
- [ ] Mobile: Responsive layouts work

### Load Testing:
- 100 concurrent users
- 1000 transactions per hour
- Database query performance < 500ms

---

## 📊 Key Metrics to Track

**Client Metrics:**
- Wallet balance accuracy
- Top-up success rate
- Time to approval (aim < 1 hour for accounts, < 30 min for deposits)

**Admin Metrics:**
- Pending requests (aim 0 at end of day)
- Failed invoices (aim 0%)
- User complaints (aim < 1%)

**System Metrics:**
- API response times
- Database query performance
- Error rates (aim < 0.1%)
- Uptime (aim 99.9%)

---

## 🔗 Related Documents

**Phase Specifications:**
- [Phase 1 - Foundation](./fase-docs/phase-1-foundation-spec.md)
- [Phase 2 - Core Client Features](./fase-docs/phase-2-core-client-features-spec.md)
- [Phase 3 - Admin Panel](./fase-docs/phase-3-admin-panel-spec.md)
- [Phase 4 - Polish & Integration](./fase-docs/phase-4-polish-integration-spec.md)

**External Resources:**
- Current portal: https://portal.adcure.agency (login to explore)
- Lovable site: https://scale-infrastructure-hub.lovable.app (branding source)
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com

---

## 🎯 OpenCode Usage Instructions

### Step 1: Read This Document
**IMPORTANT:** Read this ENTIRE document before implementing ANY features. This provides the business context, rules, and constraints.

### Step 2: Load Phase Spec
Choose which phase to implement:
```
"Build Phase 1 Foundation from docs/fase-docs/phase-1-foundation-spec.md"
```

### Step 3: Follow Spec Steps
Each phase spec contains:
- Step-by-step implementation instructions
- Code examples
- File structure
- Testing checklist
- Acceptance criteria

### Step 4: Verify & Test
After each phase:
- Run tests (unit + integration)
- Manual testing checklist
- Verify acceptance criteria
- Fix any issues before moving to next phase

### Step 5: Iterate
If something doesn't work:
- Read relevant section of this context doc
- Check phase spec for details
- Review code examples
- Test incrementally

---

## 💡 Key Success Factors

1. **RLS First:** Set up RLS before building features (security critical)
2. **Variable Fees:** Never hardcode fee percentages (each account is different)
3. **Fee Calculator:** Show on ad account top-ups, hide on wallet top-ups
4. **Bank Transfer:** No shortcuts - must upload proof, admin must verify
5. **Moneybird:** Proper error handling (current integration is buggy)
6. **Dark Theme:** Match Lovable design (users expect familiar look)
7. **Mobile:** Test on phone (many users manage on mobile)
8. **Testing:** Don't skip tests (bugs destroy trust)

---

## 🆘 Common Pitfalls to Avoid

**Pitfall 1:** "Let's add Stripe for faster payments"  
❌ **Why Bad:** Fees destroy margins on 2% accounts  
✅ **Correct:** Stick to bank transfer flow

**Pitfall 2:** "Fee calculator everywhere!"  
❌ **Why Bad:** Wallet top-ups have no fees  
✅ **Correct:** Fee calculator ONLY on ad account top-ups

**Pitfall 3:** "I'll fix RLS later"  
❌ **Why Bad:** Security breach, data leaks  
✅ **Correct:** RLS from day 1, test thoroughly

**Pitfall 4:** "Fixed 5% fee is easier"  
❌ **Why Bad:** Loses variable pricing flexibility  
✅ **Correct:** Support free-form fee input per account

**Pitfall 5:** "Skip the Google Sheet step"  
❌ **Why Bad:** Breaks supplier workflow  
✅ **Correct:** Keep manual copy/paste (document it)

---

## 📞 Support & Questions

**For technical questions:**
- Read phase specs thoroughly
- Check this context document
- Review Supabase/Next.js docs

**For business logic questions:**
- Refer to "Critical Business Rules" section
- Check current portal behavior (portal.adcure.agency)
- When in doubt: ask before implementing

**For design questions:**
- Match Lovable site branding
- Reference old portal screenshots
- Use shadcn/ui components

---

## ✅ Pre-Implementation Checklist

Before starting Phase 1:
- [ ] Read this entire context document
- [ ] Read Phase 1 specification
- [ ] Understand RLS concepts
- [ ] Understand variable fees concept
- [ ] Understand dual payment flow
- [ ] Have Supabase account ready
- [ ] Have Vercel account ready
- [ ] Understand bank transfer workflow

---

**You're now ready to build! Start with Phase 1.** 🚀

*This context document is the source of truth for business logic and constraints.*  
*When in doubt, refer back to this document.*  
*Good luck! 🎉*
