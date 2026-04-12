---
name: generate-tests
description: Genereert comprehensive unit en integratietests voor nieuw geschreven of gewijzigde code met automatic framework detection en coverage requirements.
license: MIT
compatibility: opencode
---

## Wat ik doe
- Detecteer automatisch het testing framework dat in het project wordt gebruikt
- Analyseer de implementatiecode en het oorspronkelijke plan
- Identificeer testgevallen (happy path, edge cases, error handling)
- Genereer testcode met concrete templates voor het gedetecteerde framework
- Verify tests door ze te runnen
- Rapporteer coverage en test results

## Wanneer mij te gebruiken
- **Nadat een feature is geïmplementeerd** en door code review is gekomen
- Wanneer de gebruiker expliciet vraagt om tests toe te voegen aan bestaande code
- Als onderdeel van "Definition of Done" voor een taak
- Voor regression tests bij bug fixes

---

## Test Generation Workflow

### **Step 1: Detect Testing Framework**

Analyseer `package.json`, `requirements.txt`, `go.mod`, etc. om framework te detecteren:

#### **JavaScript/TypeScript Projects**

Check `package.json` dependencies:

```json
{
  "devDependencies": {
    "vitest": "..." → Use Vitest
    "jest": "..." → Use Jest
    "@testing-library/react": "..." → React Testing Library
  }
}
```

**Framework Detection Logic:**
```
IF "vitest" in devDependencies:
  → Framework: Vitest + React Testing Library (if React project)
ELSE IF "jest" in devDependencies:
  → Framework: Jest + React Testing Library (if React project)
ELSE:
  → Ask user which framework to use
```

#### **Python Projects**

Check `requirements.txt` or `pyproject.toml`:

```
pytest → Use pytest
unittest → Use unittest
```

#### **Go Projects**

```
Native `testing` package (always available)
```

---

### **Step 2: Analyze Code Structure**

Voor elke function/component die getest moet worden, extraheer:

1. **Inputs:**
   - Function parameters
   - Component props
   - External dependencies (API clients, databases)

2. **Outputs:**
   - Return value
   - Side effects (API calls, state changes, renders)
   - Thrown errors

3. **Edge Cases:**
   - Null/undefined inputs
   - Empty arrays/strings
   - Boundary values (0, -1, MAX_INT)
   - Invalid input types

4. **Error Scenarios:**
   - API failures
   - Network errors
   - Invalid data formats
   - Permission denials

---

### **Step 3: Generate Test Cases**

Minimum test coverage per function/component:
- ✅ **1 happy path test** (standard usage)
- ✅ **1+ edge case tests** (null, empty, boundary values)
- ✅ **1+ error case tests** (API failure, invalid input)
- ✅ **Integration test** (if function calls other functions)

---

## Framework Templates

### **TEMPLATE 1: React Component (Vitest + React Testing Library)**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRoleManager } from './UserRoleManager';

// Mock dependencies
vi.mock('@/api/roles', () => ({
  getRoles: vi.fn(),
  updateUserRole: vi.fn(),
}));

describe('UserRoleManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // HAPPY PATH
  it('renders user list with roles when data loads successfully', async () => {
    const mockUsers = [
      { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
    ];
    
    // Setup mock
    const { getRoles } = await import('@/api/roles');
    (getRoles as any).mockResolvedValue(mockUsers);

    // Render component
    render(<UserRoleManager />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  // USER INTERACTION
  it('calls updateUserRole when role dropdown is changed', async () => {
    const mockUsers = [{ id: 1, name: 'Alice', role: 'user' }];
    const { getRoles, updateUserRole } = await import('@/api/roles');
    (getRoles as any).mockResolvedValue(mockUsers);
    (updateUserRole as any).mockResolvedValue({ success: true });

    render(<UserRoleManager />);

    // Wait for data to load
    await waitFor(() => screen.getByText('Alice'));

    // Change role
    const roleDropdown = screen.getByRole('combobox');
    fireEvent.change(roleDropdown, { target: { value: 'admin' } });

    // Assert API was called
    await waitFor(() => {
      expect(updateUserRole).toHaveBeenCalledWith(1, 'admin');
    });
  });

  // EDGE CASE: Empty data
  it('shows empty state when no users exist', async () => {
    const { getRoles } = await import('@/api/roles');
    (getRoles as any).mockResolvedValue([]);

    render(<UserRoleManager />);

    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });
  });

  // ERROR CASE: API failure
  it('shows error message when API call fails', async () => {
    const { getRoles } = await import('@/api/roles');
    (getRoles as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<UserRoleManager />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load users/i)).toBeInTheDocument();
    });
  });

  // LOADING STATE
  it('shows loading indicator while fetching data', () => {
    const { getRoles } = await import('@/api/roles');
    (getRoles as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<UserRoleManager />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

---

### **TEMPLATE 2: API Function (Vitest/Jest)**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUsers } from './api';

// Mock global fetch
global.fetch = vi.fn();

describe('fetchUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // HAPPY PATH
  it('returns users when API succeeds', async () => {
    const mockUsers = [
      { id: 1, name: 'Alice', email: 'alice@example.com' }
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUsers,
    });

    const users = await fetchUsers();

    expect(users).toEqual(mockUsers);
    expect(global.fetch).toHaveBeenCalledWith('/api/users');
  });

  // ERROR CASE: 404
  it('throws error when users not found (404)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(fetchUsers()).rejects.toThrow('Users not found');
  });

  // ERROR CASE: Network failure
  it('throws error on network failure', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    await expect(fetchUsers()).rejects.toThrow('Network error');
  });

  // ERROR CASE: Invalid JSON response
  it('handles malformed JSON response', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
    });

    await expect(fetchUsers()).rejects.toThrow();
  });

  // EDGE CASE: Empty array response
  it('handles empty users array', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const users = await fetchUsers();
    expect(users).toEqual([]);
  });
});
```

---

### **TEMPLATE 3: Python Function (pytest)**

```python
import pytest
from unittest.mock import Mock, patch
from myapp.services import UserService

@pytest.fixture
def mock_db():
    """Fixture for mocked database"""
    return Mock()

@pytest.fixture
def user_service(mock_db):
    """Fixture for UserService instance"""
    return UserService(db=mock_db)

class TestUserService:
    # HAPPY PATH
    def test_get_user_returns_user_when_exists(self, user_service, mock_db):
        # Arrange
        mock_user = {"id": 1, "name": "Alice", "email": "alice@example.com"}
        mock_db.query.return_value.first.return_value = mock_user
        
        # Act
        result = user_service.get_user(user_id=1)
        
        # Assert
        assert result == mock_user
        mock_db.query.assert_called_once()

    # ERROR CASE: User not found
    def test_get_user_raises_error_when_not_found(self, user_service, mock_db):
        # Arrange
        mock_db.query.return_value.first.return_value = None
        
        # Act & Assert
        with pytest.raises(ValueError, match="User not found"):
            user_service.get_user(user_id=999)

    # ERROR CASE: Database error
    def test_get_user_handles_database_error(self, user_service, mock_db):
        # Arrange
        mock_db.query.side_effect = Exception("Database connection failed")
        
        # Act & Assert
        with pytest.raises(Exception, match="Database connection failed"):
            user_service.get_user(user_id=1)

    # EDGE CASE: Invalid user ID
    @pytest.mark.parametrize("invalid_id", [0, -1, None, "invalid"])
    def test_get_user_validates_user_id(self, user_service, invalid_id):
        # Act & Assert
        with pytest.raises(ValueError, match="Invalid user ID"):
            user_service.get_user(user_id=invalid_id)

    # INTEGRATION TEST
    def test_update_user_role_integration(self, user_service, mock_db):
        # Arrange
        mock_user = Mock(id=1, name="Alice", role="user")
        mock_db.query.return_value.first.return_value = mock_user
        
        # Act
        user_service.update_user_role(user_id=1, new_role="admin")
        
        # Assert
        assert mock_user.role == "admin"
        mock_db.commit.assert_called_once()
```

---

### **TEMPLATE 4: Go Function (testing package)**

```go
package services

import (
    "errors"
    "testing"
)

// HAPPY PATH
func TestGetUser_ReturnsUserWhenExists(t *testing.T) {
    // Arrange
    mockDB := &MockDatabase{
        users: map[int]User{
            1: {ID: 1, Name: "Alice", Email: "alice@example.com"},
        },
    }
    service := NewUserService(mockDB)

    // Act
    user, err := service.GetUser(1)

    // Assert
    if err != nil {
        t.Fatalf("expected no error, got %v", err)
    }
    if user.Name != "Alice" {
        t.Errorf("expected name Alice, got %s", user.Name)
    }
}

// ERROR CASE: User not found
func TestGetUser_ReturnsErrorWhenNotFound(t *testing.T) {
    // Arrange
    mockDB := &MockDatabase{users: map[int]User{}}
    service := NewUserService(mockDB)

    // Act
    _, err := service.GetUser(999)

    // Assert
    if err == nil {
        t.Fatal("expected error, got nil")
    }
    if err.Error() != "user not found" {
        t.Errorf("expected 'user not found', got %v", err)
    }
}

// EDGE CASE: Invalid ID
func TestGetUser_RejectsInvalidID(t *testing.T) {
    service := NewUserService(&MockDatabase{})

    testCases := []int{0, -1, -999}
    for _, id := range testCases {
        t.Run(fmt.Sprintf("ID=%d", id), func(t *testing.T) {
            _, err := service.GetUser(id)
            if err == nil {
                t.Errorf("expected error for invalid ID %d", id)
            }
        })
    }
}
```

---

## Test File Location Conventions

### **JavaScript/TypeScript:**
```
src/components/UserRoleManager.tsx
→ src/components/UserRoleManager.test.tsx (same directory)

OR

src/api/users.ts
→ src/api/__tests__/users.test.ts (in __tests__ subdirectory)
```

### **Python:**
```
myapp/services/user_service.py
→ tests/test_user_service.py (separate tests/ directory)

OR

myapp/services/user_service.py
→ myapp/services/test_user_service.py (same directory, test_ prefix)
```

### **Go:**
```
services/user.go
→ services/user_test.go (same directory, _test.go suffix)
```

---

## Coverage Requirements

### **Minimum Coverage Per Function:**

```
✅ 1 happy path test (standard usage)
✅ 1+ edge case tests (boundary values)
✅ 1+ error case tests (failure scenarios)
```

### **Recommended Coverage:**

```
⭐ 80%+ line coverage
⭐ 70%+ branch coverage
⭐ All public functions tested
⭐ Critical paths: 100% coverage
```

---

## Execution Steps

### **1. Identify Files to Test**

Based on code review output or user request:
```
Files changed in this feature:
- src/components/UserRoleManager.tsx (NEW)
- src/api/roles.ts (NEW)
- src/types/role.ts (NEW - just types, skip testing)
```

### **2. Generate Test Files**

For each file that needs tests:
```
1. Detect framework (check package.json)
2. Analyze code structure (inputs, outputs, dependencies)
3. Generate test cases using appropriate template
4. Write test file to correct location
```

### **3. Run Tests**

Execute tests to verify they pass:
```bash
# JavaScript/TypeScript
npm test UserRoleManager.test.tsx

# Python
pytest tests/test_user_service.py

# Go
go test ./services/user_test.go
```

### **4. Report Results**

```markdown
✅ Tests generated and verified

Files created:
- src/components/UserRoleManager.test.tsx (6 test cases)
- src/api/roles.test.ts (5 test cases)

Test results:
- ✅ All 11 tests passing
- Coverage: 87% lines, 79% branches

Test breakdown:
- Happy path: 2 tests
- Edge cases: 4 tests
- Error cases: 3 tests
- Integration: 2 tests
```

---

## Special Cases

### **Testing Async Functions**

Always use `async/await` and `waitFor`:
```typescript
it('fetches data asynchronously', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### **Testing Timers/Delays**

Use fake timers:
```typescript
vi.useFakeTimers();

it('executes callback after delay', () => {
  const callback = vi.fn();
  delayedExecution(callback, 1000);
  
  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
});
```

### **Testing React Hooks**

Use `renderHook` from Testing Library:
```typescript
import { renderHook } from '@testing-library/react';

it('updates state correctly', () => {
  const { result } = renderHook(() => useCounter());
  
  act(() => {
    result.current.increment();
  });
  
  expect(result.current.count).toBe(1);
});
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
6. generate-tests (THIS SKILL)
   → Generate test files
   → Run tests
   → Report coverage
7. completion (if tests pass)
```

---

## Troubleshooting

### **Tests Fail After Generation**

```
Problem: Generated tests are failing

Debug steps:
1. Check if implementation matches test expectations
2. Verify mocks are set up correctly
3. Check async handling (missing await?)
4. Verify test framework configuration

Fix: Use test-fixing skill to analyze and auto-fix
```

### **Framework Not Detected**

```
Problem: Can't determine which testing framework to use

Response to user:
"Testing framework not detected in package.json.

Which framework should I use?
1. Vitest (recommended for Vite projects)
2. Jest (classic choice)
3. Other (specify)"
```

### **Low Coverage**

```
Problem: Generated tests only cover 40% of code

Response to user:
"⚠️ Test coverage is 40% (below recommended 80%).

Missing coverage:
- Error handling branches in handleSubmit()
- Edge case: empty array in processUsers()

Should I generate additional tests for these scenarios?"
```

---

## Tips for High-Quality Tests

1. **Test Behavior, Not Implementation**
   - ❌ Test internal state
   - ✅ Test observable outputs

2. **Make Tests Independent**
   - Each test should run in isolation
   - Use beforeEach to reset state

3. **Descriptive Test Names**
   - ❌ `it('works', ...)`
   - ✅ `it('returns 404 when user is not found', ...)`

4. **Arrange-Act-Assert Pattern**
   ```
   // Arrange: Setup
   // Act: Execute
   // Assert: Verify
   ```

5. **Don't Over-Mock**
   - Mock external dependencies (APIs, DB)
   - Don't mock internal functions (test real behavior)

6. **Test Edge Cases**
   - null, undefined, empty, 0, -1
   - Boundary values (MAX_INT, MIN_INT)
   - Invalid types

---

## Success Metrics

A successful test generation:
- ✅ Tests cover happy path + edge cases + errors
- ✅ All generated tests pass on first run
- ✅ Coverage meets minimum threshold (70%+)
- ✅ Tests are maintainable (not brittle)
- ✅ Tests execute quickly (< 1s per file)
