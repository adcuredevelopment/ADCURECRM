import { render, screen } from '@testing-library/react'
import { StatCard } from '../StatCard'
import { Wallet, TrendingUp } from 'lucide-react'

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Wallet Balance" value="€1,234.56" icon={Wallet} />)

    expect(screen.getByText('Wallet Balance')).toBeInTheDocument()
    expect(screen.getByText('€1,234.56')).toBeInTheDocument()
  })

  it('renders numeric value', () => {
    render(<StatCard title="Active Accounts" value={42} icon={Wallet} />)

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('formats large numbers with K suffix', () => {
    render(<StatCard title="Total" value={1500} icon={Wallet} />)

    expect(screen.getByText('1.5K')).toBeInTheDocument()
  })

  it('formats very large numbers with M suffix', () => {
    render(<StatCard title="Total" value={2_500_000} icon={Wallet} />)

    expect(screen.getByText('2.5M')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<StatCard title="Balance" value="€100" icon={Wallet} subtitle="Available funds" />)

    expect(screen.getByText('Available funds')).toBeInTheDocument()
  })

  it('renders trend badge when provided', () => {
    render(
      <StatCard
        title="Revenue"
        value="€500"
        icon={Wallet}
        trend={{ value: 12, label: 'vs last month' }}
      />
    )

    expect(screen.getByText('12%')).toBeInTheDocument()
  })

  it('shows negative trend with down icon', () => {
    render(
      <StatCard
        title="Revenue"
        value="€500"
        icon={Wallet}
        trend={{ value: -5, label: 'vs last month' }}
      />
    )

    expect(screen.getByText('5%')).toBeInTheDocument()
  })

  it('applies blue color class by default', () => {
    const { container } = render(<StatCard title="Test" value="0" icon={Wallet} />)
    // Default color is blue - icon should have blue class
    expect(container.querySelector('.text-\\[\\#2D7FF9\\]')).toBeInTheDocument()
  })

  it('applies green color when color=green', () => {
    const { container } = render(<StatCard title="Test" value="0" icon={Wallet} color="green" />)
    expect(container.querySelector('.text-\\[\\#10B981\\]')).toBeInTheDocument()
  })

  it('applies yellow color when color=yellow', () => {
    const { container } = render(<StatCard title="Test" value="0" icon={Wallet} color="yellow" />)
    expect(container.querySelector('.text-\\[\\#F59E0B\\]')).toBeInTheDocument()
  })

  it('applies red color when color=red', () => {
    const { container } = render(<StatCard title="Test" value="0" icon={Wallet} color="red" />)
    expect(container.querySelector('.text-\\[\\#EF4444\\]')).toBeInTheDocument()
  })

  it('renders icon element', () => {
    const { container } = render(<StatCard title="Test" value="0" icon={Wallet} />)
    // Lucide icons render as SVG
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
