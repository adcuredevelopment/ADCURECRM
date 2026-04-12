# Project Rules & Context

Welkom bij dit project. Dit bestand bevat de kernprincipes en instructies voor alle AI agents die in deze repository werken.

## 🎯 Kernprincipes (Plan-First Development)

1. **Denk Eerst, Codeer Later**
   - ALTIJD een plan maken voordat je code schrijft of wijzigt
   - Plan ter goedkeuring voorleggen aan gebruiker
   - Pas na expliciete goedkeuring beginnen met implementatie

2. **Minimal Viable Information (MVI)**
   - Laad alleen de context die strikt noodzakelijk is
   - Gebruik `context-scout` skill om domein-specifieke context te vinden
   - Voorkom context overload (cognitive efficiency)

3. **Kwaliteit boven Snelheid**
   - Schrijf robuuste, veilige en testbare code
   - Geen quick-fixes tenzij expliciet gevraagd
   - Code review en tests zijn NIET optioneel

## 📂 Modulair Context Systeem

We gebruiken een "need-to-know" context loading strategie. Laad deze bestanden alleen als ze relevant zijn voor je huidige taak:

### **Algemene Richtlijnen**
- **Locatie:** `.opencode/context/general-guidelines.md`
- **Auto-loaded:** Ja (via opencode.json)
- **Bevat:** Project-wide regels, code style, git workflow

### **Frontend Architectuur**
- **Locatie:** `.opencode/context/frontend.md`
- **Wanneer laden:** Bij werk aan UI, React components, styling
- **Bevat:** Component structuur, Tailwind conventions, state management

### **Backend & API**
- **Locatie:** `.opencode/context/backend.md`
- **Wanneer laden:** Bij werk aan API endpoints, server logic, middleware
- **Bevat:** API design patterns, error handling, authentication

### **Database & Schema**
- **Locatie:** `.opencode/context/database.md`
- **Wanneer laden:** Bij datamodel wijzigingen, migraties, queries
- **Bevat:** Schema conventions, indexing strategy, query optimization

### **Lovable Shell Context** (NIEUW)
- **Locatie:** `.opencode/context/lovable-patterns.md`
- **Wanneer laden:** Bij werk in repo die vanuit Lovable shell komt
- **Bevat:** Lovable-specifieke patterns, reusable components, integration points

**⚠️ BELANGRIJK:** Laad deze bestanden NIET preventief allemaal tegelijk. Gebruik `context-scout` skill om automatisch de juiste context te laden op basis van je taak.

## 🔄 Workflow

### **1. Begrijp de Taak**
- Lees de requirements zorgvuldig
- Vraag om verduidelijking als iets onduidelijk is
- Identificeer het domein (frontend/backend/database)

### **2. Laad Context**
```
Gebruik: context-scout skill
Input: Beschrijving van je taak
Output: Relevante context geladen + samenvatting van belangrijkste regels
```

### **3. Maak Plan**
```
Gebruik: plan-feature skill (of architect subagent voor complexe architectuur)
Output: Gestructureerd implementatieplan met:
  - Doel en context
  - Stappen met affected files
  - Risico's en edge cases
  - Test strategie
  - Acceptance criteria
```

### **4. Vraag Goedkeuring**
- Presenteer plan aan gebruiker
- Wacht op EXPLICIETE goedkeuring
- Mogelijke responses:
  - ✅ "approved", "go ahead", "looks good" → Ga verder
  - 🔄 Vragen/wijzigingen → Update plan, vraag opnieuw
  - ❌ "different approach" → Maak nieuw plan

### **5. Implementatie**
- Delegeer aan `coder` subagent (of doe zelf stap-voor-stap)
- Werk incrementeel (per file/component)
- Commit logical chunks
- Test na elke significante change

### **6. Review & Test**
```
Review: reviewer subagent controleert code
  Output: Critical issues / Warnings / Suggestions
  
Tests: generate-tests skill schrijft tests
  Output: Test files + coverage report
```

### **7. Verification**
Voordat taak als "compleet" wordt gemarkeerd:
- [ ] Alle acceptance criteria gehaald
- [ ] Code review passed (no critical issues)
- [ ] Tests passing
- [ ] Manual test uitgevoerd
- [ ] Documentatie updated (indien nodig)

## 🚨 Error Handling

Als iets misgaat tijdens de workflow:

### **Simple Errors** (typo, missing import, syntax)
→ Fix immediately, ga verder

### **Complex Errors** (wrong approach, architecture issue)
→ STOP, rapporteer aan gebruiker:
```
⚠️ Error in [step name]

Problem: [what went wrong]
Location: [file:line]

Options:
1. [Quick fix approach]
2. [Revise plan approach]

Which do you prefer?
```

### **Loop Detection**
Als je 3x dezelfde error krijgt:
→ STOP, vraag gebruiker om input
→ "I'm stuck in a loop with [error]. Need your help on: [specific question]"

### **External Issues** (API down, dependency missing)
→ Rapporteer aan gebruiker, wacht op resolution

## 🛠️ Agent Responsibilities

### **lead-dev** (Primary Agent)
- Orchestreert hele workflow
- Enige die met gebruiker praat
- Delegeert naar subagents
- Waarborgt kwaliteit gates

### **architect** (Subagent)
- System design en architectuur
- Database schema's
- API contracts
- Geen implementatiecode

### **coder** (Subagent)
- Implementeert code volgens plan
- Volgt coding standards strikt
- Test incrementally
- Rapporteert voortgang

### **reviewer** (Subagent)
- Code review op 6 aspecten
- Geen write rechten (alleen analyse)
- Severity levels: Critical / Warning / Suggestion
- Actionable feedback

## 🤖 Model Selection Strategy

**Doel:** Kosten besparen door slim verschillende Claude modellen te gebruiken per taaktype.

### **Default Model**
- **claude-sonnet-4-6-20260217** voor alle standaard taken
- Beste balans tussen kwaliteit en kosten ($3/$15 per miljoen tokens)
- Gebruikt tenzij expliciet anders aangegeven

### **Gebruik Haiku 4.5** (`claude-haiku-4-5-20251001`)
**Cost:** $1/$5 per miljoen tokens (3x goedkoper dan Sonnet)

✅ **Geschikt voor:**
- Test generatie (unit tests, integration tests)
- Documentatie schrijven (comments, README updates, JSDoc)
- Boilerplate code (CRUD endpoints, basic forms, config files)
- Simple refactoring (renaming, moving files, formatting)
- React/Vue components zonder complexe logic
- HTML/CSS/Tailwind styling
- Bash scripts, Dockerfiles, CI/CD configs
- Type definitions (TypeScript interfaces, Zod schemas)

❌ **NIET gebruiken voor:**
- Business logic met complexe state management
- Multi-file architecture changes
- Database schema design
- Security-critical code
- Performance optimization

### **Gebruik Sonnet 4.6** (DEFAULT)
**Cost:** $3/$15 per miljoen tokens

✅ **Geschikt voor:**
- Complex business logic implementatie
- Multi-file refactoring en architectuur changes
- API design en database schemas
- Debugging non-trivial bugs
- State management (Zustand, Redux)
- Authentication & authorization flows
- Performance optimization
- Integration met third-party APIs
- Error handling strategies

### **Gebruik Opus 4.6** (`claude-opus-4-6`)
**Cost:** $5/$25 per miljoen tokens (5x duurder dan Haiku!)

⚠️ **ALLEEN gebruiken voor:**
- Novel algorithm design (niet-standaard algoritmes)
- Security-critical implementations (auth, encryption, payment flows)
- Multi-day architectural planning (complete app redesigns)
- Complex system design decisions
- Advanced performance optimization requiring deep analysis

**Regel:** Vraag ALTIJD eerst aan gebruiker voordat je Opus gebruikt.

### **Cost Saving Tips**

**1. Prompt Caching** (automatisch actief voor herhaalde context)
- Eerste request: $3.75/M (cache write)
- Volgende requests: $0.30/M (cache hit) - **90% goedkoper!**
- System prompts en project context worden automatisch gecached

**2. Batch Processing** (voor non-urgent taken)
- 50% korting op alle modellen
- Gebruik voor: achtergrond code analysis, bulk test generation, documentation updates

**3. Model Routing Voorbeeld**
Voor een typische feature (bijv. "Add user profile page"):
- Haiku: Tests schrijven, styling, boilerplate → $1/$5
- Sonnet: Business logic, API integration → $3/$15
- Opus: (niet nodig voor standaard features)

**Geschatte besparing:** 60-70% vs all-Sonnet approach!

### **Implementatie Notes**

Agents moeten **expliciet** het juiste model selecteren per taak:
- `coder` subagent gebruikt Haiku voor boilerplate, Sonnet voor logic
- `reviewer` subagent gebruikt Haiku (code review is pattern matching)
- `architect` subagent gebruikt Sonnet (complexe design decisions)

Bij twijfel: **gebruik Sonnet** (veiliger dan te goedkoop en slechte output krijgen).

## 📏 Code Quality Standards

### **Algemeen**
- Functions/components max 50 lines
- Descriptive naming (geen x, y, temp, data)
- Comments voor "why", niet "what"
- No commented-out code in commits

### **Error Handling**
- Try/catch blocks waar nodig
- User-facing error messages
- Graceful degradation (niet crashen)
- Log errors voor debugging

### **Testing**
- Testbare code (pure functions waar mogelijk)
- Dependencies injectable
- Side effects geïsoleerd
- Coverage: happy path + edge cases + error cases

### **Security**
- Input validation op alle user input
- No secrets in code (gebruik env vars)
- Auth/authorization checks
- Prevent SQL injection, XSS

### **Performance**
- No N+1 queries
- Database indexes voor frequent queries
- Pagination voor large datasets
- Efficient algorithms (no nested loops op large data)

## 🎓 Skills Available

De volgende skills zijn beschikbaar om je werk efficiënter te maken:

- **context-scout** - Laadt relevante projectcontext automatisch
- **plan-feature** - Genereert gestructureerd implementatieplan
- **review-code** - Voert systematische code review uit
- **generate-tests** - Schrijft tests met templates
- **lovable-context** - Analyseert Lovable shell patterns (lightweight)
- **test-fixing** - Detecteert en fixed failing tests

Gebruik deze skills actief - ze maken je workflow sneller en kwalitatief beter.

## ✅ Definition of Done

Een taak is pas "done" wanneer:
1. ✅ Code geïmplementeerd volgens goedgekeurd plan
2. ✅ Code review passed (no critical issues)
3. ✅ Tests geschreven en passing
4. ✅ Acceptance criteria gehaald
5. ✅ Manual test succesvol
6. ✅ Documentatie updated (indien relevant)

## 🚀 Pro Tips

- **Bij onduidelijkheid:** Vraag altijd om verduidelijking (beter dan gissen)
- **Bij complexe taken:** Gebruik architect subagent voor design eerst
- **Bij bugs:** Gebruik test-fixing skill voor automated fix suggestions
- **Bij Lovable repos:** Gebruik lovable-context skill om bestaande patterns te detecteren
- **Bij loops/stuck:** Stop en vraag gebruiker om input (niet blijven proberen)

---

*Dit bestand wordt automatisch geladen door alle agents. Update dit bestand als je project-wide regels wijzigt.*
