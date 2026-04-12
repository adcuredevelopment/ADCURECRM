---
name: lovable-context
description: Lightweight analyzer voor Lovable shell projects. Detecteert bestaande components, patterns en integration points om effectief verder te bouwen.
license: MIT
compatibility: opencode
---

## Wat ik doe
- Detect of dit project een Lovable shell is (of daarop gebaseerd)
- Analyseer bestaande components en patterns (lightweight, niet full knowledge graph)
- Identificeer integration points en reusable components
- Load relevante Lovable-specific context voor deze session
- Geef aanbevelingen voor hoe verder te bouwen op bestaande code

## Wanneer mij te gebruiken
- Aan het begin van een OpenCode session in een Lovable-based project
- Na het pullen van een nieuwe Lovable shell van je partner
- Wanneer je wilt bouwen bovenop bestaande Lovable components
- Voor het detecteren van Lovable-specific patterns en conventions

## Wat dit NIET is
- **NIET** een volledige codebase analyzer (gebruik Understand-Anything voor dat)
- **NIET** voor architecture documentation (use case: runtime context loading)
- **NIET** voor initial planning (dat doe je in Claude Chat met lovable-analyzer)

---

## Detection Logic

### **Is dit een Lovable Shell?**

Check voor deze indicators:

```
✅ Lovable shell indicators:
- supabase/ directory exists
- tsconfig.json with specific Lovable config
- public/lovable-uploads/ directory
- vite.config.ts with specific plugins
- src/integrations/supabase/ exists
```

**Detection Steps:**
1. Check if `supabase/` directory exists
2. Check if `src/integrations/supabase/` exists
3. Read `package.json` for Supabase dependencies
4. Check `README.md` for Lovable mentions

**Output:**
```
✅ Lovable shell detected

Indicators found:
- Supabase integration configured
- Authentication setup present
- Lovable component library detected

This project was likely generated with Lovable.
```

---

## Lightweight Analysis

### **What to Analyze:**

Focus op **pragmatic runtime context** (niet exhaustive documentation):

1. **Authentication Setup**
   - Is Supabase Auth configured?
   - Which auth method? (Email, OAuth, Magic Link)
   - Where is auth context used?

2. **Existing Components**
   - Which UI components already exist?
   - Which are reusable vs page-specific?
   - What's the component naming convention?

3. **Styling System**
   - Tailwind config (custom colors, fonts)
   - shadcn/ui components installed
   - Custom design tokens in CSS

4. **Data Layer**
   - Supabase tables defined
   - API client patterns used
   - State management approach (React Query, Context, Zustand)

5. **Routing Structure**
   - Which routes exist?
   - Protected routes?
   - Navigation patterns

### **What to SKIP:**

- Business logic details (te diep, niet nodig voor context)
- Full component implementations (read only surface)
- All file contents (sample only)
- Test files (not relevant for building features)

---

## Analysis Output Format

```markdown
## Lovable Context Analysis

### 🎯 Project Type
✅ Lovable Shell Detected

### 🔐 Authentication
- **Provider:** Supabase Auth
- **Method:** Email + Password
- **Auth Context:** `src/integrations/supabase/auth.tsx`
- **Protected Routes:** `/dashboard/*`, `/admin/*`

### 🎨 Styling System
- **Framework:** Tailwind CSS
- **Component Library:** shadcn/ui (Button, Card, Dialog, Input, Table installed)
- **Custom Theme:** 
  - Primary color: Blue (#3B82F6)
  - Custom fonts: Inter
  - Dark mode: Enabled

### 📦 Existing Components

**Reusable Components** (in `src/components/`):
- `AuthProvider.tsx` - Wraps app with Supabase auth
- `ProtectedRoute.tsx` - Route guard for authenticated pages
- `UserAvatar.tsx` - User profile picture component
- `LoadingSpinner.tsx` - Loading indicator

**Page Components** (in `src/pages/`):
- `Dashboard.tsx` - Main dashboard page
- `Login.tsx` - Login/signup page
- `Profile.tsx` - User profile page

### 🗄️ Data Layer
- **Database:** Supabase PostgreSQL
- **Tables Detected:** `users`, `profiles`
- **API Client:** `src/integrations/supabase/client.ts`
- **State Management:** React Query (configured in `src/main.tsx`)

### 🛣️ Routing
```
/ → Landing page (public)
/login → Authentication (public)
/dashboard → Main app (protected)
/profile → User profile (protected)
```

### 🔌 Integration Points

**To build new features, you can:**
1. **Reuse Auth:** Import `useAuth()` from `src/integrations/supabase/auth`
2. **Reuse Components:** `UserAvatar`, `ProtectedRoute`, shadcn/ui components
3. **Follow Patterns:** Use React Query for data fetching (see Dashboard.tsx example)
4. **Extend Database:** Add tables in `supabase/migrations/`

### 💡 Recommendations

**For new features:**
- ✅ Use existing `AuthProvider` - don't rebuild auth
- ✅ Follow Tailwind + shadcn/ui pattern (don't add new UI library)
- ✅ Use React Query for API calls (consistent with existing code)
- ✅ Protected routes: Wrap with `<ProtectedRoute>`

**Common Patterns Observed:**
- Components use TypeScript interfaces from `src/types/`
- API calls centralized in `src/api/` directory
- Consistent error handling with toast notifications
```

---

## Execution Steps

### **1. Detect Lovable Shell**

```bash
# Check for Lovable indicators
if [ -d "supabase" ] && [ -d "src/integrations/supabase" ]; then
  echo "✅ Lovable shell detected"
else
  echo "⚠️ Not a Lovable shell (or heavily modified)"
fi
```

### **2. Quick Component Scan**

```bash
# List all components
find src/components -name "*.tsx" -o -name "*.ts"

# Sample 3-5 key components to understand patterns
```

### **3. Check Configuration Files**

```
Read:
- package.json (dependencies)
- tsconfig.json (TypeScript config)
- tailwind.config.ts (design tokens)
- vite.config.ts (build setup)
```

### **4. Identify Integration Points**

```
Look for:
- Auth setup in src/integrations/supabase/auth.tsx
- API client in src/integrations/supabase/client.ts
- Database types in src/integrations/supabase/types.ts
```

### **5. Load Lovable-Specific Context**

If `.opencode/context/lovable-patterns.md` exists:
```
Load and summarize Lovable-specific patterns from context file
```

If not exists:
```
Generate basic Lovable patterns context from analysis:
- Auth pattern observed
- Component structure pattern
- Styling approach
- State management pattern
```

---

## Example Usage in Workflow

### **Scenario: Building New Feature on Lovable Shell**

```
User: "Add a kanban board feature to this project"

1. lead-dev runs context-scout
   → Detects keywords: "kanban", "board" → Frontend
   → Loads .opencode/context/frontend.md

2. lead-dev runs lovable-context (this skill)
   → Detects: Lovable shell with Supabase + shadcn/ui
   → Identifies: Existing auth, Card components, React Query setup
   → Loads: Lovable-specific patterns

3. lead-dev has complete context:
   ✅ General frontend rules (from frontend.md)
   ✅ Lovable-specific setup (from lovable-context)
   ✅ Existing components to reuse
   ✅ Patterns to follow

4. lead-dev uses plan-feature with this context
   → Plan includes: "Reuse Card component from shadcn/ui"
   → Plan includes: "Use React Query pattern seen in Dashboard"
   → Plan includes: "Add kanban_items table in Supabase"
```

---

## Integration Points Checklist

After running this skill, you should know:

### **Authentication**
- [ ] How users log in (email, OAuth, magic link)
- [ ] Where auth context is defined
- [ ] How to protect new routes

### **Components**
- [ ] Which UI components are available (shadcn/ui installed?)
- [ ] Naming convention for components (PascalCase, where located)
- [ ] How to create new components (template/pattern)

### **Data Fetching**
- [ ] Data fetching library (React Query, SWR, fetch)
- [ ] API client location and usage pattern
- [ ] Error handling pattern

### **Styling**
- [ ] CSS framework (Tailwind, vanilla CSS, CSS modules)
- [ ] Custom theme colors and fonts
- [ ] Dark mode support

### **Routing**
- [ ] Router used (React Router, TanStack Router)
- [ ] Route structure and naming
- [ ] How to add protected routes

---

## When to Use vs Chat lovable-analyzer

```
USE lovable-context (OpenCode skill):
- ✅ Runtime context loading during OpenCode session
- ✅ Quick check: "What components exist?"
- ✅ Lightweight: Enough to start building
- ✅ Use case: "I'm in OpenCode, need to know what's here"

USE lovable-analyzer (Claude Chat skill):
- ✅ Pre-work analysis BEFORE opening OpenCode
- ✅ Decision making: "Should I build on this or restart?"
- ✅ Comprehensive: Full architecture overview + recommendations
- ✅ Use case: "Partner just pushed shell, what did they build?"
```

**Workflow:**
```
1. Partner pushes Lovable shell
2. You in Claude Chat: Use lovable-analyzer (comprehensive analysis)
3. Read analysis, decide to extend shell
4. Open OpenCode in repo
5. OpenCode: Use lovable-context (quick runtime context)
6. Build feature with full context
```

---

## Error Handling

### **Not a Lovable Shell**

```
Problem: No Lovable indicators found

Output:
"⚠️ This doesn't appear to be a Lovable shell.

Could be:
- Custom project from scratch
- Heavily modified Lovable shell
- Different project structure

Should I skip Lovable-specific analysis and just use general context?"
```

### **Heavily Modified Shell**

```
Problem: Some Lovable indicators but structure is very different

Output:
"⚠️ Partial Lovable shell detected.

Found:
- ✅ Supabase integration
- ❌ Non-standard folder structure
- ❌ Custom auth implementation (not using Lovable pattern)

Recommendation: Treat as custom project, don't assume Lovable patterns."
```

### **Missing Context File**

```
Problem: .opencode/context/lovable-patterns.md doesn't exist

Action:
- Continue with analysis
- Generate patterns from observation
- Suggest creating lovable-patterns.md for future sessions
```

---

## Tips for Effective Use

### **1. Run Early in Session**
```
Workflow:
- Open OpenCode in Lovable repo
- First command: Run lovable-context
- Then proceed with feature building
```

### **2. Combine with context-scout**
```
lead-dev should run BOTH:
1. context-scout (general project rules)
2. lovable-context (Lovable-specific patterns)

Together = complete context
```

### **3. Update lovable-patterns.md**
```
After first analysis, create:
.opencode/context/lovable-patterns.md

Content:
- Observed auth pattern
- Component conventions
- Supabase table naming
- API client usage
etc.

Next session: Faster context loading
```

### **4. Don't Over-Analyze**
```
This is LIGHTWEIGHT analysis
Focus on: "What do I need to know to build next feature?"
Not: "Document entire architecture"

If full analysis needed → Use Claude Chat lovable-analyzer
```

---

## Success Metrics

A successful lovable-context run:
- ✅ Correctly identifies if Lovable shell or not
- ✅ Finds existing auth setup and components
- ✅ Identifies reusable patterns
- ✅ Loads in < 30 seconds (lightweight!)
- ✅ Provides actionable integration points
- ✅ Agent knows what to reuse vs build new

---

## Sample Context Loaded

After running lovable-context, agent should know:

```
Context loaded for this Lovable shell:

Auth: Use `useAuth()` hook from src/integrations/supabase/auth
Components: shadcn/ui (Button, Card, Dialog, Table) + custom UserAvatar
Data: React Query + Supabase client
Styling: Tailwind with custom blue theme (#3B82F6)
Routes: Use ProtectedRoute wrapper for auth-required pages

Ready to build on this foundation.
```

This context prevents agent from:
- ❌ Rebuilding auth from scratch
- ❌ Adding different UI library
- ❌ Using wrong data fetching pattern
- ❌ Breaking existing styles

Instead ensures:
- ✅ Consistent with existing patterns
- ✅ Reuses available components
- ✅ Faster development (no reinventing wheel)
- ✅ Maintainable codebase
