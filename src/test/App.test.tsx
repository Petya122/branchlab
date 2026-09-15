import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import App from '../App'

// Mock canvas-confetti and Vercel analytics
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))

vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}))

vi.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => null,
}))

describe('App Component', () => {
  it('renders the header with BranchLab and the branchlab.me domain badge', () => {
    render(<App />)
    expect(screen.getByText('BranchLab')).toBeInTheDocument()
    expect(screen.getByText('branchlab.me')).toBeInTheDocument()
  })

  it('renders all three branching model options', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /gitflow/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /trunk-based/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /github flow/i })).toBeInTheDocument()
  })

  it('switches branching model to Trunk-Based when clicked', () => {
    render(<App />)
    const trunkButton = screen.getByRole('button', { name: /trunk-based/i })
    fireEvent.click(trunkButton)
    expect(trunkButton).toHaveClass('active')
  })

  it('opens the commit modal when clicking the Commit action button', () => {
    render(<App />)
    const commitButtons = screen.getAllByRole('button', { name: /commit/i })
    // The nav action button is among them
    fireEvent.click(commitButtons[0])
    expect(screen.getByText('Create New Commit')).toBeInTheDocument()
  })

  it('renders the CI/CD Pipeline Simulator panel and Chaos Controls', () => {
    render(<App />)
    expect(screen.getByText(/CI\/CD Pipeline Simulator/i)).toBeInTheDocument()
    expect(screen.getByText(/Chaos Injection Controls/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /run ci\/cd/i })).toBeInTheDocument()
  })
})
