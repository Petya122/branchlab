import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { HomePage } from '../components/HomePage'

describe('HomePage Component', () => {
  it('renders the hero title, subtitle, and badge', () => {
    const handleLaunch = vi.fn()
    const handleTour = vi.fn()
    render(<HomePage onLaunchLab={handleLaunch} onOpenTour={handleTour} />)

    expect(
      screen.getByText(/Master Git Branching & CI\/CD Pipelines in Real-Time/i)
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Soproni Egyetem/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/branchlab.me/i).length).toBeGreaterThan(0)
  })

  it('renders all four bento feature highlight cards', () => {
    render(<HomePage onLaunchLab={vi.fn()} onOpenTour={vi.fn()} />)

    expect(screen.getByText(/Interactive Git DAG/i)).toBeInTheDocument()
    expect(screen.getByText(/CI\/CD Pipeline Simulator/i)).toBeInTheDocument()
    expect(screen.getByText(/Merge Conflict Studio/i)).toBeInTheDocument()
    expect(screen.getByText(/DevOps Trophy Room/i)).toBeInTheDocument()
  })

  it('calls onLaunchLab when Launch Interactive Lab button is clicked', () => {
    const handleLaunch = vi.fn()
    render(<HomePage onLaunchLab={handleLaunch} onOpenTour={vi.fn()} />)

    const launchButton = screen.getByRole('button', { name: /launch interactive lab/i })
    fireEvent.click(launchButton)
    expect(handleLaunch).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenTour when Explore Quick Tour button is clicked', () => {
    const handleTour = vi.fn()
    render(<HomePage onLaunchLab={vi.fn()} onOpenTour={handleTour} />)

    const tourButton = screen.getByRole('button', { name: /explore quick tour/i })
    fireEvent.click(tourButton)
    expect(handleTour).toHaveBeenCalledTimes(1)
  })
})
