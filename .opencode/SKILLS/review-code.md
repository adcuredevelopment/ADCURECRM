---
name: review-code
description: Voert een systematische code review uit met security, performance, en quality checks. Geeft actionable feedback met severity levels.
license: MIT
compatibility: opencode
---

## Wat ik doe
- Analyseer code op basis van projectrichtlijnen (geladen via `context-scout`)
- Systematische review volgens 6-aspect checklist
- Zoek naar bugs, security kwetsbaarheden en performance bottlenecks
- Controleer code quality en testbaarheid
- Geef constructieve, actionable feedback met severity levels

## Wanneer mij te gebruiken
- **Nadat de `coder` subagent** (of jijzelf) een feature of bugfix heeft geïmplementeerd
- **Voordat** je de taak als "voltooid" markeert aan de gebruiker
- Wanneer de gebruiker expliciet vraagt om een review van een specifiek bestand of commit
- Als quality gate voor merge/deployment

---

## Systematische Review Checklist

Executeer in deze volgorde, ALTIJD alle 6 stappen:

### **1. CORRECTNESS** ✓

Doet de code wat het moet doen?

**Check:**
- [ ] Code matches het goedgekeurde plan?
- [ ] Alle acceptance criteria gehaald?
- [ ] Edge cases handled (null, empty array, undefined, 0, false)?
- [ ] No logic errors of off-by-one bugs?
- [ ] Function return values correct voor alle input scenarios?
- [ ] Conditional logic correct (geen missing else branches)?

**Common Issues:**
- Vergeten null checks
- Array index out of bounds
- Missing return statements
- Wrong comparison operators (== vs ===, < vs <=)

---

### **2. SECURITY** 🔒

Is de code veilig tegen common vulnerabilities?

**Check:**
- [ ] User input validated en sanitized?
- [ ] No SQL injection vectors? (use parameterized queries)
- [ ] No XSS vulnerabilities? (escape user content in UI)
- [ ] Secrets not hardcoded? (gebruik environment variables)
- [ ] Authentication checked waar needed?
- [ ] Authorization verified? (user has permission voor action)
- [ ] Sensitive data not logged? (passwords, tokens, PII)
- [ ] CORS configured correctly? (niet * in production)

**Common Issues:**
- Direct user input in SQL queries: `query = f"SELECT * FROM users WHERE id = {user_id}"`
- Hardcoded credentials: `API_KEY = "sk-1234567890"`
- Missing auth checks: Endpoint accessible zonder login
- Logging sensitive data: `console.log(user.password)`

---

### **3. PERFORMANCE** ⚡

Is de code efficient en schaalbaar?

**Check:**
- [ ] No N+1 query problems? (use JOINs or batch queries)
- [ ] Expensive operations not in loops?
- [ ] Database queries use indexes waar frequently queried?
- [ ] Large datasets paginated? (niet alles tegelijk laden)
- [ ] No unnecessary re-renders? (React: use memo, useMemo, useCallback)
- [ ] Async operations parallelized waar mogelijk?
- [ ] No blocking operations on main thread?

**Common Issues:**
- Loop with database query: `for user in users: db.query(user.id)`
- Loading 10,000 records zonder pagination
- Redundant API calls: Same endpoint called 5x
- Heavy computation in render function

**Performance Thresholds:**
- API response time: < 200ms (fast), < 1s (acceptable), > 1s (slow)
- Database query: < 100ms (good), < 500ms (ok), > 500ms (investigate)
- Frontend render: < 16ms (60fps), < 33ms (30fps), > 100ms (laggy)

---

### **4. CODE QUALITY** 📐

Is de code leesbaar en onderhoudbaar?

**Check:**
- [ ] Functions < 50 lines? (if longer, suggest split)
- [ ] Clear, descriptive variable/function names? (niet x, temp, data, obj)
- [ ] Comments explain "why", not "what"?
- [ ] No commented-out code? (remove or explain waarom kept)
- [ ] Consistent with project style? (check geladen context)
- [ ] DRY principle: No duplicated logic?
- [ ] Single Responsibility: Function doet 1 ding?
- [ ] Proper error messages? (niet "Error 123")

**Common Issues:**
- Magic numbers: `if (status === 3)` → gebruik `STATUS_APPROVED = 3`
- Nested if-statements (> 3 levels deep)
- Functions with > 5 parameters (use object/config)
- Variable names: `let x = getData(); let temp = process(x);`

**Style Check:**
- Naming: camelCase for variables/functions, PascalCase for classes/components
- Indentation: Consistent (2 or 4 spaces, niet mix)
- Line length: < 100 characters waar mogelijk
- Import order: Third-party first, then local

---

### **5. TESTABILITY** 🧪

Is de code gemakkelijk te testen?

**Check:**
- [ ] Functions zijn pure waar mogelijk? (same input → same output)
- [ ] Dependencies injectable? (niet hardcoded database/API clients)
- [ ] Side effects geïsoleerd? (API calls, file I/O in separate functions)
- [ ] Makkelijk te mocken external services?
- [ ] Testbare units (functions not too large/complex)?
- [ ] Clear separation of concerns? (logic vs presentation)

**Common Issues:**
- Direct database calls in business logic function
- API client hardcoded: `const api = new ApiClient("https://...")`
- Tightly coupled code: Function calls 5 other functions internally
- Randomness in logic: `Math.random()` gebruikt (niet seedable)

**Testability Improvements:**
```javascript
// SLECHT (hard to test)
function processUser() {
  const user = database.getUser(123);
  const result = apiClient.post('/process', user);
  return result;
}

// GOED (easy to test - dependencies injected)
function processUser(userId, db, api) {
  const user = db.getUser(userId);
  const result = api.post('/process', user);
  return result;
}
```

---

### **6. ERROR HANDLING** 🚨

Worden fouten correct afgehandeld?

**Check:**
- [ ] Try/catch blocks waar needed? (async operations, external calls)
- [ ] User-facing error messages? (niet stack traces naar user)
- [ ] Errors logged voor debugging? (met context: user, timestamp, action)
- [ ] Graceful degradation? (show fallback, niet crash)
- [ ] Network errors handled? (timeout, connection lost)
- [ ] Validation errors proper feedback? (welke field, wat is fout)
- [ ] Resource cleanup in finally block? (close connections, clear timeouts)

**Common Issues:**
- Missing try/catch around fetch/axios calls
- Showing stack trace to end users: `alert(error.stack)`
- Silent failures: `try { ... } catch(e) { }`
- No error boundaries (React)

**Error Handling Levels:**
```
1. Catastrophic: App crashes → Use error boundary/global handler
2. Feature-level: Feature fails → Show error message, allow retry
3. Input-level: Validation error → Show field-specific feedback
4. Warning: Non-blocking issue → Log, continue operation
```

---

## Output Format

### **If Issues Found:**

```markdown
## Code Review Results

### ❌ Critical Issues (MUST FIX before merge)

1. **Security:** User input not validated in `handleSubmit()`
   - **File:** `src/components/Form.tsx:45`
   - **Issue:** Direct use of `username` without sanitization opens XSS vector
   - **Fix:** Add Zod schema validation: `z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/)`
   - **Impact:** HIGH - Security vulnerability

2. **Correctness:** Missing null check can cause crash
   - **File:** `src/utils/parser.ts:23`
   - **Issue:** `user.profile.avatar` accessed without checking if profile exists
   - **Fix:** Add optional chaining: `user?.profile?.avatar ?? defaultAvatar`
   - **Impact:** HIGH - Runtime error

### ⚠️ Warnings (SHOULD FIX before merge)

1. **Performance:** Database query in loop causes N+1 problem
   - **File:** `src/api/users.ts:22-28`
   - **Issue:** `for (user of users) { db.getRoles(user.id) }` creates 100+ queries
   - **Suggestion:** Use JOIN or single batch query: `db.getUsersWithRoles()`
   - **Impact:** MEDIUM - Slow for >50 users

2. **Code Quality:** Function exceeds 50 line limit
   - **File:** `src/utils/transformer.ts:10-85`
   - **Issue:** Function is 75 lines, does 3 different things
   - **Suggestion:** Split into: `validateData()`, `transformData()`, `formatOutput()`
   - **Impact:** LOW - Reduces maintainability

### 💡 Suggestions (NICE TO HAVE)

1. **Testability:** Hard-coded API client
   - **File:** `src/services/userService.ts:5`
   - **Issue:** `const api = new ApiClient()` makes testing harder
   - **Suggestion:** Accept client as parameter: `function getUser(id, api = defaultApi)`
   - **Impact:** LOW - Improves test coverage potential

2. **Code Quality:** Magic number
   - **File:** `src/components/Pagination.tsx:18`
   - **Issue:** `if (page > 100)` - unclear why 100
   - **Suggestion:** `const MAX_PAGES = 100; if (page > MAX_PAGES)`
   - **Impact:** LOW - Code clarity

### ✅ Passed Checks

- Correctness (except issue #2)
- Security (except issue #1)
- Error handling
- Testability (except suggestion #1)

### 📊 Review Summary

- **Critical Issues:** 2 (must fix)
- **Warnings:** 2 (should fix)
- **Suggestions:** 2 (optional)
- **Overall:** ⚠️ **NEEDS WORK** - Fix critical issues before merge

### 🎯 Next Steps

1. Fix critical issues #1 and #2
2. Consider fixing warnings (especially N+1 query)
3. Run tests after fixes
4. Request re-review when ready
```

---

### **If No Issues Found:**

```markdown
## Code Review Results

✅ **REVIEW PASSED**

All checks passed:
- ✅ Correctness - Logic is sound, edge cases handled
- ✅ Security - Input validated, no vulnerabilities detected
- ✅ Performance - Efficient implementation, no bottlenecks
- ✅ Code Quality - Clean, readable, follows conventions
- ✅ Testability - Well-structured, easy to test
- ✅ Error Handling - Proper try/catch, user-friendly errors

### 📊 Code Metrics
- Functions: Average 28 lines (good)
- Complexity: Low (straightforward logic)
- Test coverage: Ready for test generation

### 🎯 Ready for Next Phase
Code is ready for:
1. ✅ Test generation (use generate-tests skill)
2. ✅ Manual testing
3. ✅ Merge to main branch

Great work! 🚀
```

---

## Severity Level Definitions

### **❌ Critical (Blocks Deployment)**

Must be fixed before code can be merged or deployed.

**Examples:**
- Security vulnerabilities (SQL injection, XSS, exposed secrets)
- Logic errors causing incorrect behavior (wrong calculations, data corruption)
- Runtime crashes (null pointer, index out of bounds)
- Performance issues causing timeouts (> 5s response time)

**Action:** STOP - Fix immediately, re-review required

---

### **⚠️ Warning (Should Fix)**

Should be addressed before merge, maar not blockers.

**Examples:**
- Code smells (long functions, duplicated code)
- Minor performance issues (inefficient but not critical)
- Missing error handling (not catastrophic but risky)
- Inconsistent style (deviates from project conventions)

**Action:** Fix before merge OR add to tech debt backlog

---

### **💡 Suggestion (Nice to Have)**

Improvements that enhance quality but aren't urgent.

**Examples:**
- Refactoring opportunities
- Better variable naming
- Additional comments
- More comprehensive error messages

**Action:** Optional - implement if time permits, or defer

---

## Review Scope

### **What to Review:**
- All new files
- All modified files
- Direct dependencies of changed code
- Integration points

### **What to Skip:**
- Auto-generated code (migrations, build outputs)
- Third-party library code
- Unchanged dependencies
- Test files (reviewed separately by generate-tests)

---

## Special Cases

### **Reviewing Bug Fixes**

Focus extra op:
- Does fix address root cause? (not just symptom)
- Does fix introduce new bugs?
- Are edge cases that caused bug now handled?
- Is there test to prevent regression?

### **Reviewing Refactors**

Focus extra op:
- Does behavior remain identical? (no accidental changes)
- Is complexity actually reduced?
- Are all call sites updated?
- Performance impact (better, same, or worse)?

### **Reviewing Database Changes**

Focus extra op:
- Backwards compatibility (existing data still works?)
- Migration rollback possible?
- Indexes added for new queries?
- Data validation at database level?

---

## Integration with Workflow

```
lead-dev workflow:
1. context-scout (load rules)
2. plan-feature (make plan)
3. user approval
4. coder (implement)
5. review-code (THIS SKILL) ← Review output determines next step
   → If CRITICAL issues: Back to step 4 (coder fixes)
   → If WARNINGS: Ask user if acceptable or fix
   → If PASSED: Continue to step 6
6. generate-tests (write tests)
7. completion
```

---

## Tips for Effective Reviews

1. **Be Specific**
   - ❌ "This function is bad"
   - ✅ "Function at line 45 is 120 lines, exceeds 50-line limit. Split into 3 functions."

2. **Provide Context**
   - Why is this an issue?
   - What's the impact?
   - How does it violate project standards?

3. **Suggest Solutions**
   - Don't just point out problems
   - Offer concrete fix suggestions
   - Show code examples where helpful

4. **Prioritize**
   - Critical issues first
   - Group related issues
   - Don't overwhelm with 50 suggestions

5. **Be Constructive**
   - Praise good code too!
   - Frame feedback positively
   - Focus on improving quality, not blame

6. **Check Against Plan**
   - Does implementation match approved plan?
   - Are all planned features present?
   - Any scope creep (unapproved additions)?

---

## Success Metrics

A successful review:
- ✅ All 6 aspects checked systematically
- ✅ Issues categorized by severity correctly
- ✅ Actionable feedback (exact file, line, fix)
- ✅ Balances thoroughness with pragmatism
- ✅ Helps improve code quality without blocking progress
