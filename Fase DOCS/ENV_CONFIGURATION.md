# Environment Configuration - Complete .env Setup

*All configurable values in one place for easy deployment & cloning*  
Generated: April 12, 2026

---

## 🎯 Philosophy

**Why Everything in .env:**
- ✅ Easy deployment (copy .env between environments)
- ✅ Easy cloning (new client? just change .env)
- ✅ Feature flags (toggle features without code changes)
- ✅ No hardcoded values (all configs external)
- ✅ Secure (secrets not in code/git)
- ✅ Environment-specific (dev vs staging vs prod)

---

## 📋 Complete .env.example

```bash
# ============================================================================
# ADCURE CLIENT PORTAL - Environment Configuration
# ============================================================================
# Copy this file to .env.local and fill in your values
# NEVER commit .env.local to git!

# ============================================================================
# APPLICATION
# ============================================================================
NEXT_PUBLIC_APP_NAME="AdCure Client Portal"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ============================================================================
# SUPABASE (Database + Auth + Storage)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database connection (optional - for migrations)
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# ============================================================================
# MONEYBIRD (Invoicing)
# ============================================================================
MONEYBIRD_API_KEY=your-moneybird-api-key
MONEYBIRD_ADMINISTRATION_ID=your-administration-id
MONEYBIRD_CONTACT_ID=your-default-contact-id

# Tax settings
MONEYBIRD_TAX_RATE_ID=NL_21
MONEYBIRD_LEDGER_ACCOUNT_ID=your-ledger-account-id

# ============================================================================
# REVOLUT BANK DETAILS (For Display in UI)
# ============================================================================
NEXT_PUBLIC_BANK_BENEFICIARY="Adcure Agency"
NEXT_PUBLIC_BANK_IBAN="NL14REV0766119691"
NEXT_PUBLIC_BANK_BIC="REV0NL22"
NEXT_PUBLIC_BANK_NAME="Revolut"

# Payment reference instruction
NEXT_PUBLIC_PAYMENT_REFERENCE_INSTRUCTION="Gebruik uw email als betalingskenmerk"

# ============================================================================
# EMAIL (Resend.com)
# ============================================================================
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM="AdCure <noreply@adcure.agency>"
EMAIL_FROM_NAME="AdCure Agency"
EMAIL_REPLY_TO="support@adcure.agency"

# ============================================================================
# COMPANY VALIDATION APIS
# ============================================================================
# KVK API (Dutch Chamber of Commerce)
KVK_API_KEY=your-kvk-api-key
KVK_API_URL=https://api.kvk.nl/api/v1

# VAT/BTW Validation (VIES - no key needed, public API)
VIES_API_URL=https://ec.europa.eu/taxation_customs/vies/rest-api

# ============================================================================
# BUSINESS CONFIGURATION
# ============================================================================
# Tax
VAT_PERCENTAGE=21
VAT_APPLIES_TO=fee_only

# Currency
DEFAULT_CURRENCY=EUR
SUPPORTED_CURRENCIES=EUR,USD,GBP

# Timezone
DEFAULT_TIMEZONE=Europe/Amsterdam
SUPPORTED_TIMEZONES=Europe/Amsterdam,America/New_York,Europe/London

# Fees
DEFAULT_FEE_PERCENTAGE=5.0
MIN_FEE_PERCENTAGE=0.0
MAX_FEE_PERCENTAGE=20.0

# Wallet limits
MIN_WALLET_DEPOSIT=10.00
MAX_WALLET_DEPOSIT=50000.00

# Top-up limits
MIN_TOP_UP_AMOUNT=1.00
MAX_TOP_UP_AMOUNT=100000.00

# Processing times (in minutes)
WALLET_PAYMENT_PROCESSING_TIME=10
BANK_TRANSFER_PROCESSING_TIME=30

# ============================================================================
# ADMIN CONFIGURATION
# ============================================================================
ADMIN_EMAIL=service@adcure.agency
SUPPORT_EMAIL=support@adcure.agency

# Review time targets (in hours)
TARGET_ACCOUNT_REQUEST_REVIEW_TIME=1
TARGET_WALLET_DEPOSIT_REVIEW_TIME=0.5

# Alert thresholds
PENDING_REQUESTS_ALERT_THRESHOLD=5
PENDING_DEPOSITS_ALERT_THRESHOLD=10
LOW_BALANCE_ALERT_THRESHOLD=10.00

# ============================================================================
# FEATURE FLAGS
# ============================================================================
# Enable/disable features without code changes
ENABLE_MONEYBIRD_AUTO_INVOICE=true
ENABLE_COMPANY_VALIDATION=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_KVK_VALIDATION=true
ENABLE_VAT_VALIDATION=true
ENABLE_IBAN_VALIDATION=true
ENABLE_DUAL_PAYMENT_OPTIONS=true
ENABLE_WALLET_PAYMENTS=true
ENABLE_BANK_TRANSFERS=true

# Advanced features (future)
ENABLE_BULK_TOP_UPS=false
ENABLE_AUTOMATED_APPROVALS=false
ENABLE_WEBHOOK_NOTIFICATIONS=false

# ============================================================================
# SECURITY
# ============================================================================
# Session
SESSION_SECRET=your-random-secret-here
SESSION_MAX_AGE=86400

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# File uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/png,image/jpeg,application/pdf

# ============================================================================
# INTEGRATIONS (Future)
# ============================================================================
# Meta Ads API (for balance fetching)
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=

# Google Ads API
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# TikTok Ads API
TIKTOK_APP_ID=
TIKTOK_SECRET=

# ============================================================================
# LOGGING & MONITORING
# ============================================================================
# Sentry (Error tracking)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Log level
LOG_LEVEL=info
LOG_TO_FILE=false

# ============================================================================
# DEVELOPMENT ONLY
# ============================================================================
# Debug mode
DEBUG_MODE=false
DEBUG_SQL=false
DEBUG_EMAILS=false

# Test accounts
TEST_CLIENT_EMAIL=test-client@example.com
TEST_ADMIN_EMAIL=test-admin@example.com

# Skip validations (NEVER use in production!)
SKIP_EMAIL_VALIDATION=false
SKIP_KVK_VALIDATION=false
SKIP_PAYMENT_VERIFICATION=false
```

---

## 🚀 Environment-Specific Configs

### Development (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEBUG_MODE=true
DEBUG_EMAILS=true
SKIP_EMAIL_VALIDATION=true
```

### Staging (.env.staging)
```bash
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.portal.adcure.agency
DEBUG_MODE=false
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_COMPANY_VALIDATION=true
```

### Production (.env.production)
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://portal.adcure.agency
DEBUG_MODE=false
RATE_LIMIT_ENABLED=true
ENABLE_ALL_VALIDATIONS=true
SKIP_EMAIL_VALIDATION=false
SKIP_KVK_VALIDATION=false
SKIP_PAYMENT_VERIFICATION=false
```

---

## 📖 Variable Documentation

### Critical Variables (Must Set)

**NEXT_PUBLIC_SUPABASE_URL**
- Description: Your Supabase project URL
- Where to find: Supabase Dashboard → Settings → API
- Format: `https://xxxxx.supabase.co`

**SUPABASE_SERVICE_ROLE_KEY**
- Description: Service role key (bypasses RLS for admin operations)
- Where to find: Supabase Dashboard → Settings → API → service_role key
- Security: NEVER expose to client! Server-side only
- Format: Long string starting with `eyJ...`

**MONEYBIRD_API_KEY**
- Description: Moneybird API token
- Where to find: Moneybird → Instellingen → API & Webhooks
- Format: String (varies)

**RESEND_API_KEY**
- Description: Resend.com API key for sending emails
- Where to find: Resend.com Dashboard → API Keys
- Format: `re_xxxxxxxxxxxx`

**KVK_API_KEY**
- Description: KVK (Chamber of Commerce) API key
- Where to find: https://developers.kvk.nl/
- Required for: Company validation
- Format: String (varies)

### Optional But Recommended

**ENABLE_MONEYBIRD_AUTO_INVOICE**
- Description: Automatically generate invoices on top-up approval
- Default: `true`
- Set to `false` for manual invoice generation

**ENABLE_COMPANY_VALIDATION**
- Description: Validate KVK/VAT/IBAN before allowing registration
- Default: `true`
- Set to `false` to skip validation (not recommended!)

**VAT_PERCENTAGE**
- Description: VAT/BTW percentage (21% in Netherlands)
- Default: `21`
- Only change if tax laws change

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets
```bash
# .gitignore should include:
.env.local
.env.*.local
.env.production
.env.staging
```

### 2. Use Different Keys Per Environment
```bash
# ❌ BAD: Same Moneybird key in dev/staging/prod
MONEYBIRD_API_KEY=same-key-everywhere

# ✅ GOOD: Different keys per environment
# Dev: test API key
# Staging: staging API key
# Prod: production API key
```

### 3. Rotate Keys Regularly
```bash
# Every 90 days:
- Generate new SUPABASE_SERVICE_ROLE_KEY
- Generate new MONEYBIRD_API_KEY
- Generate new SESSION_SECRET
```

### 4. Client-Safe Variables Only
```bash
# ✅ SAFE to expose (starts with NEXT_PUBLIC_)
NEXT_PUBLIC_APP_URL=https://portal.adcure.agency
NEXT_PUBLIC_BANK_IBAN=NL14REV0766119691

# ❌ NEVER expose (no NEXT_PUBLIC_ prefix)
SUPABASE_SERVICE_ROLE_KEY=secret
MONEYBIRD_API_KEY=secret
RESEND_API_KEY=secret
```

---

## 🧪 Testing Your .env

### Validation Script
```typescript
// scripts/validate-env.ts
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'MONEYBIRD_API_KEY',
  'RESEND_API_KEY'
]

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required env var: ${varName}`)
    process.exit(1)
  }
}

console.log('✅ All required environment variables are set!')
```

Run before deployment:
```bash
npm run validate-env
```

---

## 📦 Deployment Checklist

### Vercel
```bash
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all variables from .env.production
3. Set environment: Production
4. Redeploy
```

### Docker
```bash
# docker-compose.yml
services:
  app:
    env_file:
      - .env.production
```

### Manual Server
```bash
# Copy .env to server
scp .env.production user@server:/app/.env

# Or use secrets manager (AWS Secrets Manager, etc.)
```

---

## 🔄 Migration Guide

### From Hardcoded to .env

**Before:**
```typescript
const VAT_RATE = 0.21 // Hardcoded!
const BANK_IBAN = "NL14REV0766119691" // Hardcoded!
```

**After:**
```typescript
const VAT_RATE = parseFloat(process.env.VAT_PERCENTAGE!) / 100
const BANK_IBAN = process.env.NEXT_PUBLIC_BANK_IBAN!
```

---

## ✅ Implementation Checklist

- [ ] Create .env.example with all variables
- [ ] Add .env.local to .gitignore
- [ ] Replace all hardcoded values with env vars
- [ ] Create validate-env.ts script
- [ ] Test locally with .env.local
- [ ] Configure staging environment
- [ ] Configure production environment
- [ ] Document all variables
- [ ] Set up key rotation schedule

---

*Environment Configuration - One source of truth!*  
*Update .env.example whenever adding new config values*
