# Feature Specification: Sign-Up Flow & Account Application

*OpenCode Implementation Guide - Public Registration & Admin Approval*  
Generated: April 13, 2026

---

## 🎯 Feature Overview

### Goal
Enable potential clients to register for an AdCure account through a public sign-up page. Their application is reviewed by admins before account activation. This replaces the "Admin Add User" flow with a proper self-service registration system.

### User Stories
- As a **potential client**, I want to register for an account so that I can use the AdCure portal
- As an **admin**, I want to review applications so that I can verify company information before activation  
- As a **client**, I want to receive email confirmation so that I know my application was received

### Success Criteria
- [ ] Public /sign-up page accessible without authentication
- [ ] Form validates all company data (KVK, VAT, IBAN formats)
- [ ] Application stored with "pending" status
- [ ] Admin receives notification email
- [ ] Applicant receives confirmation email
- [ ] Admin can approve/reject from dashboard
- [ ] On approval: Auth user created + welcome email sent
- [ ] On rejection: Rejection email sent with reason

---

## 🗄️ Database Schema

```sql
CREATE TABLE account_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Company info
  company_name TEXT NOT NULL,
  kvk_number TEXT NOT NULL,
  vat_number TEXT NOT NULL,
  iban TEXT,
  
  -- Contact info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_account_applications_status ON account_applications(status);
CREATE INDEX idx_account_applications_email ON account_applications(email);

-- RLS: Public can insert, Admins can view/update
ALTER TABLE account_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit application"
  ON account_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all"
  ON account_applications FOR SELECT
  USING (auth.user_role() = 'agency_admin');

CREATE POLICY "Admins can update"
  ON account_applications FOR UPDATE
  USING (auth.user_role() = 'agency_admin');
```

---

## 🛠️ Implementation

### File Structure
```
app/
├── sign-up/page.tsx                      # Public sign-up
├── sign-up-success/page.tsx              # Success page
└── api/account-applications/route.ts     # POST endpoint

components/sign-up/
├── SignUpForm.tsx                        # Main form
└── ValidatedInput.tsx                    # Input with validation

lib/validation/
└── company.ts                            # Validation rules (format-only!)
```

### Validation Rules (No API Costs!)

```typescript
// lib/validation/company.ts
export const VALIDATION_RULES = {
  kvk: {
    pattern: /^\d{8}$/,
    message: "KVK nummer moet 8 cijfers zijn",
    example: "12345678"
  },
  vat: {
    pattern: /^NL\d{9}B\d{2}$/,
    message: "Format: NL123456789B01",
    example: "NL123456789B01"
  },
  iban: {
    pattern: /^NL\d{2}[A-Z]{4}\d{10}$/,
    message: "Format: NL91ABNA0417164300",
    example: "NL91ABNA0417164300"
  },
  phone: {
    pattern: /^(\+31|0)[1-9]\d{8}$/,
    message: "Format: +31612345678",
    example: "+31612345678"
  }
}

export function validateBusinessEmail(email: string): boolean {
  const blocked = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com']
  const domain = email.split('@')[1]?.toLowerCase()
  return domain && !blocked.includes(domain)
}
```

### API Endpoint

```typescript
// app/api/account-applications/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createClient()
  
  // Insert application
  const { data, error } = await supabase
    .from('account_applications')
    .insert({
      company_name: body.company_name,
      kvk_number: body.kvk_number,
      vat_number: body.vat_number.toUpperCase(),
      iban: body.iban || null,
      full_name: body.full_name,
      email: body.email.toLowerCase(),
      phone: body.phone,
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      )
    }
    throw error
  }
  
  // Send emails (applicant + admin)
  await sendEmail({
    to: body.email,
    template: 'application_received',
    data: { full_name: body.full_name, company_name: body.company_name }
  })
  
  await sendEmail({
    to: process.env.ADMIN_EMAIL!,
    template: 'admin_new_application',
    data: { ...body, application_id: data.id }
  })
  
  return NextResponse.json({ success: true })
}
```

---

## ✅ Testing Checklist

- [ ] Valid application succeeds
- [ ] Invalid KVK (7 digits) blocked
- [ ] Gmail email blocked
- [ ] Duplicate email blocked
- [ ] Both emails sent
- [ ] Database record created
- [ ] Success page shown

---

*Sign-Up Flow - Self-Service Registration*
