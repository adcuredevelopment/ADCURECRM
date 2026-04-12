---
name: test-fixing
description: Detecteert failing tests, analyseert de root cause, en propose (of implementeert) fixes. Voorkomt test-fix loops door systematic debugging.
license: MIT
compatibility: opencode
---

## Wat ik doe
- Run tests en detect failures
- Analyseer error messages en stack traces
- Identify root cause (implementation bug vs test bug vs environment issue)
- Propose concrete fixes met code examples
- Optionally: Implement fixes automatically (met user approval)
- Prevent test-fix loops door systematic approach

## Wanneer mij te gebruiken
- Na het runnen van `generate-tests` skill wanneer tests falen
- Wanneer bestaande tests plotseling falen (regression)
- Bij refactoring om te verifiëren dat tests nog steeds correct zijn
- Wanneer je vast zit in een test-fix loop (proberen → falen → proberen → falen)

---

## Execution Workflow

### **Step 1: Run Tests & Collect Failures**

```bash
# Run tests en capture output
npm test 2>&1 | tee test-output.txt

# Of specifiek file
npm test UserRoleManager.test.tsx 2>&1 | tee test-output.txt
```

**Parse output voor:**
- Number of tests run
- Number passed vs failed
- Error messages per failing test
- Stack traces
- File locations

---

### **Step 2: Categorize Failures**

Elke failing test valt in één van deze categorieën:

#### **Category A: Implementation Bug** 🐛
```
Test is correct, implementation has bug

Example:
Test expects: updateUserRole(userId, newRole)
Actual code: updateUserRole(newRole, userId) // Wrong parameter order

Fix: Update implementation code
```

#### **Category B: Test Bug** 🧪
```
Implementation is correct, test is wrong

Example:
Test expects: getByText('Loading...')
Actual UI: <Spinner /> component (no "Loading..." text)

Fix: Update test to match actual (correct) behavior
```

#### **Category C: Environment Issue** ⚙️
```
Code and test both correct, maar environment/setup problem

Example:
Error: "fetch is not defined"
Cause: Missing polyfill in test setup

Fix: Update test configuration
```

#### **Category D: Async Timing Issue** ⏱️
```
Test fails intermittently (race condition)

Example:
Error: "Unable to find element: User List"
Cause: Test didn't wait for async data load

Fix: Add waitFor or findBy instead of getBy
```

---

### **Step 3: Systematic Root Cause Analysis**

Voor elke failing test, doorloop deze decision tree:

```
1. READ ERROR MESSAGE
   └─> Does error mention: "not defined", "undefined", "null"?
       YES → Likely Category A (implementation bug) or C (environment)
       NO → Continue

2. CHECK STACK TRACE
   └─> Error in test file or implementation file?
       Test file → Likely Category B (test bug) or D (async issue)
       Implementation → Likely Category A (implementation bug)

3. READ TEST EXPECTATION
   └─> Is expectation reasonable given implementation?
       NO → Category B (test is wrong)
       YES → Continue

4. CHECK TIMING
   └─> Does test use waitFor/findBy for async operations?
       NO → Likely Category D (async issue)
       YES → Continue

5. CHECK MOCKS
   └─> Are mocks configured correctly?
       NO → Category B or C (mock setup issue)
       YES → Category A (implementation bug)
```

---

### **Step 4: Generate Fix Proposals**

Voor elke category, propose een concrete fix:

#### **Fix Proposal Format:**

```markdown
## Test Failure Analysis

### Test: "renders user list with roles when data loads successfully"
**File:** `src/components/UserRoleManager.test.tsx:15`
**Status:** ❌ FAILING

### Error Message
```
Error: Unable to find element: Alice
  at waitFor (node_modules/@testing-library/dom/...)
  at UserRoleManager.test.tsx:22
```

### Root Cause
**Category:** D - Async Timing Issue

**Analysis:**
Test uses `getByText('Alice')` immediately after render, but component fetches data asynchronously. By the time the assertion runs, data hasn't loaded yet.

### Proposed Fix

**Option 1: Use findBy (Recommended)** ⭐
```typescript
// BEFORE (fails)
render(<UserRoleManager />);
expect(screen.getByText('Alice')).toBeInTheDocument();

// AFTER (works)
render(<UserRoleManager />);
expect(await screen.findByText('Alice')).toBeInTheDocument();
```

**Option 2: Use waitFor**
```typescript
render(<UserRoleManager />);
await waitFor(() => {
  expect(screen.getByText('Alice')).toBeInTheDocument();
});
```

**Recommendation:** Option 1 (findBy is cleaner for this use case)

### Implementation
Should I apply this fix? (yes/no/show me both options)
```

---

### **Step 5: Apply Fixes (with Approval)**

```
User response determines action:

"yes" / "approved" / "go ahead"
→ Apply recommended fix automatically

"option 2"
→ Apply alternative fix

"show me both"
→ Show code diff for both options, wait for selection

"no" / "different approach"
→ Don't apply, ask user what they prefer
```

---

## Common Failure Patterns & Fixes

### **Pattern 1: Missing await in Async Test**

**Error:**
```
Error: Unable to find element
```

**Fix:**
```typescript
// BEFORE
it('loads data', () => {
  render(<Component />);
  expect(screen.getByText('Data')).toBeInTheDocument();
});

// AFTER
it('loads data', async () => {
  render(<Component />);
  expect(await screen.findByText('Data')).toBeInTheDocument();
});
```

---

### **Pattern 2: Mock Not Configured**

**Error:**
```
Error: mockFunction is not a function
```

**Fix:**
```typescript
// BEFORE
import { getRoles } from '@/api/roles';
it('calls API', () => { ... });

// AFTER
import { getRoles } from '@/api/roles';
vi.mock('@/api/roles', () => ({
  getRoles: vi.fn(),
}));

it('calls API', () => {
  (getRoles as any).mockResolvedValue([...]);
  ...
});
```

---

### **Pattern 3: Wrong Query Method**

**Error:**
```
Error: Unable to find element with text: "Submit"
```

**Fix:**
```typescript
// BEFORE (fails if button text is "Submit Form")
const button = screen.getByText('Submit');

// AFTER (more flexible)
const button = screen.getByRole('button', { name: /submit/i });
```

---

### **Pattern 4: React Query Not Wrapped**

**Error:**
```
Error: No QueryClient set, use QueryClientProvider
```

**Fix:**
```typescript
// BEFORE
render(<Component />);

// AFTER
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

render(
  <QueryClientProvider client={queryClient}>
    <Component />
  </QueryClientProvider>
);
```

---

### **Pattern 5: Strict Mode Double Render**

**Error:**
```
Expected mock to be called once, but called twice
```

**Fix:**
```typescript
// React 18 StrictMode calls effects twice in development
// This is expected behavior!

// BEFORE (too strict)
expect(mockFetch).toHaveBeenCalledTimes(1);

// AFTER (accounts for StrictMode)
expect(mockFetch).toHaveBeenCalled(); // At least once
// OR disable StrictMode in test if this causes issues
```

---

### **Pattern 6: Wrong Assertion Timing**

**Error:**
```
Expected element to be in document, but it wasn't
```

**Fix:**
```typescript
// BEFORE (checks before state update)
fireEvent.click(button);
expect(screen.getByText('Saved!')).toBeInTheDocument();

// AFTER (waits for state update)
fireEvent.click(button);
await waitFor(() => {
  expect(screen.getByText('Saved!')).toBeInTheDocument();
});
```

---

## Loop Prevention Strategy

**Problem:** Test-fix loops happen when fixes are applied without understanding root cause.

**Prevention:**

### **1. Categorize FIRST**
```
Don't immediately fix!
First: Determine category (A/B/C/D)
Then: Propose fix based on category
```

### **2. Verify Fix Logic**
```
Before applying fix, ask:
- Does this fix address ROOT CAUSE?
- Or just masking symptom?

Example:
❌ Bad fix: Add try/catch to suppress error
✅ Good fix: Fix the null check that causes error
```

### **3. Test After Fix**
```
After applying fix:
1. Run tests again
2. Verify that specific test now passes
3. Verify other tests still pass (no regression)
```

### **4. Track Fix Attempts**
```
If same test fails 3+ times after fixes:
→ STOP
→ Report to user: "I've tried 3 fixes, all failed. Need different approach."
→ Ask for manual debugging help
```

---

## Output Format

### **Summary Report:**

```markdown
## Test Fix Results

### Tests Analyzed: 11
- ✅ Passing: 8
- ❌ Failing: 3

### Failures by Category
- Implementation bugs: 1
- Test bugs: 1
- Async timing: 1
- Environment issues: 0

---

### Failure #1: updateUserRole call fails
**Category:** A - Implementation Bug
**File:** `src/api/roles.ts:15`
**Fix:** Parameter order wrong, swap userId and roleId
**Status:** ✅ Fixed & Verified

### Failure #2: Cannot find "Loading..." text
**Category:** B - Test Bug  
**File:** `src/components/UserRoleManager.test.tsx:45`
**Fix:** Component uses <Spinner />, not text. Update test to check for spinner.
**Status:** ✅ Fixed & Verified

### Failure #3: Element not found after click
**Category:** D - Async Timing
**File:** `src/components/UserRoleManager.test.tsx:67`
**Fix:** Changed getByText to findByText (waits for async update)
**Status:** ✅ Fixed & Verified

---

### Final Test Run
```bash
npm test
```

**Result:**
✅ All 11 tests passing
🎉 No failures detected

Test suite is now healthy!
```

---

## Integration with Workflow

```
lead-dev workflow:
1. context-scout
2. plan-feature
3. user approval
4. coder (implement)
5. review-code
6. generate-tests
   → Tests generated
   → Run tests
   → If failures detected:
      7a. test-fixing (THIS SKILL)
          → Analyze failures
          → Fix issues
          → Re-run tests
          → If passing → Continue
          → If still failing after 3 attempts → Report to user
7. completion (if all tests pass)
```

---

## Advanced Usage

### **Regression Test Fixing**

```
Scenario: Existing tests suddenly fail after refactoring

Workflow:
1. Run all tests
2. Identify newly failing tests
3. Compare: What changed in implementation?
4. Categorize failures (likely Category A or B)
5. Fix systematically
```

### **Flaky Test Detection**

```
Scenario: Test fails intermittently

Approach:
1. Run test 10 times
2. If fails 2-8 times out of 10 → Flaky
3. Likely Category D (async/timing)
4. Add waitFor or increase timeout
5. Run 10 more times to verify fix
```

### **Batch Fixing**

```
Scenario: Multiple similar failures

Approach:
1. Categorize all failures
2. Group by category
3. Fix all Category D first (usually easiest)
4. Then Category B
5. Then Category A
6. Finally Category C
```

---

## Tips for Effective Test Fixing

### **1. Read Error Messages Carefully**
```
Error messages contain clues:
- "not defined" → Missing import or mock
- "timeout" → Async issue
- "expected X, got Y" → Logic bug or wrong expectation
```

### **2. Check What Changed**
```
If tests were passing before:
- What changed in implementation?
- What changed in tests?
- What changed in environment/dependencies?
```

### **3. Isolate the Problem**
```
Run one failing test at a time:
npm test UserRoleManager.test.tsx -t "specific test name"

Easier to debug than all tests at once
```

### **4. Use Debugger**
```
Add debugger; in test or implementation
Run with --inspect flag
Step through to see exact failure point
```

### **5. Simplify Test**
```
If test is complex and failing:
1. Comment out half the test
2. Does it pass now?
3. Binary search to find problematic assertion
```

---

## Success Metrics

A successful test-fixing run:
- ✅ All failures correctly categorized
- ✅ Root cause identified (not just symptom)
- ✅ Fixes address actual problem
- ✅ No new failures introduced
- ✅ No test-fix loops (max 3 attempts per test)
- ✅ Final test suite: 100% passing
