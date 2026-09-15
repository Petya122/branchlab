import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { SettingsModal } from '../components/SettingsModal'
import { DEFAULT_SETTINGS } from '../utils/settings'
import { getInitialGitState } from '../utils/gitEngine'

describe('SettingsModal Component', () => {
  const dummyGitState = getInitialGitState('gitflow')
  const dummyTrophyState = { xp: 50, unlockedIds: ['quality-gatekeeper'], unlockedDates: {} }

  it('renders options when open', () => {
    render(
      <SettingsModal
        isOpen={true}
        settings={DEFAULT_SETTINGS}
        gitState={dummyGitState}
        trophyState={dummyTrophyState}
        onClose={vi.fn()}
        onUpdateSettings={vi.fn()}
        onResetTrophies={vi.fn()}
        onResetTour={vi.fn()}
      />
    )

    expect(screen.getByText('BranchLab Settings')).toBeInTheDocument()
    expect(screen.getByText(/Strict Branch Protection/i)).toBeInTheDocument()
    expect(screen.getByText(/Animation & Pulse Speed/i)).toBeInTheDocument()
  })

  it('calls onUpdateSettings when toggling animation speed', () => {
    const handleUpdate = vi.fn()
    render(
      <SettingsModal
        isOpen={true}
        settings={DEFAULT_SETTINGS}
        gitState={dummyGitState}
        trophyState={dummyTrophyState}
        onClose={vi.fn()}
        onUpdateSettings={handleUpdate}
        onResetTrophies={vi.fn()}
        onResetTour={vi.fn()}
      />
    )

    const fastButton = screen.getByRole('button', { name: /fast/i })
    fireEvent.click(fastButton)
    expect(handleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ animationSpeed: 'fast' })
    )
  })

  it('calls onClose when clicking Save & Close', () => {
    const handleClose = vi.fn()
    render(
      <SettingsModal
        isOpen={true}
        settings={DEFAULT_SETTINGS}
        gitState={dummyGitState}
        trophyState={dummyTrophyState}
        onClose={handleClose}
        onUpdateSettings={vi.fn()}
        onResetTrophies={vi.fn()}
        onResetTour={vi.fn()}
      />
    )

    const closeButton = screen.getByRole('button', { name: /save & close/i })
    fireEvent.click(closeButton)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('renders the Clear Cache & Reset button', () => {
    render(
      <SettingsModal
        isOpen={true}
        settings={DEFAULT_SETTINGS}
        gitState={dummyGitState}
        trophyState={dummyTrophyState}
        onClose={vi.fn()}
        onUpdateSettings={vi.fn()}
        onResetTrophies={vi.fn()}
        onResetTour={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /clear cache & reset/i })).toBeInTheDocument()
  })
})
