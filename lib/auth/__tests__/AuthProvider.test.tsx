import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthProvider'

// =====================================================
// Mocks
// =====================================================

const mockSignInWithPassword = jest.fn()
const mockSignOut = jest.fn()
const mockGetSession = jest.fn()
const mockOnAuthStateChange = jest.fn()
const mockFrom = jest.fn()

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: mockGetSession,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  })),
}))

// =====================================================
// Test component to access auth context
// =====================================================

function TestConsumer() {
  const { user, appUser, loading, role, isAdmin } = useAuth()
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user?.email ?? 'no-user'}</span>
      <span data-testid="role">{role ?? 'no-role'}</span>
      <span data-testid="isAdmin">{isAdmin ? 'admin' : 'not-admin'}</span>
      <span data-testid="fullName">{appUser?.fullName ?? 'no-name'}</span>
    </div>
  )
}

// =====================================================
// Helpers
// =====================================================

function setupNoSession() {
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  })
}

function setupClientSession() {
  const mockUser = { id: 'client-user-id', email: 'client@test.com' }
  const mockSession = { user: mockUser }

  mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  })
  mockFrom.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'client-user-id',
        email: 'client@test.com',
        full_name: 'Test Client',
        phone: null,
        company_name: 'Test Co',
        role: 'client',
        organization_id: 'test-org-id',
      },
      error: null,
    }),
  })
}

function setupAdminSession() {
  const mockUser = { id: 'admin-user-id', email: 'admin@adcure.agency' }
  const mockSession = { user: mockUser }

  mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  })
  mockFrom.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'admin-user-id',
        email: 'admin@adcure.agency',
        full_name: 'Agency Admin',
        phone: null,
        company_name: 'AdCure Agency',
        role: 'agency_admin',
        organization_id: 'agency-org-id',
      },
      error: null,
    }),
  })
}

// =====================================================
// Tests
// =====================================================

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })

  it('starts in loading state', async () => {
    setupNoSession()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('loading')
  })

  it('shows no user when no session', async () => {
    setupNoSession()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('ready')
    })

    expect(screen.getByTestId('user').textContent).toBe('no-user')
    expect(screen.getByTestId('role').textContent).toBe('no-role')
    expect(screen.getByTestId('isAdmin').textContent).toBe('not-admin')
  })

  it('detects client role correctly', async () => {
    setupClientSession()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('role').textContent).toBe('client')
    })

    expect(screen.getByTestId('isAdmin').textContent).toBe('not-admin')
    expect(screen.getByTestId('user').textContent).toBe('client@test.com')
    expect(screen.getByTestId('fullName').textContent).toBe('Test Client')
  })

  it('detects agency_admin role correctly', async () => {
    setupAdminSession()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('role').textContent).toBe('agency_admin')
    })

    expect(screen.getByTestId('isAdmin').textContent).toBe('admin')
    expect(screen.getByTestId('user').textContent).toBe('admin@adcure.agency')
  })
})

// =====================================================
// signIn / signOut function tests
// =====================================================

function SignInTestConsumer() {
  const { signIn, signOut } = useAuth()
  return (
    <div>
      <button
        data-testid="signin-btn"
        onClick={() => signIn('test@test.com', 'password')}
      >
        Sign In
      </button>
      <button data-testid="signout-btn" onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  )
}

describe('AuthProvider signIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupNoSession()
  })

  it('calls supabase signInWithPassword on signIn', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    render(
      <AuthProvider>
        <SignInTestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {}) // Wait for initial load

    await act(async () => {
      screen.getByTestId('signin-btn').click()
    })

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password',
    })
  })

  it('returns error message when signIn fails', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })

    let signInResult: { error: string | null } | null = null

    function ErrorTestConsumer() {
      const { signIn } = useAuth()
      return (
        <button
          data-testid="signin-btn"
          onClick={async () => {
            signInResult = await signIn('bad@test.com', 'wrong')
          }}
        >
          Sign In
        </button>
      )
    }

    render(
      <AuthProvider>
        <ErrorTestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {})

    await act(async () => {
      screen.getByTestId('signin-btn').click()
    })

    expect((signInResult as { error: string | null } | null)?.error).toBe('Invalid login credentials')
  })

  it('calls supabase signOut on signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    render(
      <AuthProvider>
        <SignInTestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {})

    await act(async () => {
      screen.getByTestId('signout-btn').click()
    })

    expect(mockSignOut).toHaveBeenCalled()
  })
})
