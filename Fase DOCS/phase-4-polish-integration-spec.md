# Feature Specification: Phase 4 - Polish & Integration

*OpenCode Implementation Guide - AdCure Client Portal Rebuild*  
*Context Mode: Full Context*  
Generated: April 10, 2026

---

## 🎯 Phase Overview

### Goal
Complete the portal with invoicing (Moneybird integration), email notifications, final UI polish, and production deployment. This phase transforms the MVP into a production-ready system.

### User Stories
- As a **client**, I want to receive invoices automatically so that I have proper documentation
- As a **client**, I want email notifications on request status so that I stay informed
- As an **admin**, I want Moneybird integration to work reliably so that bookkeeping is automated
- As a **developer**, I want proper error handling so that bugs are caught early

### Success Criteria
- [ ] Invoices auto-generate on completed top-ups
- [ ] Moneybird creates invoices without errors
- [ ] Clients receive invoice PDFs via email
- [ ] Email notifications sent on all status changes
- [ ] Error boundaries catch and display errors gracefully
- [ ] Loading states prevent UI jank
- [ ] Production deployment successful

---

## 🛠️ Implementation Phases

### Phase 4.1: Invoicing System (8 hours)

**Invoices Page** (`app/(client)/invoices/page.tsx`)

**Features:**
- Stats: Total Invoices (11), Total Amount (€253,411), Latest (Jan 2026)
- Invoice list:
  - Invoice number
  - Account name
  - Date
  - Amount
  - Status badges: "created" | "sent" | "paid"
  - **[Preview]** button → opens PDF in modal
  - **[Download]** button → downloads PDF
- Search by invoice number/account
- Filter by status/date range

**Auto-Invoice Generation:**
```typescript
// Trigger: When transaction status changes to 'completed'
// Function: generateInvoice(transactionId)

async function generateInvoice(transactionId: string) {
  // 1. Fetch transaction details
  const transaction = await getTransaction(transactionId)
  
  // 2. Calculate amounts
  const amount = transaction.amount_cents / 100
  const vat = amount * 0.21 // 21% VAT on wallet top-ups
  const total = amount + vat
  
  // 3. Create invoice in database
  const invoice = await createInvoice({
    transaction_id: transactionId,
    invoice_number: generateInvoiceNumber(), // e.g., "INV-2026-001234"
    amount_cents: transaction.amount_cents,
    vat_cents: Math.round(vat * 100),
    total_cents: Math.round(total * 100),
    status: 'created'
  })
  
  // 4. Send to Moneybird
  const moneybirdInvoice = await createMoneybirdInvoice({
    invoice_number: invoice.invoice_number,
    client_email: transaction.user.email,
    client_name: transaction.user.full_name,
    amount_cents: invoice.amount_cents,
    vat_cents: invoice.vat_cents,
    description: `Wallet top-up - ${formatDate(transaction.created_at)}`
  })
  
  // 5. Update invoice with Moneybird ID
  await updateInvoice(invoice.id, {
    moneybird_id: moneybirdInvoice.id,
    status: 'sent'
  })
  
  // 6. Send email to client
  await sendInvoiceEmail({
    to: transaction.user.email,
    invoice_number: invoice.invoice_number,
    pdf_url: moneybirdInvoice.pdf_url
  })
  
  return invoice
}
```

**Moneybird API Integration:**
```typescript
// lib/moneybird/client.ts

import { MoneyBird } from 'moneybird-js'

export const moneybird = new MoneyBird({
  apiKey: process.env.MONEYBIRD_API_KEY!,
  administrationId: process.env.MONEYBIRD_ADMINISTRATION_ID!
})

export async function createMoneybirdInvoice(data: {
  invoice_number: string
  client_email: string
  client_name: string
  amount_cents: number
  vat_cents: number
  description: string
}) {
  // Find or create contact
  const contact = await moneybird.contacts.findOrCreate({
    company_name: data.client_name,
    email: data.client_email
  })
  
  // Create invoice
  const invoice = await moneybird.invoices.create({
    contact_id: contact.id,
    invoice_date: new Date(),
    invoice_number: data.invoice_number,
    details_attributes: [
      {
        description: data.description,
        price: (data.amount_cents / 100).toFixed(2),
        tax_rate_id: 'NL_21', // 21% VAT
      }
    ]
  })
  
  // Send invoice to client
  await moneybird.invoices.send(invoice.id, {
    email_address: data.client_email,
    email_message: 'Your invoice from AdCure Agency'
  })
  
  return invoice
}
```

### Phase 4.2: Email Notifications (6 hours)

**Email Templates** (using Resend.com)

**Templates to Create:**
1. **Account Request Approved**
   - Subject: "Your ad account request has been approved"
   - Body: Account details, next steps
   
2. **Account Request Rejected**
   - Subject: "Your ad account request needs attention"
   - Body: Rejection reason, what to fix

3. **Top-Up Approved**
   - Subject: "Your top-up has been processed"
   - Body: Amount, account name, new balance

4. **Top-Up Rejected**
   - Subject: "Your top-up could not be processed"
   - Body: Rejection reason, retry instructions

5. **Invoice Available**
   - Subject: "Your invoice is ready"
   - Body: Invoice number, amount, download link

**Implementation:**
```typescript
// lib/email/send.ts

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendAccountApprovedEmail(data: {
  to: string
  account_name: string
  account_id: string
  platform: string
}) {
  return resend.emails.send({
    from: 'AdCure <noreply@adcure.agency>',
    to: data.to,
    subject: 'Your ad account request has been approved',
    html: `
      <h1>Great news!</h1>
      <p>Your ad account request has been approved.</p>
      <p><strong>Account Details:</strong></p>
      <ul>
        <li>Name: ${data.account_name}</li>
        <li>ID: ${data.account_id}</li>
        <li>Platform: ${data.platform}</li>
      </ul>
      <p>You can now top up this account from your dashboard.</p>
    `
  })
}

// Similar functions for other email types...
```

### Phase 4.3: Error Handling & Polish (6 hours)

**Error Boundaries:**
```typescript
// components/ErrorBoundary.tsx

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log to Sentry or similar
        console.error('Error caught:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button onClick={resetErrorBoundary} className="btn-primary">
          Try again
        </button>
      </div>
    </div>
  )
}
```

**Loading States:**
- Skeleton loaders for dashboard cards
- Spinner for async actions (approve/reject)
- Progress bars for file uploads
- Optimistic updates where appropriate

**Toast Notifications:**
```typescript
// Use sonner for toast notifications

import { toast } from 'sonner'

// Success
toast.success('Top-up approved successfully!')

// Error
toast.error('Failed to approve top-up. Please try again.')

// Loading
const toastId = toast.loading('Processing...')
// Later:
toast.success('Done!', { id: toastId })
```

### Phase 4.4: Production Deployment (4 hours)

**Environment Setup:**
```bash
# Production environment variables

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Moneybird
MONEYBIRD_API_KEY=xxx
MONEYBIRD_ADMINISTRATION_ID=xxx

# Email (Resend)
RESEND_API_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=https://portal.adcure.agency
```

**Deployment Checklist:**
- [ ] Vercel project connected to GitHub
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured (portal.adcure.agency)
- [ ] SSL certificate active
- [ ] Supabase Pro plan active
- [ ] Database backups enabled
- [ ] Moneybird integration tested
- [ ] Email delivery tested
- [ ] Error tracking enabled (Sentry)
- [ ] Analytics enabled (Vercel Analytics)

**Migration Plan:**
1. Deploy to staging (test.portal.adcure.agency)
2. Run full QA test suite
3. Migrate production data (if applicable)
4. Deploy to production
5. Monitor for 24 hours
6. Fix any issues
7. Sunset old portal

---

## ✅ Acceptance Criteria

### Must Have (MVP)
- [ ] Invoices auto-generate on completed top-ups
- [ ] Moneybird integration works without errors
- [ ] Invoice PDFs downloadable
- [ ] Email notifications sent on all status changes
- [ ] Error boundaries catch errors
- [ ] Loading states prevent UI jank
- [ ] Production deployed successfully
- [ ] Custom domain working (portal.adcure.agency)
- [ ] SSL certificate active

### Should Have (Post-MVP)
- [ ] Error tracking with Sentry
- [ ] Analytics dashboard
- [ ] Performance monitoring

### Nice to Have (Future)
- [ ] Automated testing in CI/CD
- [ ] A/B testing framework
- [ ] Advanced analytics

---

## 🧪 Testing Strategy

**E2E Tests (Playwright):**
- Complete user journey: Login → Add funds → Approve → Invoice generated → Email sent
- Admin journey: Approve request → Client notified → Account created
- Error scenarios: Moneybird API failure → fallback handling

**Load Testing:**
- 100 concurrent users
- 1000 transactions per hour
- Database query performance

---

## 📋 COPY-PASTE READY

**Save to:** `docs/fase-docs/phase-4-polish-integration-spec.md`

**Then in OpenCode:**
```
"Build Phase 4 Polish & Integration from docs/fase-docs/phase-4-polish-integration-spec.md"
```

**Estimated Time:** 24 hours

**Total Project Time:** 85-95 hours (6-8 weeks at 12-14h/week)

---

## 🎉 POST-LAUNCH

After Phase 4:
- Monitor error rates (aim for < 0.1%)
- Track user adoption (invite clients gradually)
- Gather feedback (built-in feedback widget)
- Iterate on pain points
- Plan Phase 5 (future features)

---

*Generated by fase-docs skill - Phase 4 Polish & Integration*  
*Ready for OpenCode implementation*  
*Final phase - bring it home! 🚀*
