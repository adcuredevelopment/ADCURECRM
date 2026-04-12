---
name: context-scout
description: Zoekt en laadt intelligently relevante projectcontext en richtlijnen op basis van automatische domain detectie uit de taak beschrijving.
license: MIT
compatibility: opencode
---

## Wat ik doe
- Analyseer de huidige taak en extraheer domain keywords
- Map keywords automatisch naar relevante context files
- Lees en laad de juiste context bestanden
- Vat de belangrijkste regels samen die relevant zijn voor deze specifieke taak
- Voorkom dat je code schrijft die niet past bij de project architectuur

## Wanneer mij te gebruiken
- **Aan het begin van ELKE nieuwe taak** (voor plan maken)
- Wanneer je niet zeker weet wat de projectstandaarden zijn voor een specifiek domein
- Om te voorkomen dat je verkeerde patterns of libraries gebruikt
- Als eerste stap in de lead-dev workflow (altijd!)

## Execution Logic

### **Input**
Taakbeschrijving of user prompt

### **Output**
- Loaded context file(s)
- Samenvatting van relevante regels (max 10 bullets)
- Confirmation van welke context is geladen

---

## Automatische Domain Mapping

Analyseer de taak voor deze keywords en laad de corresponderende context:

### **FRONTEND Keywords**
```
Triggers: "component", "UI", "React", "page", "view", "styling", "Tailwind", 
          "button", "form", "modal", "layout", "CSS", "design", "interface",
          "routing", "navigation", "state management", "hooks", "props"

→ Load: `.opencode/context/frontend.md`
```

### **BACKEND Keywords**
```
Triggers: "API", "endpoint", "route", "server", "backend", "middleware",
          "FastAPI", "Express", "controller", "service", "authentication",
          "authorization", "session", "cookie", "request", "response"

→ Load: `.opencode/context/backend.md`
```

### **DATABASE Keywords**
```
Triggers: "schema", "migration", "table", "model", "SQL", "database",
          "PostgreSQL", "MySQL", "query", "index", "relation", "foreign key",
          "ORM", "Prisma", "SQLAlchemy", "data model"

→ Load: `.opencode/context/database.md`
```

### **LOVABLE SHELL Keywords**
```
Triggers: "Lovable", "lovable-project", "pulled from partner", "shell",
          "supabase", "existing component", "reuse component"

→ Load: `.opencode/context/lovable-patterns.md`
```

### **MULTIPLE Domains**
Als taak meerdere domains betreft (bijv. "API endpoint die database query doet"):
→ Load meerdere relevante files

### **UNKNOWN Domain**
Als geen keywords matchen:
→ Vraag gebruiker: "Which context should I load? (frontend/backend/database/other)"

---

## Execution Steps

### **1. Analyze Task**
Scan de user prompt of taakbeschrijving voor domain keywords.

**Voorbeeld:**
```
User: "Add a new page for managing user roles with a table and dropdowns"

Keywords detected: "page", "table" → Frontend domain
```

### **2. Map to Context Files**
Gebruik domain mapping hierboven om te bepalen welke files te laden.

**Voorbeeld:**
```
Detected: Frontend keywords
Files to load: .opencode/context/frontend.md
```

### **3. Read Context Files**
Gebruik je file read tool om de content te laden.

```bash
# Read tool gebruiken:
read_file(".opencode/context/frontend.md")
```

### **4. Summarize Relevant Rules**
Extraheer ALLEEN regels die relevant zijn voor de huidige taak (niet alles!).

**Voorbeeld summarization:**
```
Context loaded from frontend.md:

Relevant rules for this task:
- Use ONLY Tailwind utility classes (no custom CSS)
- Components in src/components/, max 200 lines each
- TypeScript strict mode enabled
- Props must be typed with interfaces
- Use React Query for server state (not useState for API data)
- Loading and error states required for all async operations
- Use shadcn/ui components where available
```

**NIET doen:**
- Hele file copy-pasten (te veel info)
- Irrelevante regels includen (bijv. build configuration als taak over component gaat)

### **5. Return Confirmation**
Bevestig welke context geladen is en wat de key takeaways zijn.

```
✅ Context loaded: frontend.md

Key rules:
- Tailwind-only styling
- React Query for data fetching
- Max 200 lines per component
- TypeScript strict mode

Ready to create plan based on these guidelines.
```

---

## Example Outputs

### **Example 1: Frontend Component**
```
User Task: "Create a user profile component with avatar and bio"

Analysis:
- Keywords: "component", "user profile" → Frontend
- Loading: .opencode/context/frontend.md

Context loaded from frontend.md:
- Components go in src/components/
- Use Tailwind for styling (no custom CSS)
- TypeScript interfaces for props
- Avatar: use Avatar component from shadcn/ui
- Max 200 lines per component

Ready to proceed with plan-feature skill.
```

### **Example 2: Backend API**
```
User Task: "Add endpoint to update user profile data"

Analysis:
- Keywords: "endpoint", "update" → Backend
- Loading: .opencode/context/backend.md

Context loaded from backend.md:
- Endpoints use /api/v1/ prefix
- Use Pydantic models for request validation
- Return proper HTTP status codes (200 for success, 400 for validation errors)
- Require JWT authentication for user-specific endpoints
- Log all profile updates for audit trail

Ready to proceed with plan-feature skill.
```

### **Example 3: Database Schema**
```
User Task: "Add roles table and relationship to users"

Analysis:
- Keywords: "table", "relationship" → Database
- Loading: .opencode/context/database.md

Context loaded from database.md:
- Table names: lowercase_with_underscores
- Always include: id (UUID), created_at, updated_at
- Foreign keys: use ON DELETE CASCADE where appropriate
- Create migration file in migrations/
- Add indexes for frequently queried columns

Ready to proceed with plan-feature skill.
```

### **Example 4: Multiple Domains**
```
User Task: "Create API endpoint that fetches and displays user analytics in a dashboard"

Analysis:
- Keywords: "API endpoint" → Backend
- Keywords: "displays", "dashboard" → Frontend
- Loading: Multiple contexts

Context loaded from backend.md:
- RESTful endpoint design
- Response format: { data, meta, error }

Context loaded from frontend.md:
- Use recharts for data visualization
- Tailwind for layout
- React Query for data fetching

Ready to proceed with plan-feature skill.
```

### **Example 5: Lovable Shell Project**
```
User Task: "Extend the Lovable shell with a new kanban board feature"

Analysis:
- Keywords: "Lovable shell", "extend" → Lovable patterns
- Keywords: "kanban board" → Frontend
- Loading: Multiple contexts

Context loaded from lovable-patterns.md:
- Existing auth: Supabase Auth (already configured)
- Existing components: Card, Button, Dialog from shadcn/ui
- Styling: Tailwind with custom color scheme in globals.css

Context loaded from frontend.md:
- Build on existing component library
- Follow established folder structure
- Use existing state management patterns

Recommendation: Use lovable-context skill for deeper analysis of existing patterns.

Ready to proceed with plan-feature skill.
```

---

## Error Handling

### **File Not Found**
```
Problem: .opencode/context/frontend.md doesn't exist

Response to user:
"⚠️ Context file not found: .opencode/context/frontend.md

Would you like me to:
1. Proceed without frontend-specific context (use AGENTS.md only)
2. Create a basic frontend.md template for you
3. Skip context loading and ask for manual guidelines

What's your preference?"
```

### **Empty Context File**
```
Problem: Context file exists but is empty

Response to user:
"⚠️ Context file is empty: .opencode/context/frontend.md

Proceeding with general guidelines from AGENTS.md only.
Consider adding project-specific rules to this file for better results."
```

### **Multiple Valid Interpretations**
```
Problem: Keywords could match multiple domains

Example: "form" could be frontend UI or backend API

Response to user:
"I detected keywords that could mean:
1. Frontend form component
2. Backend form validation

Which context should I load? (or both?)"
```

### **No Keywords Match**
```
Problem: Task description has no recognizable domain keywords

Response to user:
"I couldn't auto-detect the domain for this task.

Available contexts:
- frontend (UI, React, styling)
- backend (API, server logic)
- database (schema, queries, migrations)
- lovable-patterns (existing Lovable shell patterns)

Which should I load? (or specify 'none' to skip)"
```

---

## Advanced Usage

### **Manual Override**
User kan specifiek aangeven welke context te laden:

```
User: "Build API endpoint (load backend context only)"

→ Skip auto-detection, load backend.md directly
```

### **Progressive Context Loading**
Voor grote taken, laad context progressief:

```
Fase 1: Load high-level context (architecture)
Fase 2: Load specific context tijdens implementatie (styling details)
```

### **Context Caching**
Binnen dezelfde sessie, herinner welke context al geladen is:

```
First task: Load frontend.md
Second task (same domain): "Frontend context already loaded, using cached rules"
```

---

## Integration met Other Skills

### **Before plan-feature**
```
lead-dev workflow:
1. context-scout (load relevant context)
2. plan-feature (create plan with context awareness)
3. user approval
4. implementation
```

### **Before lovable-context**
```
Lovable shell workflow:
1. context-scout (load general context + lovable patterns)
2. lovable-context (deep dive into existing code)
3. plan-feature (create plan building on existing patterns)
```

---

## Tips voor Effectief Gebruik

1. **Run Early**
   - Gebruik context-scout VOORDAT je begint met plannen
   - Voorkom dat je verkeerde aannames maakt

2. **Trust the Auto-Detection**
   - Keyword mapping is trained op common patterns
   - Meestal laadt het de juiste context

3. **Verify Output**
   - Check of geladen regels relevant zijn
   - Als niet: manual override of update context file

4. **Keep Context Files Updated**
   - Wanneer project evolueert, update .opencode/context/ files
   - Betere context = betere agent performance

5. **Don't Overload**
   - Laad alleen wat strikt noodzakelijk is
   - Meer context ≠ betere results (cognitive overload)

---

## Success Metrics

Een succesvolle context-scout run:
- ✅ Correct domain detected (frontend/backend/database)
- ✅ Relevant rules extracted (not everything)
- ✅ Agent knows which patterns/libraries to use
- ✅ Prevents "wrong approach" rewrites later
