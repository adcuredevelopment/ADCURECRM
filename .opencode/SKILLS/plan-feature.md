---
name: plan-feature
description: Genereert een gestructureerd, stapsgewijs implementatieplan voor een nieuwe feature of bugfix met time estimates en acceptance criteria.
license: MIT
compatibility: opencode
---

## Wat ik doe
- Breek complexe taken op in kleine, beheersbare stappen met geschatte tijden
- Identificeer welke bestanden moeten worden aangemaakt of gewijzigd
- Definieer concrete acceptance criteria (testbare requirements)
- Benoem potentiële risico's, edge cases en afhankelijkheden
- Lever een markdown document dat ter goedkeuring aan de gebruiker wordt voorgelegd

## Wanneer mij te gebruiken
- **ALTIJD** voordat je begint met code schrijven voor een nieuwe feature
- Voordat je een complexe bug gaat fixen
- Wanneer de gebruiker vraagt om een aanpak of architectuurvoorstel
- Voor taken die meer dan 30 minuten werk zijn

## Output Formaat

Genereer het plan in dit gestructureerde format:

```markdown
# Implementatieplan: [Feature Naam]

## Doel
[Een-regel beschrijving van wat we gaan bereiken]

## Context Geladen
- [Lijst welke context files geladen via context-scout]
- [Voorbeeld: "Loaded frontend.md: Tailwind-only styling, React Query for data"]

## Aannames
- [Technische aannames die we maken]
- [Dependencies die moeten bestaan]
- [Voorbeeld: "Backend endpoint /api/users/:id/role already exists"]

## Files Affected

### Nieuwe Files
- `src/components/UserRoleManager.tsx` - Main component for role management
- `src/api/roles.ts` - API client functions for role operations
- `src/types/role.ts` - TypeScript interfaces for Role and UserRole

### Gewijzigde Files
- `src/routes/index.tsx` - Add /admin/roles route
- `src/types/user.ts` - Add role field to User interface
- `README.md` - Add documentation for role management feature

## Stappenplan

### Fase 1: Setup & Types
**Geschatte tijd:** 15 minuten

1. **Definieer TypeScript interfaces**
   - File: `src/types/role.ts`
   - Actie: Creëer Role interface (id, name, permissions) en UserRole interface
   - Dependencies: Geen
   - Output: Type definitions for type safety

2. **Update User type**
   - File: `src/types/user.ts`
   - Actie: Add optional role field to User interface
   - Dependencies: Step 1
   - Output: User type includes role information

3. **Creëer API client stub**
   - File: `src/api/roles.ts`
   - Actie: Define function signatures (getRoles, updateUserRole) - no implementation yet
   - Dependencies: Step 1
   - Output: TypeScript contracts for API functions

### Fase 2: Component Implementatie
**Geschatte tijd:** 45 minuten

4. **Build UserRoleManager component**
   - File: `src/components/UserRoleManager.tsx`
   - Actie: Create table view with columns (name, email, current role, role dropdown)
   - Dependencies: Steps 1, 2, 3
   - Output: Functional UI component (no data yet)

5. **Add data fetching**
   - File: `src/components/UserRoleManager.tsx`
   - Actie: Use React Query to fetch users and roles
   - Dependencies: Step 4
   - Output: Component displays real user data

6. **Implement role update**
   - File: `src/components/UserRoleManager.tsx`
   - Actie: Add onChange handler for dropdown + mutation logic
   - Dependencies: Step 5
   - Output: Users can change roles via dropdown

### Fase 3: Integration & Routing
**Geschatte tijd:** 20 minuten

7. **Add routing**
   - File: `src/routes/index.tsx`
   - Actie: Add /admin/roles route with role manager component
   - Dependencies: Steps 4-6
   - Output: Page accessible at /admin/roles

8. **Connect to backend API**
   - File: `src/api/roles.ts`
   - Actie: Implement actual API calls (GET /api/roles, PATCH /api/users/:id/role)
   - Dependencies: Backend endpoints must exist
   - Output: Real data integration

### Fase 4: Polish & Error Handling
**Geschatte tijd:** 30 minuten

9. **Add error handling**
   - Files: `src/components/UserRoleManager.tsx`, `src/api/roles.ts`
   - Actie: Try/catch blocks, user-facing error messages, loading states
   - Dependencies: Steps 5, 6, 8
   - Output: Graceful error handling

10. **Add optimistic updates**
    - File: `src/components/UserRoleManager.tsx`
    - Actie: UI updates immediately, rollback on API failure
    - Dependencies: Step 6
    - Output: Snappy UX with rollback protection

11. **Add access control**
    - File: `src/components/UserRoleManager.tsx`
    - Actie: Check if current user is admin, show error if not
    - Dependencies: User authentication system
    - Output: Only admins can access this page

## Acceptance Criteria

### User-Facing (Must Have)
- [ ] Admin can view a list of all users with their current roles
- [ ] Admin can change a user's role via dropdown menu
- [ ] Changes reflect immediately in the UI (optimistic update)
- [ ] Error message shown if API call fails
- [ ] Loading indicator while fetching data
- [ ] Non-admin users cannot access the page (redirect or error)

### Technical (Must Have)
- [ ] All components are TypeScript strict mode compliant
- [ ] No console errors or warnings in browser
- [ ] Uses React Query for data fetching (per frontend.md)
- [ ] Follows Tailwind styling conventions (per frontend.md)
- [ ] API errors are logged for debugging
- [ ] Role changes invalidate React Query cache

### Nice-to-Have (If Time Permits)
- [ ] Search/filter functionality for large user lists
- [ ] Pagination for 100+ users
- [ ] Audit log of role changes
- [ ] Bulk role assignment

## Risico's & Edge Cases

### Risico 1: API returns stale data
**Probleem:** User sees old role after update
**Mitigatie:** Use React Query cache invalidation on successful mutation

### Risico 2: Concurrent updates
**Probleem:** Two admins change same user's role simultaneously
**Mitigatie:** Last-write-wins (acceptable for this use case) OR implement optimistic locking

### Edge Case 1: User has no role assigned
**Handling:** Show "No role" in dropdown, allow assignment

### Edge Case 2: API is temporarily down
**Handling:** Show error banner with retry button, don't crash

### Edge Case 3: Network latency
**Handling:** Show loading state, disable dropdown during update

### Edge Case 4: Invalid role selected
**Handling:** Backend should validate; frontend shows generic error

## Test Strategie

### Unit Tests (via generate-tests skill)
- Role dropdown renders correctly with available roles
- onChange handler calls correct API function
- Error states display correct messages
- Loading states work as expected

### Integration Tests
- Full user flow: view list → select role → verify change → check cache invalidation
- Error flow: API failure → error message → retry succeeds

### Manual Testing Scenarios
1. Happy path: Change role, verify in UI and backend
2. Error: Disconnect network, try to change role, see error
3. Performance: Load with 100+ users, check responsiveness
4. Access control: Log in as non-admin, verify redirect/error
5. Edge case: Rapid clicks on dropdown (race condition test)

## Geschatte Totale Tijd
**1 uur 50 minuten** (110 minuten)

Breakdown:
- Fase 1 (Setup): 15 min
- Fase 2 (Component): 45 min
- Fase 3 (Integration): 20 min
- Fase 4 (Polish): 30 min
- Buffer voor onvoorzien: +20 min

## Dependencies
- Backend endpoint `/api/users/:id/role` moet beschikbaar zijn
- User authentication system moet bestaande user role kunnen opvragen
- React Query reeds geconfigureerd in project
```

---

## Approval Prompt

Na het presenteren van bovenstaand plan, vraag ALTIJD:

```
📋 Implementatieplan klaar voor review.

Summary:
- Files: [aantal nieuwe] new, [aantal gewijzigde] modified
- Geschatte tijd: [totale tijd]
- Acceptance criteria: [aantal] items

Goedkeuring:
- Type "approved", "go ahead", of "looks good" om te starten
- Of geef feedback voor aanpassingen

Wat is je beslissing?
```

**Wacht op expliciete goedkeuring voordat je verder gaat!**

Mogelijke responses:
- ✅ "approved" → Ga verder met implementatie
- 🔄 "add feature X" → Update plan, vraag opnieuw
- ❌ "different approach" → Maak nieuw plan

---

## Tips voor Goede Plannen

1. **Wees Specifiek**
   - ❌ "Update frontend"
   - ✅ "Add role dropdown in UserRoleManager.tsx line 45-60"

2. **Schat Realistisch**
   - Eenvoudige component: 15-30 min
   - Complexe component met state: 45-60 min
   - API integration: 20-30 min
   - Tests: 30-45 min

3. **Dependencies Matter**
   - Identificeer welke stappen afhankelijk zijn
   - Werk in logische volgorde (types → components → integration)

4. **Think About Edge Cases**
   - Lege states
   - Error states
   - Loading states
   - Permission issues

5. **Concrete Acceptance Criteria**
   - ❌ "User can manage roles"
   - ✅ "Admin can view user list with roles AND change roles via dropdown"
