import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from '../Sidebar'

// =====================================================
// Mocks
// =====================================================

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/client/dashboard'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

// Mock AuthProvider
const mockSignOut = jest.fn()
jest.mock('@/lib/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    appUser: {
      id: 'test-user-id',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'client',
      organizationId: 'test-org-id',
      phone: null,
      companyName: 'Test Company',
    },
    signOut: mockSignOut,
  })),
}))

// =====================================================
// Tests
// =====================================================

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Client role navigation', () => {
    it('renders client navigation links', () => {
      render(<Sidebar role="client" />)

      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Ad Accounts').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Wallet').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Invoices').length).toBeGreaterThan(0)
    })

    it('does NOT render agency-only links for client role', () => {
      render(<Sidebar role="client" />)

      // Support and Users are agency-only
      expect(screen.queryByText('Support')).not.toBeInTheDocument()
      expect(screen.queryByText('Users')).not.toBeInTheDocument()
    })

    it('shows correct portal label for clients', () => {
      render(<Sidebar role="client" />)
      expect(screen.getAllByText('Client Portal').length).toBeGreaterThan(0)
    })
  })

  describe('Agency admin role navigation', () => {
    it('renders agency navigation links', () => {
      render(<Sidebar role="agency_admin" />)

      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Ad Accounts').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Wallets').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Support').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Users').length).toBeGreaterThan(0)
    })

    it('does NOT render client-only Invoices link for agency', () => {
      render(<Sidebar role="agency_admin" />)

      expect(screen.queryByText('Invoices')).not.toBeInTheDocument()
    })

    it('shows correct panel label for agency', () => {
      render(<Sidebar role="agency_admin" />)
      expect(screen.getAllByText('Agency Panel').length).toBeGreaterThan(0)
    })
  })

  describe('User info display', () => {
    it('shows user name in sidebar', () => {
      render(<Sidebar role="client" />)
      expect(screen.getAllByText('Test User').length).toBeGreaterThan(0)
    })

    it('shows user email in sidebar', () => {
      render(<Sidebar role="client" />)
      expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0)
    })
  })

  describe('Logout button', () => {
    it('renders sign out button', () => {
      render(<Sidebar role="client" />)
      expect(screen.getAllByText('Sign out').length).toBeGreaterThan(0)
    })

    it('calls signOut when logout is clicked', async () => {
      render(<Sidebar role="client" />)
      const logoutButtons = screen.getAllByText('Sign out')
      // Click the first visible one (desktop sidebar)
      fireEvent.click(logoutButtons[0])
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('Mobile hamburger', () => {
    it('renders mobile menu button', () => {
      render(<Sidebar role="client" />)
      expect(screen.getByLabelText('Open navigation')).toBeInTheDocument()
    })
  })
})
