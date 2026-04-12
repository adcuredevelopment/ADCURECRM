# AdCure Portal — Current State Report
*Gegenereerd: April 12, 2026*

---

## 1. Architecture

### Tech Stack

| Categorie | Package | Versie |
|---|---|---|
| **Framework** | Next.js | 16.2.3 |
| **Runtime** | React | 19.2.4 |
| **Language** | TypeScript | ^5 (strict mode) |
| **Database/Auth** | @supabase/supabase-js | ^2.103.0 |
| **SSR Auth** | @supabase/ssr | ^0.10.2 |
| **Styling** | TailwindCSS | ^4 |
| **Icons** | lucide-react | ^1.8.0 |
| **Charts** | recharts | ^3.8.1 |
| **Email** | resend | ^6.10.0 |
| **Toasts** | sonner | ^2.0.7 |
| **File Upload** | react-dropzone | ^15.0.0 |
| **Date utils** | date-fns | ^4.1.0 |
| **Data Fetching** | @tanstack/react-query | ^5.97.0 (geïnstalleerd, nog niet actief gebruikt) |
| **Testing** | Jest + @testing-library/react | ^30.3.0 |

---

### App Directory Structuur

```
app/
├── layout.tsx                          # Root layout: AuthProvider + ErrorBoundaryWrapper + Toaster
├── page.tsx                            # Root redirect → /login
├── globals.css
├── login/page.tsx                      # Publiek: login formulier
├── client/                             # Client portal (role: client)
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── ad-accounts/page.tsx
│   ├── wallet/page.tsx
│   └── invoices/page.tsx
├── agency/                             # Admin panel (role: agency_admin)
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── ad-accounts/page.tsx
│   ├── wallets/page.tsx
│   ├── support/page.tsx                # ⚠️ Placeholder: nog niet gebouwd
│   └── management/users/page.tsx
└── api/
    ├── ad-accounts/route.ts            # GET
    ├── ad-accounts/[id]/top-up/route.ts # POST
    ├── ad-account-requests/route.ts    # GET + POST
    ├── wallet/route.ts                 # GET
    ├── wallet/deposit/route.ts         # POST
    ├── wallet/transactions/route.ts    # GET
    ├── invoices/route.ts               # GET
    ├── upload/route.ts                 # POST
    └── admin/
        ├── stats/route.ts              # GET
        ├── revenue/route.ts            # GET
        ├── alerts/route.ts             # GET
        ├── transactions/route.ts       # GET
        ├── transactions/[id]/route.ts  # PATCH
        ├── wallets/route.ts            # GET
        ├── ad-account-requests/route.ts         # GET
        ├── ad-account-requests/[id]/route.ts    # PATCH
        ├── users/route.ts              # GET + POST
        ├── users/[id]/route.ts         # PATCH + DELETE
        └── invoices/route.ts           # GET
```

---

### Components Directory

```
components/
├── ErrorBoundary.tsx
├── ErrorBoundaryWrapper.tsx
├── layouts/
│   ├── DashboardLayout.tsx
│   ├── Sidebar.tsx
│   └── Header.tsx
├── shared/
│   ├── StatCard.tsx
│   ├── FileUpload.tsx
│   └── CopyButton.tsx
├── admin/
│   ├── AlertsBanner.tsx
│   ├── PendingActionsWidget.tsx
│   ├── RevenueChart.tsx
│   └── ProofViewerModal.tsx
├── wallet/
│   ├── WalletStats.tsx
│   ├── TransactionList.tsx
│   ├── TransactionFilters.tsx
│   └── AddFundsModal.tsx
├── ad-accounts/
│   ├── AdAccountCard.tsx
│   ├── AdAccountList.tsx
│   ├── FeeCalculator.tsx
│   ├── RequestAdAccountModal.tsx
│   ├── RequestHistoryList.tsx
│   └── TopUpRequestModal.tsx
└── ui/
    ├── avatar.tsx, badge.tsx, button.tsx
    ├── card.tsx, dropdown-menu.tsx
    ├── input.tsx, label.tsx
    ├── separator.tsx, sonner.tsx
```

---

## 2. Database Schema

### Tabellen

#### `organizations`
| Kolom | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | TEXT | NOT NULL |
| type | TEXT | CHECK IN ('client', 'agency') |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

#### `users`
| Kolom | Type | Constraints |
|---|---|---|
| id | UUID | PK, FK → auth.users(id) CASCADE |
| organization_id | UUID | FK → organizations(id) CASCADE |
| email | TEXT | UNIQUE |
| full_name | TEXT | nullable |
| phone | TEXT | nullable |
| company_name | TEXT | nullable |
| role | TEXT | CHECK IN ('client', 'agency_admin') |

#### `wallets`
| Kolom | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| organization_id | UUID | FK → organizations(id), UNIQUE |
| balance_cents | BIGINT | DEFAULT 0, CHECK >= 0 |
| currency | TEXT | DEFAULT 'EUR' |

#### `ad_accounts`
| Kolom | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| organization_id | UUID | FK → organizations(id) CASCADE |
| name | TEXT | NOT NULL |
| account_id | TEXT | NOT NULL |
| platform | TEXT | CHECK IN ('meta', 'google', 'tiktok') |
| currency | TEXT | DEFAULT 'EUR' |
| timezone | TEXT | DEFAULT 'Europe/Amsterdam' |
| fee_percentage | DECIMAL(5,2) | CHECK 0–100 — **variabel per account** |
| status | TEXT | CHECK IN ('active', 'disabled') |
| balance_cents | BIGINT | DEFAULT 0 |

#### `transactions`
| Kolom | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| wallet_id | UUID | FK → wallets(id) CASCADE |
| type | TEXT | CHECK IN ('top_up', 'transfer', 'refund', 'adjustment') |
| amount_cents | BIGINT | NOT NULL |
| status | TEXT | CHECK IN ('pending', 'completed', 'rejected') |
| reference | TEXT | nullable |
| proof_url | TEXT | nullable |
| notes | TEXT | nullable |
| ad_account_id | UUID | FK → ad_accounts(id) SET NULL, nullable |
| created_by | UUID | FK → users(id) SET NULL, nullable |
| reviewed_by | UUID | FK → users(id) SET NULL, nullable |
| reviewed_at | TIMESTAMPTZ | nullable |

#### `ad_account_requests`
| Kolom | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| organization_id | UUID | FK → organizations(id) CASCADE |
| account_name | TEXT | NOT NULL |
| domain_name | TEXT | NOT NULL |
| business_manager_id | TEXT | NOT NULL |
| currency | TEXT | DEFAULT 'EUR' |
| timezone | TEXT | DEFAULT 'Europe/Amsterdam' |
| platform | TEXT | CHECK IN ('meta', 'google', 'tiktok') |
| status | TEXT | CHECK IN ('pending', 'approved', 'rejected') |
| reviewed_by | UUID | nullable |
| reviewed_at | TIMESTAMPTZ | nullable |
| rejection_reason | TEXT | nullable |

#### `invoices`
| Kolom | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| organization_id | UUID | FK → organizations(id) CASCADE |
| transaction_id | UUID | FK → transactions(id) CASCADE |
| invoice_number | TEXT | UNIQUE — format: INV-2026-000001 |
| moneybird_id | TEXT | nullable |
| amount_cents | BIGINT | NOT NULL |
| vat_cents | BIGINT | NOT NULL |
| total_cents | BIGINT | NOT NULL |
| status | TEXT | CHECK IN ('created', 'sent', 'paid') |
| pdf_url | TEXT | nullable |
| sent_at | TIMESTAMPTZ | nullable |

### RLS Policies
Alle 7 tabellen hebben RLS ingeschakeld. Helper functies:
- `public.user_organization_id()` — SECURITY DEFINER
- `public.user_role()` — SECURITY DEFINER

**Principe:** Clients zien/muteren alleen eigen data. Agency admins hebben volledige toegang.

### Indexes (16 total)
idx_users_org, idx_users_email, idx_wallets_org, idx_ad_accounts_org, idx_ad_accounts_status, idx_ad_accounts_platform, idx_transactions_wallet, idx_transactions_status, idx_transactions_created, idx_transactions_type, idx_transactions_ad_account, idx_ad_account_requests_org, idx_ad_account_requests_status, idx_invoices_org, idx_invoices_transaction, idx_invoices_status

---

## 3. API Endpoints

### Client API (9 endpoints)

| Methode | Path | Functie |
|---|---|---|
| GET | /api/ad-accounts | Alle ad accounts voor eigen org |
| GET | /api/ad-account-requests | Alle requests voor eigen org |
| POST | /api/ad-account-requests | Nieuwe account aanvraag |
| GET | /api/wallet | Wallet stats (balance, pending, deposited, spent) |
| GET | /api/wallet/transactions | Transacties met filters |
| POST | /api/wallet/deposit | Wallet deposit aanvraag (min €10) |
| POST | /api/ad-accounts/[id]/top-up | Top-up aanvraag (wallet of bank transfer) |
| GET | /api/invoices | Alle facturen voor eigen org |
| POST | /api/upload | Bestand uploaden naar Supabase Storage |

### Admin API (13 endpoints)

| Methode | Path | Functie |
|---|---|---|
| GET | /api/admin/stats | Aggregaat stats (clients, balances, pending) |
| GET | /api/admin/revenue | 7-daagse revenue data |
| GET | /api/admin/alerts | Actieve alerts (>24h, >48h, lage wallets) |
| GET | /api/admin/transactions | Alle pending deposits + client info |
| PATCH | /api/admin/transactions/[id] | Approve (→ wallet + invoice + email) of Reject |
| GET | /api/admin/wallets | Alle wallets + stats |
| GET | /api/admin/ad-account-requests | Alle requests + client info |
| PATCH | /api/admin/ad-account-requests/[id] | Approve (→ ad_account aanmaken) of Reject |
| GET | /api/admin/users | Alle gebruikers doorzoekbaar |
| POST | /api/admin/users | Nieuwe gebruiker aanmaken |
| PATCH | /api/admin/users/[id] | Gebruiker profiel updaten |
| DELETE | /api/admin/users/[id] | Gebruiker verwijderen |
| GET | /api/admin/invoices | Alle facturen cross-org |

---

## 4. Implemented Features

### ✅ Authenticatie
- Email/wachtwoord login via Supabase Auth
- Automatische redirect op basis van rol
- Route beveiliging via proxy.ts (middleware)
- Sessie persistentie
- Uitloggen

### ✅ Client Features

**Dashboard:**
- 3 stat cards (accounts, balance, pending)
- Quick actions
- Ad accounts preview
- Recente transacties

**Wallet:**
- Balance stats (available, pending, deposited, spent)
- Transactielijst met filters
- Add Funds modal (bankgegevens Revolut + upload bewijs)

**Ad Accounts:**
- Account cards met variabele fee percentages
- Fee calculator (amount + fee + BTW 21%)
- Top-up modal (wallet of bank transfer)
- Account aanvraag modal (5 velden)
- Request history

**Invoices:**
- Factuuroverzicht met stats
- Status filters
- PDF download knop (actief als url beschikbaar)

### ✅ Admin Features

**Dashboard:**
- Critical alerts banner
- Aggregaat statistieken
- Revenue chart (7 dagen)
- Pending actions widget

**Account Requests:**
- Approve/reject flows
- Google Sheet copy functie
- Status filters

**Wallet Verificatie:**
- Pending deposits overzicht
- Proof viewer (image + PDF)
- Approve (verhoogt wallet balance + genereert invoice)
- Reject (met reden)

**User Management:**
- Card grid met zoek/filter
- Edit, add, delete users

### ✅ Integraties (geïmplementeerd, wachten op API keys)

**Resend Email (5 templates):**
- Account approved/rejected
- Deposit approved/rejected
- Invoice available
- Non-blocking, graceful degradation

**Moneybird:**
- Invoice aanmaken via REST API
- Non-blocking, graceful degradation

**Invoice Generatie:**
- Sequentieel invoice nummer (INV-YYYY-XXXXXX)
- BTW berekening (21%)
- Volledig geïntegreerd in deposit approval flow

---

## 5. What's Working ✅

- Login + logout + sessie persistentie
- Client dashboard met live data
- Wallet pagina (stats + transacties + filters)
- Add Funds modal (formulier + upload)
- Ad accounts pagina (zoeken + cards)
- Fee calculator (real-time)
- Top-up modal (wallet + bank transfer)
- Account request formulier
- Request history
- Invoices pagina
- Admin dashboard (stats + chart + alerts)
- Account requests approve/reject
- Deposit verificatie + proof viewer
- Wallet balance update bij approve
- Invoice generatie trigger
- User management (CRUD)
- File upload naar Supabase Storage
- Copy buttons (met HTTP fallback)
- Error boundary (root level)
- Loading skeletons overal
- RLS multi-tenant isolatie
- Role-based routing

---

## 6. What's Missing / Broken ⚠️

### Niet Gebouwd
| Feature | Status | Prioriteit |
|---|---|---|
| Support module | Placeholder pagina | Onbekend — geen spec |
| Monitoring/Analytics pagina | Niet gebouwd | Was in fase 3 spec |
| Password reset flow | Niet gebouwd | Supabase heeft ingebouwde flow |
| Email verificatie | Niet gebouwd | Post-MVP |
| Bulk approve/reject | Niet gebouwd | Post-MVP |
| CSV export transacties | Niet gebouwd | Post-MVP |
| Audit trail | Niet gebouwd | Post-MVP |
| Deployment (Hetzner) | In planning | Met hosting partner |

### Externe API Keys Nodig
| Integratie | Status |
|---|---|
| Resend (email) | Placeholder — vul `RESEND_API_KEY` in .env.local in |
| Moneybird | Placeholder — vul `MONEYBIRD_API_KEY` + `MONEYBIRD_ADMINISTRATION_ID` in |

### Technische Issues
| Issue | Omschrijving | Impact |
|---|---|---|
| **proxy.ts naam** | Next.js verwacht `middleware.ts` — `proxy.ts` werkt via Next.js 16 nieuwe conventie maar kan verwarrend zijn | Laag (werkt momenteel) |
| **Wallet balance niet atomisch** | Balance update = fetch + calculate + update (niet race-condition-safe) | Middel (bij gelijktijdige approvals) |
| **Fee hardcoded bij approve** | Nieuw ad_account krijgt altijd `fee_percentage: 5` bij approval | Middel — admin moet fee handmatig aanpassen |
| **Admin POST /users maakt geen auth.users aan** | Alleen public.users record, geen Supabase Auth user | Hoog — nieuwe users kunnen niet inloggen |
| **Moneybird PDF url** | `pdf_url` is altijd null — aparte API call nodig | Laag (invoices staan wel in DB) |
| **@tanstack/react-query ongebruikt** | Geïnstalleerd maar niet gebruikt — alle fetching via useEffect | Laag (functioneel, niet optimaal) |
| **Platform hardcoded op 'meta'** | RequestAdAccountModal stuurt altijd platform='meta' | Middel — Google/TikTok niet aanvraagbaar |

---

## 7. Code Quality

### TypeScript
- ✅ Strict mode aan
- ✅ Alle components getypeerd
- ✅ API responses getypeerd
- ✅ Database types in types/database.types.ts
- ✅ Build slaagt zonder errors

### Security
- ✅ RLS op alle 7 tabellen
- ✅ Auth check op alle API routes (401 als niet ingelogd)
- ✅ Role check op alle admin routes (403 als niet agency_admin)
- ✅ File upload validatie (type + grootte)
- ✅ .env.local in .gitignore
- ⚠️ Wallet balance update niet atomisch

### Error Handling
- ✅ ErrorBoundary op root niveau
- ✅ Try/catch in alle API routes
- ✅ Graceful degradation voor Moneybird + Resend
- ✅ User-facing error messages
- ✅ Retry knoppen bij data fetch errors
- ⚠️ Geen feature-level error boundaries per pagina

### Loading States
- ✅ Skeleton loaders in alle pagina's
- ✅ Disabled buttons tijdens async actions
- ✅ Loading spinners in modals

### Tests
- ✅ AuthProvider: 7 tests
- ✅ Sidebar: 8 tests
- ✅ StatCard: 9 tests
- ❌ Geen API route tests
- ❌ Geen E2E tests

---

*Rapport gegenereerd op basis van volledige codebase analyse — April 12, 2026*
