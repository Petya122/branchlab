import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { TutorialModal } from '../components/TutorialModal'

describe('TutorialModal Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the first step when open', () => {
    const handleClose = vi.fn()
    render(<TutorialModal isOpen={true} onClose={handleClose} />)

    expect(screen.getByText(/Master Modern DevOps & Git Workflows/i)).toBeInTheDocument()
    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('advances through steps when clicking Next and goes back when clicking Back', () => {
    const handleClose = vi.fn()
    render(<TutorialModal isOpen={true} onClose={handleClose} />)

    // Advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText(/Interactive Git DAG & Branch Rails/i)).toBeInTheDocument()
    expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument()

    // Go back to Step 1
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText(/Master Modern DevOps & Git Workflows/i)).toBeInTheDocument()
  })

  it('calls onClose when Skip tour is clicked', () => {
    const handleClose = vi.fn()
    render(<TutorialModal isOpen={true} onClose={handleClose} />)

    fireEvent.click(screen.getByText(/skip tour/i))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('sets localStorage item when dont show again is checked and tour is finished', () => {
    const handleClose = vi.fn()
    render(<TutorialModal isOpen={true} onClose={handleClose} />)

    const checkbox = screen.getByLabelText(/don't show this guide automatically/i)
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    fireEvent.click(screen.getByText(/skip tour/i))
    expect(localStorage.getItem('branchlab_tutorial_seen')).toBe('true')
  })
})
