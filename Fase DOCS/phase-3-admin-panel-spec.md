# Feature Specification: Phase 3 - Admin Panel

*OpenCode Implementation Guide - AdCure Client Portal Rebuild*  
*Context Mode: Full Context*  
Generated: April 10, 2026

---

## 🎯 Phase Overview

### Goal
Build comprehensive admin panel for managing clients, verifying transactions, approving account requests, and monitoring system health. Admins need efficient tools to handle the 26.4h avg review time and manage 37 wallets totaling €1.9M.

### User Stories
- As an **admin**, I want to see all pending account requests so that I can approve/reject them quickly
- As an **admin**, I want to verify wallet top-ups by viewing proof of payment so that I can release funds
- As an **admin**, I want to manage all users in a card grid so that I can easily update contact info
- As an **admin**, I want to see critical alerts so that I can respond to urgent issues
- As an **admin**, I want to view revenue charts so that I can track business performance

### Success Criteria
- [ ] Admin dashboard shows aggregated stats across all clients
- [ ] Account Requests page allows approve/reject with one click
- [ ] Wallet management shows pending deposits with proof viewer
- [ ] User management displays card grid with search/filters
- [ ] Critical alerts banner shows urgent actions
- [ ] Revenue chart displays 7-day trends
- [ ] All actions require admin role (RLS enforced)

---

## 🛠️ Implementation Phases

### Phase 3.1: Admin Dashboard (4 hours)

**Components:**
- **AdminDashboard** (`app/(agency)/dashboard/page.tsx`)
  - 4 stat cards: Total Clients (35), Total Balance (€35,315), Client Wallet (€1.9M), Open Conversations (5)
  - Revenue chart (7 days) using Recharts
  - Pending Actions widget (1 account request, 0 top-ups)
  - Recent Activity feed (last 10 actions)
  - Critical Alerts banner (if > 0)

**Data Queries:**
```typescript
// Aggregate stats across all organizations
SELECT 
  COUNT(DISTINCT org.id) as total_clients,
  SUM(aa.balance_cents) as total_ad_balance,
  SUM(w.balance_cents) as total_wallet_balance
FROM organizations org
LEFT JOIN ad_accounts aa ON aa.organization_id = org.id
LEFT JOIN wallets w ON w.organization_id = org.id
WHERE org.type = 'client'

// Revenue (last 7 days)
SELECT 
  DATE(created_at) as date,
  SUM(amount_cents) as revenue_cents
FROM transactions
WHERE type = 'top_up' 
  AND status = 'completed'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date ASC
```

### Phase 3.2: Account Request Management (5 hours)

**Account Requests Page** (`app/(agency)/ad-accounts/page.tsx` → Requests tab)

**Features:**
- Stats: Pending (1), Approved (49), Rejected (14), Avg Time (26.4h)
- Request cards showing:
  - Account name + domain
  - Business Manager ID
  - Currency + timezone
  - Client email
  - Requested date
  - Approve/Reject buttons
- Approve flow:
  - Click → confirmation modal
  - Copy data to clipboard (for Google Sheet)
  - Mark as approved
  - Send email to client (optional)
- Reject flow:
  - Click → rejection reason input
  - Mark as rejected
  - Send email to client

**Google Sheet Data Format:**
```
Account Name: [name]
Domain: [domain]
Business Manager ID: [bmId]
Currency: [currency]
Timezone: [timezone]
Client Email: [email]
```

**API Endpoint:**
```typescript
PATCH /api/admin/ad-account-requests/:id
Body: {
  status: 'approved' | 'rejected'
  rejection_reason?: string
}
```

### Phase 3.3: Wallet Verification (6 hours)

**Wallet Management Page** (`app/(agency)/wallets/page.tsx`)

**Features:**
- Stats: Total Balance (€1,909.97), Total Deposited (€39,686.10), Pending (€0.00), Active Wallets (37)
- Client wallet cards showing:
  - Client name + email
  - Current balance
  - Total deposited (lifetime)
  - View details button
- **Pending Deposits Tab:**
  - List of pending top-up transactions
  - Each row shows:
    - Client name
    - Amount
    - Reference number
    - Upload date
    - **[View Proof]** button → opens modal with image/PDF
    - **[Approve]** / **[Reject]** buttons
- Approve flow:
  - Update transaction status to 'completed'
  - Add amount to wallet balance
  - Trigger Moneybird invoice generation
  - Send confirmation email
- Reject flow:
  - Update transaction status to 'rejected'
  - Add rejection reason
  - Send rejection email

**Proof Viewer Modal:**
- Display image (if image file)
- Display PDF in iframe (if PDF)
- Zoom in/out controls
- Close button

### Phase 3.4: User Management (5 hours)

**User Management Page** (`app/(agency)/management/users/page.tsx`)

**Features:**
- Search by name/email/company
- Filter by: All, Client, Agency
- Sort by: Name, Email, Created Date
- **User Cards Grid (4 columns):**
  - Avatar (initial letter)
  - Full name
  - Email + phone
  - Company name
  - Badges: "client" | "agency_admin", "active" | "disabled"
  - Actions menu (⋮):
    - Edit user
    - Disable/Enable
    - Reset password
    - Delete user
- Edit User Modal:
  - Update: name, phone, company, role
  - Save → update database
- Create User Button:
  - Form: email, name, role, organization
  - Submit → invite email sent

**API Endpoints:**
```typescript
GET /api/admin/users?search=&role=&status=
PATCH /api/admin/users/:id
POST /api/admin/users (create)
DELETE /api/admin/users/:id
```

### Phase 3.5: Critical Alerts System (3 hours)

**Alerts Banner** (top of Admin Dashboard)

**Alert Types:**
- Pending account requests > 24h old
- Pending deposits > 48h old
- Failed invoice generations
- Low wallet balance (< €10)
- Disabled ad accounts with pending requests

**Alert Banner Component:**
```typescript
interface Alert {
  id: string
  type: 'account_request' | 'deposit' | 'invoice' | 'low_balance'
  severity: 'critical' | 'warning' | 'info'
  message: string
  count: number
  actionUrl: string
}

// Example: "9 Critical Alerts - Require immediate attention"
// Click → navigate to relevant page (e.g., pending deposits)
```

### Phase 3.6: Monitoring & Analytics (4 hours)

**Monitoring Page** (`app/(agency)/management/monitoring/page.tsx`)

**Metrics:**
- Total transactions (by type)
- Success rate (completed / total)
- Average review time (account requests)
- Average response time (support tickets)
- Top clients by spend
- Platform distribution (Meta vs Google vs TikTok)
- Currency distribution (EUR vs USD vs GBP)

**Charts:**
- Revenue over time (30 days)
- Transaction volume (30 days)
- Client growth (monthly)
- Platform usage (pie chart)

---

## ✅ Acceptance Criteria

### Must Have (MVP)
- [ ] Admin dashboard shows aggregated stats
- [ ] Account requests can be approved/rejected
- [ ] Data can be copied for Google Sheet
- [ ] Pending deposits show proof viewer
- [ ] Wallet verification approves/rejects deposits
- [ ] User management displays card grid
- [ ] Users can be edited/created/deleted
- [ ] Critical alerts banner shows urgent issues
- [ ] All admin pages enforce agency_admin role (RLS)

### Should Have (Post-MVP)
- [ ] Email notifications on status changes
- [ ] Bulk approve/reject
- [ ] Activity log (audit trail)

### Nice to Have (Future)
- [ ] Advanced analytics dashboard
- [ ] Export reports (PDF/Excel)
- [ ] Automated fraud detection

---

## 🧪 Testing Strategy

**Integration Tests:**
- Approve account request → creates ad_account record
- Reject account request → sends rejection email
- Verify deposit → updates wallet balance + triggers invoice
- Reject deposit → sends rejection email
- Edit user → updates database
- Delete user → cascades properly

**Security Tests:**
- Client cannot access /agency/* routes
- Client cannot call admin API endpoints
- RLS prevents data leaks

---

## 📋 COPY-PASTE READY

**Save to:** `docs/fase-docs/phase-3-admin-panel-spec.md`

**Then in OpenCode:**
```
"Build Phase 3 Admin Panel from docs/fase-docs/phase-3-admin-panel-spec.md"
```

**Estimated Time:** 25-27 hours

---

*Generated by fase-docs skill - Phase 3 Admin Panel*  
*Ready for OpenCode implementation*
