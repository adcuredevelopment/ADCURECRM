# AdCure Portal

Client portal voor AdCure agency — gebouwd met Next.js 16 + Supabase.

---

## 🏗️ Architectuur

Dit project is een **fullstack Next.js app** — frontend en backend zitten in één project:

```
adcurecrm2/
├── app/                    # Frontend pagina's + Backend API routes
│   ├── login/              # Login pagina
│   ├── client/             # Client dashboard pagina's
│   ├── agency/             # Agency admin pagina's
│   └── api/                # Backend API endpoints (komt in fase 2)
├── components/             # Herbruikbare React componenten
├── lib/                    # Supabase client, auth helpers
├── supabase/migrations/    # Database SQL migrations
├── types/                  # TypeScript types
├── Fase DOCS/              # Gedetailleerde specs per fase
└── copypaste/              # SQL snippets voor Supabase SQL Editor
```

**Je hoeft maar 1 commando te runnen** — Next.js handelt zowel frontend als backend af.

---

## 🚀 Development starten

### Vereisten
- Node.js 18+
- Toegang tot Supabase project

### Opstarten
```bash
npm run dev
```

De app is dan bereikbaar op:
- **Mac Mini (lokaal):** http://localhost:3000
- **MacBook via netwerk:** http://192.168.2.28:3000

### Overige commando's
```bash
npm run build        # Productie build maken
npm run start        # Productie server starten
npm run test         # Tests uitvoeren
npm run test:watch   # Tests in watch mode
```

---

## 🗄️ Database

**Supabase project:** https://inacrhrrwpmajlizjnum.supabase.co

### Migrations uitvoeren
Migrations staan in `supabase/migrations/`. Deze worden uitgevoerd via de Supabase SQL Editor:
```
https://supabase.com/dashboard/project/inacrhrrwpmajlizjnum/sql/new
```

### Migration volgorde
| Bestand | Beschrijving | Status |
|---|---|---|
| `20260410000001_initial_schema.sql` | Database tabellen | ✅ Gedraaid |
| `20260410000002_rls_policies.sql` | RLS policies (oud) | ⚠️ Vervangen door 000005 |
| `20260410000003_indexes.sql` | Indexes | ✅ Gedraaid |
| `20260410000004_seed_data.sql` | Seed data | ✅ Gedraaid |
| `20260410000005_rls_fixed.sql` | RLS policies (fixed) | ✅ Gedraaid |

---

## 👥 Test Gebruikers

| Rol | Email | Wachtwoord |
|---|---|---|
| Agency Admin | admin@adcure.agency | Admin123! |
| Client | client@test.com | Client123! |

Zie `copypaste/` map voor SQL om deze aan te maken.

---

## 🔑 Environment Variables

Kopieer `.env.local.example` naar `.env.local` en vul in:

```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Publieke anon key
SUPABASE_SERVICE_ROLE_KEY=       # Geheime service role key (nooit exposen!)
NEXT_PUBLIC_APP_URL=             # App URL (http://192.168.2.28:3000 lokaal)

# Moneybird (optioneel — factuurintegratie)
MONEYBIRD_API_KEY=               # Moneybird API token (OAuth of personal access token)
MONEYBIRD_ADMINISTRATION_ID=     # Jouw Moneybird administratienummer

# Resend (optioneel — e-mailnotificaties)
RESEND_API_KEY=                  # Resend API key (re_xxxxxxxxx)
RESEND_FROM_EMAIL=               # Afzenderadres, bijv. noreply@adcure.agency
```

> **Let op:** Zolang `MONEYBIRD_API_KEY` of `RESEND_API_KEY` begint met `placeholder_`, worden de integraties automatisch overgeslagen. De app werkt volledig zonder deze keys — ze zijn alleen nodig voor productie.

---

## 📋 Fase voortgang

| Fase | Beschrijving | Status |
|---|---|---|
| **Fase 1** | Foundation & Auth | ✅ Compleet |
| **Fase 2** | Core client features | ✅ Compleet |
| **Fase 3** | Admin panel | ✅ Compleet |
| **Fase 4** | Polish & integraties | ✅ Compleet |

Gedetailleerde specs per fase: zie `Fase DOCS/` map.

---

## 🔌 Externe integraties activeren

### Resend (e-mailnotificaties)

1. Maak een account op [resend.com](https://resend.com)
2. Maak een API key aan in het dashboard
3. Voeg je domein toe en verifieer via DNS
4. Vul in `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@jouwdomein.nl
   ```
5. Herstart de dev server — e-mails worden nu verstuurd bij:
   - Storting goedgekeurd/afgewezen
   - Advertentieaccount goedgekeurd/afgewezen
   - Nieuwe factuur beschikbaar

### Moneybird (factuurintegratie)

1. Log in op [moneybird.com](https://moneybird.com)
2. Ga naar **Instellingen → API** en maak een Personal Access Token aan
3. Kopieer je administratienummer uit de URL: `moneybird.com/{administratienummer}`
4. Vul in `.env.local`:
   ```
   MONEYBIRD_API_KEY=jouw_access_token
   MONEYBIRD_ADMINISTRATION_ID=123456789
   ```
5. Herstart de dev server — facturen worden nu automatisch aangemaakt in Moneybird wanneer een storting wordt goedgekeurd

> **Graceful degradation:** Als de keys niet zijn ingevuld (of beginnen met `placeholder_`), worden de integraties stil overgeslagen. De core functionaliteit van de portal blijft altijd werken.

---

## 📁 Copypaste bestanden

Voor SQL die je in de Supabase SQL Editor moet plakken:
```
copypaste/
├── create-test-users.sql        # Stap 1: Auth users aanmaken + UUIDs ophalen
└── create-test-users-step2.sql  # Stap 2: Users koppelen aan organisaties
```
