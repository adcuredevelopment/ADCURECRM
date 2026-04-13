# Feature Specification: Admin Approval Workflow

*OpenCode Implementation Guide - Review & Activate Account Applications*  
Generated: April 13, 2026

---

## 🎯 Feature Overview

### Goal
Enable admins to review pending account applications, approve qualified applicants (creating their user account), or reject with a reason. This is the admin-side complement to the Sign-Up Flow.

### User Stories
- As an **admin**, I want to see all pending applications so that I can review them
- As an **admin**, I want to approve applications so that clients can start using the portal
- As an **admin**, I want to reject applications with a reason so that applicants know why
- As a **client**, I want to receive my login credentials after approval so that I can access the portal

### Success Criteria
- [ ] Admin sees list of pending applications
- [ ] Admin can view application details
- [ ] Approve button creates: Organization + Auth User + Database User + Wallet
- [ ] Approve sends welcome email with password reset link
- [ ] Reject button sends rejection email with reason
- [ ] Application status updates correctly
- [ ] No duplicate accounts created

---

## 🎨 Admin Dashboard Integration

### Applications Page

**Location:** `/agency/account-applications`

```
┌──────────────────────────────────────────────────────────┐
│ Account Applications                    [Stats]          │
├──────────────────────────────────────────────────────────┤
│ ┌─Stats──────────────────────────────────────────────┐  │
│ │ Pending: 3  │  Approved: 49  │  Rejected: 14       │  │
│ │ Avg Review Time: 26.4h                              │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
│ Filters: [● Pending] [○ Approved] [○ Rejected] [○ All]  │
│                                                           │
│ ┌──Application Card────────────────────────────────┐    │
│ │ qriuap                          [🟡 Pending]     │    │
│ │ Jessy Pinas                                      │    │
│ │ vacemarket@gmail.com · +31640802980              │    │
│ │                                                   │    │
│ │ ✓ KVK: 83611398                                  │    │
│ │ ✓ BTW: NL004963469B68                            │    │
│ │ ✓ IBAN: (not provided)                           │    │
│ │                                                   │    │
│ │ Applied: Apr 9, 2026 (3 days ago)                │    │
│ │                                                   │    │
│ │ [✓ Approve]  [✗ Reject]  [👁️ View Details]       │    │
│ └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation

### File Structure
```
app/(agency)/
├── account-applications/
│   ├── page.tsx                           # Applications list
│   └── [id]/
│       └── page.tsx                       # Detail view
└── api/
    └── account-applications/
        └── [id]/
            ├── approve/route.ts           # POST: Approve
            └── reject/route.ts            # POST: Reject

components/admin/
├── ApplicationCard.tsx                    # Single application
├── ApplicationsList.tsx                   # List view
├── ApproveButton.tsx                      # Approve action
└── RejectModal.tsx                        # Rejection form
```

---

## 🔧 Approval Logic (Critical!)

### Approve Workflow

```typescript
// app/api/account-applications/[id]/approve/route.ts

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  // 1. Get application
  const { data: app } = await supabase
    .from('account_applications')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (!app || app.status !== 'pending') {
    return NextResponse.json(
      { error: 'Invalid application' },
      { status: 400 }
    )
  }
  
  // 2. Create organization
  const { data: org } = await supabase
    .from('organizations')
    .insert({
      name: app.company_name,
      type: 'client'
    })
    .select()
    .single()
  
  // 3. Create Supabase Auth user
  const { data: authUser, error: authError } = 
    await supabase.auth.admin.createUser({
      email: app.email,
      email_confirm: true,
      user_metadata: {
        full_name: app.full_name,
        company_name: app.company_name,
        kvk_number: app.kvk_number,
        vat_number: app.vat_number
      }
    })
  
  if (authError) {
    // Rollback organization
    await supabase.from('organizations').delete().eq('id', org.id)
    throw new Error(`Auth user creation failed: ${authError.message}`)
  }
  
  // 4. Create users table record
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      organization_id: org.id,
      email: app.email,
      full_name: app.full_name,
      phone: app.phone,
      company_name: app.company_name,
      role: 'client'
    })
  
  if (userError) {
    // Rollback auth user + organization
    await supabase.auth.admin.deleteUser(authUser.user.id)
    await supabase.from('organizations').delete().eq('id', org.id)
    throw new Error(`User record creation failed: ${userError.message}`)
  }
  
  // 5. Create wallet
  const { error: walletError } = await supabase
    .from('wallets')
    .insert({
      organization_id: org.id,
      balance_cents: 0,
      currency: 'EUR'
    })
  
  if (walletError) {
    // Rollback all
    await supabase.auth.admin.deleteUser(authUser.user.id)
    await supabase.from('users').delete().eq('id', authUser.user.id)
    await supabase.from('organizations').delete().eq('id', org.id)
    throw new Error(`Wallet creation failed: ${walletError.message}`)
  }
  
  // 6. Update application status
  await supabase
    .from('account_applications')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', params.id)
  
  // 7. Send password reset email (so user can set password)
  await supabase.auth.resetPasswordForEmail(app.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password`
  })
  
  // 8. Send welcome email
  await sendEmail({
    to: app.email,
    template: 'account_approved',
    data: {
      full_name: app.full_name,
      company_name: app.company_name,
      login_url: `${process.env.NEXT_PUBLIC_APP_URL}/login`
    }
  })
  
  return NextResponse.json({ 
    success: true,
    organization_id: org.id,
    user_id: authUser.user.id
  })
}
```

### Reject Workflow

```typescript
// app/api/account-applications/[id]/reject/route.ts

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  const { rejection_reason } = await request.json()
  
  if (!rejection_reason) {
    return NextResponse.json(
      { error: 'Rejection reason required' },
      { status: 400 }
    )
  }
  
  // 1. Get application
  const { data: app } = await supabase
    .from('account_applications')
    .select('*')
    .eq('id', params.id)
    .single()
  
  // 2. Update status
  await supabase
    .from('account_applications')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason
    })
    .eq('id', params.id)
  
  // 3. Send rejection email
  await sendEmail({
    to: app.email,
    template: 'account_rejected',
    data: {
      full_name: app.full_name,
      company_name: app.company_name,
      rejection_reason,
      support_email: process.env.SUPPORT_EMAIL
    }
  })
  
  return NextResponse.json({ success: true })
}
```

---

## 📧 Email Templates

### Account Approved Email

```typescript
export function AccountApprovedEmail({
  full_name,
  company_name,
  login_url
}: {
  full_name: string
  company_name: string
  login_url: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h1 style="color: #10B981;">✅ Account Goedgekeurd!</h1>
      
      <p>Beste ${full_name},</p>
      
      <p>
        Goed nieuws! Je account voor ${company_name} is goedgekeurd.
        Je kunt nu direct aan de slag.
      </p>
      
      <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0;">Volgende stappen:</h3>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Klik op de knop hieronder om je wachtwoord in te stellen</li>
          <li>Log in op het portal</li>
          <li>Start met het aanvragen van advertentieaccounts</li>
        </ol>
      </div>
      
      <a href="${login_url}" style="display: inline-block; background: #2D7FF9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
        Wachtwoord Instellen
      </a>
      
      <p>
        Welkom bij AdCure!<br/>
        Het AdCure Team
      </p>
    </div>
  `
}
```

### Account Rejected Email

```typescript
export function AccountRejectedEmail({
  full_name,
  company_name,
  rejection_reason,
  support_email
}: {
  full_name: string
  company_name: string
  rejection_reason: string
  support_email: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h1 style="color: #EF4444;">Accountaanvraag Afgewezen</h1>
      
      <p>Beste ${full_name},</p>
      
      <p>
        Helaas kunnen we je aanvraag voor ${company_name} op dit moment 
        niet goedkeuren.
      </p>
      
      <div style="background: #fef2f2; border-left: 4px solid #EF4444; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #991b1b;">Reden:</h3>
        <p style="margin: 0;">${rejection_reason}</p>
      </div>
      
      <p>
        Als je denkt dat dit een vergissing is of als je meer informatie wilt,
        neem dan contact op via ${support_email}.
      </p>
      
      <p>
        Met vriendelijke groet,<br/>
        Het AdCure Team
      </p>
    </div>
  `
}
```

---

## 🚧 Error Handling

### Rollback Strategy

**Problem:** Approval creates multiple records. If one fails, others must be deleted.

**Solution:** Try-catch with explicit rollback

```typescript
try {
  const org = await createOrganization()
  try {
    const authUser = await createAuthUser()
    try {
      await createUserRecord()
      await createWallet()
      await updateApplicationStatus()
    } catch (error) {
      // Rollback auth user + org
      await deleteAuthUser(authUser.id)
      await deleteOrganization(org.id)
      throw error
    }
  } catch (error) {
    // Rollback org only
    await deleteOrganization(org.id)
    throw error
  }
} catch (error) {
  // Nothing to rollback
  throw error
}
```

---

## ✅ Testing Checklist

### Approval Flow
- [ ] Approve creates organization
- [ ] Approve creates auth user
- [ ] Approve creates database user
- [ ] Approve creates wallet
- [ ] Password reset email sent
- [ ] Welcome email sent
- [ ] Status updated to "approved"
- [ ] Cannot approve twice

### Rejection Flow
- [ ] Reject updates status
- [ ] Rejection reason saved
- [ ] Rejection email sent
- [ ] Cannot reject without reason
- [ ] Cannot approve after rejection

### Error Cases
- [ ] Duplicate email handled
- [ ] Rollback works on auth failure
- [ ] Rollback works on database failure
- [ ] Admin sees error message

---

*Admin Approval Workflow - Create Accounts Safely!*
