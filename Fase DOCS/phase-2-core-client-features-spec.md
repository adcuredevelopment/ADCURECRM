# Feature Specification: Phase 2 - Core Client Features

*OpenCode Implementation Guide - AdCure Client Portal Rebuild*  
*Context Mode: Full Context*  
Generated: April 10, 2026

---

## 🎯 Phase Overview

### Goal
Build the core client-facing features: wallet management with bank transfer top-ups, ad account display with variable fees and dual payment options, account request system, and top-up requests. This phase enables clients to manage their funds and advertising accounts independently.

### User Stories
- As a **client**, I want to add funds to my wallet via bank transfer so that I can top up my ad accounts
- As a **client**, I want to see all my ad accounts with their balances and fees so that I can monitor my spending
- As a **client**, I want to request new ad accounts so that I can start advertising
- As a **client**, I want to top up ad accounts using my wallet OR bank transfer so that I have flexible payment options
- As a **client**, I want to see my request history so that I can track pending/approved/rejected requests

### Success Criteria
- [ ] Wallet page shows current balance, deposited, spent stats
- [ ] Add Funds modal displays Revolut bank details and fee breakdown
- [ ] Clients can upload proof of payment for top-ups
- [ ] Ad Accounts page shows all accounts with variable fees (5%, 3%, etc.)
- [ ] Top-up request modal shows dual payment options (wallet vs bank)
- [ ] Fee calculator appears when entering amount (ad account top-ups only)
- [ ] Account request form captures all 5 fields for Google Sheet
- [ ] Request history shows pending/approved/rejected status with timestamps
- [ ] All flows match current portal behavior

---

## 🎨 Design Specification

### Wallet Page Layout

```
┌───────────────────────────────────────────────────────┐
│ Wallet                           [+ Add Funds] Button │
├───────────────────────────────────────────────────────┤
│                                                       │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │Available│ │ Pending │ │Deposited│ │  Spent  │   │
│ │€1030.01 │ │  €0.00  │ │€3600.00 │ │€2569.99 │   │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                       │
│ Transactions                                          │
│ ┌─Filters─────────────────────────────────────────┐ │
│ │ [All Types▼] [All Status▼] [Newest▼]           │ │
│ │ [From Date] [To Date]                           │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ Transaction List:                                     │
│ ┌──────────────────────────────────────────────────┐│
│ │ ↑  Ad Account Top-Up    Jan 6  €1036.30  [Done] ││
│ │ ↓  Deposit              Jan 6  €1000.00  [Done] ││
│ │ ↑  Ad Account Top-Up    Jan 6  €3.11     [Done] ││
│ └──────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────┘
```

### Add Funds Modal

```
┌─────────────────────────────────────────────────┐
│ Add Funds to Wallet                        [X]  │
├─────────────────────────────────────────────────┤
│ Transfer funds via bank transfer and upload     │
│ proof of payment                                │
│                                                  │
│ 💳 Deposit Amount                               │
│ ┌───┬───┬───┬───┬───┐                          │
│ │€50│€100│€250│€500│€1000│                     │
│ └───┴───┴───┴───┴───┘                          │
│ Custom Amount (EUR) *                           │
│ [€ Enter amount_______________]                 │
│ Minimum deposit: €10                            │
│                                                  │
│ 💰 Bank Transfer Details                        │
│ ┌───────────────────────────────────────────┐  │
│ │ Beneficiary Name                          │  │
│ │ Adcure Agency                       [📋]  │  │
│ │                                            │  │
│ │ IBAN                                       │  │
│ │ NL14REV0766119691                   [📋]  │  │
│ │                                            │  │
│ │ BIC / SWIFT                                │  │
│ │ REV0NL22                            [📋]  │  │
│ │                                            │  │
│ │ ℹ️  Please use your email as payment      │  │
│ │    reference for faster processing        │  │
│ └───────────────────────────────────────────┘  │
│                                                  │
│ Payment Reference / Transaction ID               │
│ [e.g., Transaction ID or Reference Number___]   │
│                                                  │
│ 📤 Proof of Payment *                           │
│ ┌───────────────────────────────────────────┐  │
│ │           [Upload Icon]                    │  │
│ │   Drag & drop or click to upload          │  │
│ └───────────────────────────────────────────┘  │
│                                                  │
│ [Cancel]              [Submit Deposit Request]  │
└─────────────────────────────────────────────────┘
```

### Ad Accounts Page

```
┌────────────────────────────────────────────────────┐
│ Ad Accounts                                        │
├────────────────────────────────────────────────────┤
│ ┌─Accounts─┬─Requests───────────────────────────┐│
│ │          │                                     ││
│ │ Stats:                                         ││
│ │ ┌───────┬───────┬───────────┬──────────────┐ ││
│ │ │Active │Total  │Balance    │[+] New Req   │ ││
│ │ │  2    │  2    │€1,515     │Request Acct  │ ││
│ │ └───────┴───────┴───────────┴──────────────┘ ││
│ │                                                ││
│ │ [Search accounts_____________________]         ││
│ │                                                ││
│ │ Account Cards:                                 ││
│ │ ┌────────────────────────────────────────────┐││
│ │ │ sdf                      [Active]          │││
│ │ │ sdf.com                                    │││
│ │ │ Currency: EUR                              │││
│ │ │ Top-up fee: 5%          ← Variable fee!   │││
│ │ │ Live Balance: [Retry]                      │││
│ │ │                                            │││
│ │ │                    [+ Request Top-Up]      │││
│ │ └────────────────────────────────────────────┘││
│ │                                                ││
│ │ ┌────────────────────────────────────────────┐││
│ │ │ asd                      [Active]          │││
│ │ │ asd                                        │││
│ │ │ Currency: USD                              │││
│ │ │ Top-up fee: 3%          ← Different fee!  │││
│ │ │ Live Balance: [Retry]                      │││
│ │ │                                            │││
│ │ │                    [+ Request Top-Up]      │││
│ │ └────────────────────────────────────────────┘││
│ └────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────┘
```

### Top-Up Request Modal (Dual Payment!)

```
┌─────────────────────────────────────────────────┐
│ Top-Up Request                             [X]  │
├─────────────────────────────────────────────────┤
│ Add funds to your ad account                    │
│                                                  │
│ 📱 Select Ad Account                            │
│ [sdf (EUR)                              ▼]      │
│                                                  │
│ Amount (EUR) *                                   │
│ [e.g., 1000.00_____________________]            │
│ All top-ups are processed in EUR                │
│                                                  │
│ 💰 Fee Calculator  (Appears on amount input)    │
│ ┌───────────────────────────────────────────┐  │
│ │ Ad Account Amount:        €1,000.00       │  │
│ │ Top-up Fee (5%):          €50.00          │  │
│ │ VAT (21% of fee):         €10.50          │  │
│ │ ─────────────────────────────────────     │  │
│ │ Total to Pay:             €1,060.50       │  │
│ └───────────────────────────────────────────┘  │
│                                                  │
│ 💳 Payment Method                               │
│ ┌───────────────────────────────────────────┐  │
│ │ ⚪ Pay from Wallet          [10 Min]      │  │
│ │    Available: €1030.01                     │  │
│ └───────────────────────────────────────────┘  │
│ ┌───────────────────────────────────────────┐  │
│ │ ◯  Bank Transfer            [30 Min]      │  │
│ │    Transfer funds and upload proof         │  │
│ └───────────────────────────────────────────┘  │
│                                                  │
│ Notes (Optional)                                 │
│ [Additional notes________________________]      │
│                                                  │
│ [Cancel]                          [Pay Now]     │
└─────────────────────────────────────────────────┘
```

### Request Ad Account Modal

```
┌─────────────────────────────────────────────────┐
│ Request Ad Account                         [X]  │
├─────────────────────────────────────────────────┤
│ Fill in the details below to request a new ad  │
│ account. Our team will review your request.    │
│                                                  │
│ ℹ️  Reviews take 1 hour                         │
│    Our team will review your request and get   │
│    back to you quickly.                         │
│                                                  │
│ 📝 Account Details                              │
│                                                  │
│ Ad Account Name *                                │
│ [e.g., My Business Campaign_____________]       │
│ Choose a descriptive name for your ad account   │
│                                                  │
│ Domain Name *                                    │
│ [e.g., example.com______________________]       │
│ The domain associated with this ad account      │
│                                                  │
│ Business Manager ID *                            │
│ [e.g., 123456789012345__________________]       │
│ Your Facebook Business Manager ID                │
│                                                  │
│ 🌍 Timezone & Currency                          │
│                                                  │
│ Currency *              Timezone *               │
│ [EUR (€)          ▼]    [Amsterdam (UTC+1) ▼]   │
│                                                  │
│ [Cancel]                   [Submit Request]     │
└─────────────────────────────────────────────────┘
```

### Component Breakdown

1. **WalletPage**
   - Purpose: Display wallet balance and transaction history
   - State: transactions[], filters, dateRange
   - Actions: openAddFunds, filterTransactions

2. **AddFundsModal**
   - Purpose: Show bank transfer flow for wallet top-ups
   - State: amount, reference, proofFile
   - Actions: uploadProof, submitDeposit
   - Note: NO fee calculator (this is wallet top-up, not ad account)

3. **AdAccountsPage**
   - Purpose: List all client's ad accounts
   - State: accounts[], selectedTab ('accounts' | 'requests')
   - Actions: openTopUpModal, openRequestModal

4. **TopUpRequestModal**
   - Purpose: Request ad account top-up with dual payment
   - State: selectedAccount, amount, paymentMethod, feeBreakdown
   - Actions: calculateFee, submitTopUp
   - Note: Fee calculator shows on amount input

5. **RequestAdAccountModal**
   - Purpose: Submit new ad account request
   - State: formData (5 fields)
   - Actions: validateForm, submitRequest
   - Fields: name, domain, bmId, currency, timezone

6. **FeeCalculator** (Component)
   - Purpose: Show fee breakdown
   - Props: amount, feePercentage
   - Returns: { adAmount, fee, vat, total }
   - Formula:
     ```typescript
     fee = amount * (feePercentage / 100)
     vat = fee * 0.21
     total = amount + fee + vat
     ```

---

## 🗄️ Data Model

### API Endpoints (Supabase Functions)

```typescript
// =====================================================
// Wallet Operations
// =====================================================

// Get wallet balance
GET /api/wallet
Response: {
  balance_cents: number
  pending_cents: number
  deposited_cents: number
  spent_cents: number
}

// Create deposit request
POST /api/wallet/deposit
Body: {
  amount_cents: number
  reference?: string
  proof_url: string
}
Response: {
  transaction_id: string
  status: 'pending'
}

// Get transactions
GET /api/wallet/transactions?type=all&status=all&from=&to=
Response: Transaction[]

// =====================================================
// Ad Account Operations
// =====================================================

// Get all client ad accounts
GET /api/ad-accounts
Response: AdAccount[]

// Request ad account top-up
POST /api/ad-accounts/:id/top-up
Body: {
  amount_cents: number
  payment_method: 'wallet' | 'bank_transfer'
  proof_url?: string
}
Response: {
  transaction_id: string
  fee_breakdown: {
    ad_amount: number
    fee: number
    vat: number
    total: number
  }
}

// Create ad account request
POST /api/ad-account-requests
Body: {
  account_name: string
  domain_name: string
  business_manager_id: string
  currency: string
  timezone: string
  platform: 'meta' | 'google' | 'tiktok'
}
Response: {
  request_id: string
  status: 'pending'
}

// Get request history
GET /api/ad-account-requests
Response: AdAccountRequest[]
```

### TypeScript Types

```typescript
// =====================================================
// Wallet Types
// =====================================================
export interface WalletBalance {
  balance: number // in euros
  pending: number
  deposited: number
  spent: number
}

export interface Transaction {
  id: string
  type: 'top_up' | 'transfer' | 'refund' | 'adjustment'
  amount: number // in euros
  status: 'pending' | 'completed' | 'rejected'
  reference: string | null
  proofUrl: string | null
  notes: string | null
  adAccountId: string | null
  adAccountName: string | null
  createdAt: string
  reviewedAt: string | null
  reviewedBy: string | null
}

export interface DepositRequest {
  amount: number // in euros
  reference?: string
  proofFile: File
}

// =====================================================
// Ad Account Types
// =====================================================
export interface AdAccount {
  id: string
  name: string
  accountId: string
  platform: 'meta' | 'google' | 'tiktok'
  currency: string
  timezone: string
  feePercentage: number // e.g., 5.0 for 5%
  status: 'active' | 'disabled'
  balance: number // in euros
  domain: string
}

export interface TopUpRequest {
  adAccountId: string
  amount: number // in euros
  paymentMethod: 'wallet' | 'bank_transfer'
  proofFile?: File
}

export interface FeeBreakdown {
  adAmount: number
  fee: number
  vat: number
  total: number
}

export interface AdAccountRequest {
  id: string
  accountName: string
  domainName: string
  businessManagerId: string
  currency: string
  timezone: string
  platform: 'meta' | 'google' | 'tiktok'
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  createdAt: string
}
```

---

## 🛠️ Technical Implementation

### File Structure

```
app/
├── (client)/
│   ├── wallet/
│   │   └── page.tsx              # Wallet page
│   ├── ad-accounts/
│   │   └── page.tsx              # Ad Accounts page
│   └── invoices/
│       └── page.tsx              # Invoices page (Phase 4)
├── api/
│   ├── wallet/
│   │   ├── route.ts              # GET wallet balance
│   │   ├── deposit/
│   │   │   └── route.ts          # POST deposit request
│   │   └── transactions/
│   │       └── route.ts          # GET transactions
│   ├── ad-accounts/
│   │   ├── route.ts              # GET accounts
│   │   ├── [id]/
│   │   │   └── top-up/
│   │   │       └── route.ts      # POST top-up request
│   │   └── requests/
│   │       └── route.ts          # POST/GET account requests
│   └── upload/
│       └── route.ts              # POST file upload (proof)
components/
├── wallet/
│   ├── WalletStats.tsx           # 4 stat cards
│   ├── TransactionList.tsx       # Transaction history
│   ├── TransactionFilters.tsx    # Type/status/date filters
│   └── AddFundsModal.tsx         # Bank transfer modal
├── ad-accounts/
│   ├── AdAccountCard.tsx         # Single account card
│   ├── AdAccountList.tsx         # List of accounts
│   ├── TopUpRequestModal.tsx     # Top-up modal (dual payment)
│   ├── RequestAdAccountModal.tsx # New account modal
│   └── FeeCalculator.tsx         # Fee breakdown component
├── shared/
│   ├── FileUpload.tsx            # Drag & drop upload
│   └── CopyButton.tsx            # Copy to clipboard
lib/
├── utils/
│   ├── currency.ts               # Format euros
│   ├── fees.ts                   # Fee calculation
│   └── upload.ts                 # Supabase Storage upload
└── hooks/
    ├── useWallet.ts              # Wallet data/mutations
    └── useAdAccounts.ts          # Ad accounts data/mutations
```

### Implementation Phases

#### Phase 2.1: Wallet Management (6 hours)

**Step 1: Create Wallet Stats Component**
- File: `components/wallet/WalletStats.tsx`
- Purpose: Display 4 stat cards (Available, Pending, Deposited, Spent)
- Data: Fetch from `/api/wallet`
- Design: 4 cards in grid, blue for balance, yellow for pending

**Step 2: Build Transaction List**
- File: `components/wallet/TransactionList.tsx`
- Features:
  - Show all transactions with icons (↑ top-up, ↓ deposit)
  - Status badges (green for completed, yellow for pending)
  - Amount formatting (negative for outgoing, positive for incoming)
  - Date formatting (relative: "2 hours ago" or absolute: "Jan 6, 2026")
- Empty state: "No transactions yet"

**Step 3: Add Transaction Filters**
- File: `components/wallet/TransactionFilters.tsx`
- Filters:
  - Type: All, Top-Up, Deposit, Transfer, Refund
  - Status: All, Pending, Completed, Rejected
  - Date range: From/To pickers
  - Sort: Newest, Oldest, Highest Amount
- Apply filters client-side (for performance)

**Step 4: Create Add Funds Modal**
- File: `components/wallet/AddFundsModal.tsx`
- Features:
  - Quick amount buttons (€50, €100, €250, €500, €1000)
  - Custom amount input (min €10)
  - Bank details display (Beneficiary, IBAN, BIC) with copy buttons
  - Reference input (optional)
  - File upload for proof (drag & drop or click)
  - Submit button → creates pending transaction
- NO fee calculator (wallet top-ups are fee-free)

**Step 5: Build Wallet Page**
- File: `app/(client)/wallet/page.tsx`
- Layout:
  - Header with "Add Funds" button
  - WalletStats component
  - TransactionFilters component
  - TransactionList component
- Data: React Query for wallet balance + transactions

#### Phase 2.2: Ad Accounts Display (5 hours)

**Step 1: Create Ad Account Card**
- File: `components/ad-accounts/AdAccountCard.tsx`
- Props: `account: AdAccount`
- Display:
  - Account name + domain
  - Platform icon (Meta/Google/TikTok)
  - Currency badge
  - **Fee percentage (variable!)** - e.g., "Top-up fee: 5%"
  - Balance (with retry button if error)
  - Status badge (Active/Disabled)
  - "Request Top-Up" button
- Design: Card with shadow, hover effect

**Step 2: Build Account List**
- File: `components/ad-accounts/AdAccountList.tsx`
- Features:
  - Search by name/domain
  - Grid layout (2 columns on desktop)
  - Empty state: "No accounts yet. Request one!"
- Data: Fetch from `/api/ad-accounts`

**Step 3: Add Account Stats**
- Purpose: Show aggregated stats (Total, Active, Balance)
- Display: 3 cards above account list
- Calculate: Client-side from accounts array

**Step 4: Build Ad Accounts Page**
- File: `app/(client)/ad-accounts/page.tsx`
- Features:
  - Tabs: "Accounts" | "Requests"
  - Accounts tab: Stats + Search + Account List
  - Requests tab: Request history (Phase 2.3)
  - "New Request" button (opens modal)

#### Phase 2.3: Request Flows (7 hours)

**Step 1: Create Fee Calculator Component**
- File: `components/ad-accounts/FeeCalculator.tsx`
- Props: `amount: number, feePercentage: number`
- Calculate:
  ```typescript
  const fee = amount * (feePercentage / 100)
  const vat = fee * 0.21
  const total = amount + fee + vat
  ```
- Display: Breakdown table with totals
- Design: Light blue background, bold total

**Step 2: Build Top-Up Request Modal**
- File: `components/ad-accounts/TopUpRequestModal.tsx`
- Features:
  - Account dropdown (if multiple accounts)
  - Amount input → triggers fee calculator on change
  - Fee calculator (appears when amount > 0)
  - Payment method radio:
    - **Pay from Wallet** (green badge "10 Min")
      - Check: wallet balance >= total
      - If insufficient → show error + disable option
    - **Bank Transfer** (yellow badge "30 Min")
      - Show bank details + proof upload
  - Notes textarea (optional)
  - Submit button → creates transaction
- Validation:
  - Amount required (min €1)
  - If wallet payment: balance must be sufficient
  - If bank transfer: proof required

**Step 3: Create Request Ad Account Modal**
- File: `components/ad-accounts/RequestAdAccountModal.tsx`
- Form fields:
  1. Ad Account Name (text, required)
  2. Domain Name (text, required, validate URL format)
  3. Business Manager ID (text, required, validate numeric)
  4. Currency (dropdown: EUR, USD, GBP)
  5. Timezone (dropdown: Amsterdam, London, New York, etc.)
- Info banner: "Reviews take 1 hour"
- Submit → POST to `/api/ad-account-requests`
- Success → close modal + show toast + refresh requests list

**Step 4: Build Request History View**
- File: `components/ad-accounts/RequestHistoryList.tsx`
- Features:
  - Show all requests (account requests + top-up requests)
  - Group by type (with icons)
  - Status badges (pending/approved/rejected)
  - Timestamps (created, reviewed)
  - Reviewer name (if reviewed)
  - Rejection reason (if rejected)
- Empty state: "No requests yet"

**Step 5: Add File Upload Component**
- File: `components/shared/FileUpload.tsx`
- Features:
  - Drag & drop area
  - Click to upload
  - File preview (image thumbnail or filename)
  - Remove button
  - Upload to Supabase Storage
  - Progress indicator
- Accepted: images (png, jpg, jpeg), PDFs
- Max size: 5MB

#### Phase 2.4: API Routes (4 hours)

**Step 1: Wallet API**
- Files:
  - `app/api/wallet/route.ts` (GET balance)
  - `app/api/wallet/deposit/route.ts` (POST deposit request)
  - `app/api/wallet/transactions/route.ts` (GET transactions)
- Logic:
  - GET balance: Sum transactions by status
  - POST deposit: Create pending transaction + upload proof
  - GET transactions: Filter by type/status/date, paginate

**Step 2: Ad Accounts API**
- Files:
  - `app/api/ad-accounts/route.ts` (GET accounts)
  - `app/api/ad-accounts/[id]/top-up/route.ts` (POST top-up)
  - `app/api/ad-account-requests/route.ts` (POST/GET requests)
- Logic:
  - GET accounts: Fetch from database with RLS
  - POST top-up:
    - Calculate fee breakdown
    - If wallet payment: check balance, deduct from wallet
    - If bank transfer: create pending transaction
  - POST request: Create ad_account_request record
  - GET requests: Fetch with status filters

**Step 3: Upload API**
- File: `app/api/upload/route.ts`
- Purpose: Upload files to Supabase Storage
- Logic:
  - Validate file type + size
  - Generate unique filename
  - Upload to bucket: `transaction-proofs`
  - Return public URL
- Security: Only authenticated users, max 5MB

#### Phase 2.5: Utility Functions (2 hours)

**Step 1: Currency Utilities**
- File: `lib/utils/currency.ts`
```typescript
export function centsToEuros(cents: number): number {
  return cents / 100
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}

export function formatCurrency(
  amount: number,
  currency: string = 'EUR'
): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency
  }).format(amount)
}
```

**Step 2: Fee Calculation**
- File: `lib/utils/fees.ts`
```typescript
export interface FeeBreakdown {
  adAmount: number
  fee: number
  vat: number
  total: number
}

export function calculateFee(
  amount: number,
  feePercentage: number
): FeeBreakdown {
  const fee = amount * (feePercentage / 100)
  const vat = fee * 0.21
  const total = amount + fee + vat
  
  return {
    adAmount: amount,
    fee,
    vat,
    total
  }
}
```

**Step 3: React Query Hooks**
- File: `lib/hooks/useWallet.ts`
```typescript
export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await fetch('/api/wallet')
      return res.json()
    }
  })
}

export function useTransactions(filters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters)
      const res = await fetch(`/api/wallet/transactions?${params}`)
      return res.json()
    }
  })
}

export function useDepositMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: DepositRequest) => {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['wallet'])
      queryClient.invalidateQueries(['transactions'])
    }
  })
}
```

#### Phase 2.6: Testing & Polish (3 hours)

**Unit Tests:**
- `lib/utils/fees.test.ts`: Fee calculation accuracy
- `lib/utils/currency.test.ts`: Currency formatting
- `components/ad-accounts/FeeCalculator.test.tsx`: Component rendering

**Integration Tests:**
- Wallet top-up flow: Select amount → upload proof → submit
- Ad account top-up (wallet): Check balance → pay → success
- Ad account top-up (bank): Upload proof → submit → pending
- Account request: Fill form → submit → pending

**Manual Testing:**
- [ ] Wallet page loads with correct balances
- [ ] Add Funds modal shows bank details
- [ ] Upload proof → file saves to Supabase Storage
- [ ] Transaction list shows recent transactions
- [ ] Filters work correctly
- [ ] Ad accounts show with variable fees
- [ ] Top-up modal calculates fees correctly
- [ ] Wallet payment checks balance
- [ ] Bank transfer requires proof upload
- [ ] Account request creates pending request
- [ ] Request history shows all requests

---

## ✅ Acceptance Criteria

### Must Have (MVP)
- [ ] Wallet page displays balance stats (available, pending, deposited, spent)
- [ ] Add Funds modal shows Revolut bank details with copy buttons
- [ ] Clients can upload proof of payment (image or PDF)
- [ ] Transaction list shows history with filters
- [ ] Ad Accounts page displays all accounts with variable fees
- [ ] Fee calculator appears and calculates correctly (ad account top-ups only)
- [ ] Top-up request modal offers dual payment (wallet vs bank transfer)
- [ ] Wallet payment checks balance before allowing submission
- [ ] Bank transfer payment requires proof upload
- [ ] Account request form captures all 5 fields
- [ ] Request history shows pending/approved/rejected status
- [ ] All amounts display in euros with proper formatting
- [ ] File uploads work to Supabase Storage
- [ ] No TypeScript errors
- [ ] No console errors

### Should Have (Post-MVP)
- [ ] Transaction export (CSV download)
- [ ] Email notifications on request status changes
- [ ] Receipt download for completed top-ups

### Nice to Have (Future)
- [ ] Automatic balance refresh (polling)
- [ ] Push notifications for approvals
- [ ] Bulk top-up (multiple accounts at once)

---

## 🚧 Edge Cases & Error Handling

### Edge Case 1: Insufficient wallet balance
**Scenario:** User tries to pay from wallet but balance < total  
**Handling:** Disable "Pay from Wallet" option, show message: "Insufficient balance. Add €X to your wallet or use bank transfer."

### Edge Case 2: File upload fails
**Scenario:** Network error during proof upload  
**Handling:** Show retry button, keep form data, toast error: "Upload failed. Please try again."

### Edge Case 3: Duplicate request submitted
**Scenario:** User clicks submit button multiple times  
**Handling:** Disable button after first click, show loading spinner

### Edge Case 4: Account has no fee percentage set
**Scenario:** Legacy account with null fee_percentage  
**Handling:** Default to 0%, show admin warning in logs

### Error Case 1: API timeout
**Scenario:** Supabase request takes > 30s  
**Handling:** Show error toast: "Request timed out. Please try again." with retry button

### Error Case 2: Invalid file type
**Scenario:** User uploads .exe or other invalid file  
**Handling:** Show error: "Invalid file type. Please upload PNG, JPG, or PDF only."

---

## 🧪 Testing Strategy

### Unit Tests

**`lib/utils/fees.test.ts`:**
- ✓ Calculates 5% fee correctly
- ✓ Calculates 21% VAT on fee only
- ✓ Total = amount + fee + VAT
- ✓ Handles decimal percentages (3.5%)
- ✓ Rounds to 2 decimal places

**`components/ad-accounts/FeeCalculator.test.tsx`:**
- ✓ Shows breakdown when amount > 0
- ✓ Hides when amount = 0
- ✓ Updates on amount change
- ✓ Formats currency correctly

### Integration Tests

**Wallet Top-Up Flow:**
1. Go to wallet page
2. Click "Add Funds"
3. Enter €100
4. Upload proof (test image)
5. Click submit
6. Verify: Transaction created with status "pending"
7. Verify: Modal closes
8. Verify: Toast success message

**Ad Account Top-Up (Wallet Payment):**
1. Go to ad accounts page
2. Click "Request Top-Up" on sdf account (5% fee)
3. Enter €100
4. See fee calculator: €100 + €5 + €1.05 = €106.05
5. Select "Pay from Wallet"
6. Verify: Balance check passes
7. Click "Pay Now"
8. Verify: Wallet balance decreased by €106.05
9. Verify: Transaction created

**Ad Account Top-Up (Bank Transfer):**
1. Same as above but select "Bank Transfer"
2. Upload proof
3. Submit
4. Verify: Transaction status "pending"
5. Verify: Proof URL saved

**Account Request:**
1. Click "Request Ad Account"
2. Fill all 5 fields
3. Submit
4. Verify: Request created with status "pending"
5. Go to Requests tab
6. Verify: Request appears in list

---

## 🎯 OpenCode Implementation Instructions

### Before Starting

1. **Verify Phase 1 Complete:**
   ```bash
   # Check database tables exist
   # Check auth works
   # Check layouts render
   ```

2. **Install Additional Dependencies:**
   ```bash
   npm install @tanstack/react-query react-dropzone date-fns
   ```

### Implementation Order

**Phase 2.1: Wallet Management** (Start here)
1. Create wallet stats component
2. Build transaction list
3. Add filters
4. Create Add Funds modal
5. Build wallet page

**Phase 2.2: Ad Accounts Display**
1. Create ad account card
2. Build account list
3. Add account stats
4. Build ad accounts page

**Phase 2.3: Request Flows**
1. Create fee calculator
2. Build top-up request modal
3. Create account request modal
4. Build request history view
5. Add file upload component

**Phase 2.4: API Routes**
1. Wallet API endpoints
2. Ad Accounts API endpoints
3. Upload API endpoint

**Phase 2.5: Utilities**
1. Currency utils
2. Fee calculation
3. React Query hooks

**Phase 2.6: Testing**
1. Unit tests
2. Integration tests
3. Manual testing

### Verification Checklist
- [ ] Wallet page loads with stats
- [ ] Add Funds shows bank details
- [ ] Upload works (check Supabase Storage)
- [ ] Transactions display correctly
- [ ] Ad accounts show with fees
- [ ] Fee calculator calculates correctly
- [ ] Dual payment options work
- [ ] Account requests submit successfully
- [ ] Request history displays
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console errors

---

## 📚 References

### Current Portal Screenshots
- Wallet page: Available, Pending, Deposited, Spent cards
- Add Funds modal: Revolut bank details
- Ad Accounts: Variable fees (5% vs 3%)
- Top-Up modal: Dual payment options
- Account request: 5-field form

### Technical Documentation
- React Query: https://tanstack.com/query/latest
- React Dropzone: https://react-dropzone.js.org
- Supabase Storage: https://supabase.com/docs/guides/storage

---

## 📋 COPY-PASTE READY

**Save this specification to:**
```
docs/fase-docs/phase-2-core-client-features-spec.md
```

**Then in OpenCode:**
```
"Build Phase 2 Core Client Features from docs/fase-docs/phase-2-core-client-features-spec.md"
```

**Estimated Time:** 25-27 hours total

**Result:** Complete client-facing features ready! 🎉

---

*Generated by fase-docs skill - Phase 2 Core Client Features*  
*Ready for OpenCode implementation*  
*Tested with real portal flows*
