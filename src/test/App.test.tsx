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
    expect(screen.getAllByText(/branchlab.me/i).length).toBeGreaterThan(0)
  })

  it('renders both Home and Interactive Lab navigation tabs', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /^home$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^interactive lab$/i })).toBeInTheDocument()
  })

  it('switches to Interactive Lab and renders branching model options', () => {
    render(<App />)
    const labTab = screen.getByRole('button', { name: /^interactive lab$/i })
    fireEvent.click(labTab)

    expect(screen.getByRole('button', { name: /gitflow/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /trunk-based/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /github flow/i })).toBeInTheDocument()
  })

  it('opens the commit modal when in Lab view and clicking Commit', () => {
    render(<App />)
    // Switch to lab view
    fireEvent.click(screen.getByRole('button', { name: /^interactive lab$/i }))

    const commitButtons = screen.getAllByRole('button', { name: /commit/i })
    fireEvent.click(commitButtons[0])
    expect(screen.getByText('Create New Commit')).toBeInTheDocument()
  })

  it('renders the CI/CD Pipeline Simulator and Chaos Controls in Lab view', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /^interactive lab$/i }))

    expect(screen.getByText(/CI\/CD Pipeline Simulator/i)).toBeInTheDocument()
    expect(screen.getByText(/Chaos Injection Controls/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /run ci\/cd/i })).toBeInTheDocument()
  })

  it('opens the Settings modal when clicking the Settings button', () => {
    render(<App />)
    const settingsBtn = screen.getByRole('button', { name: /settings/i })
    fireEvent.click(settingsBtn)
    expect(screen.getByText('BranchLab Settings')).toBeInTheDocument()
    expect(screen.getByText(/Strict Branch Protection/i)).toBeInTheDocument()
  })
})
