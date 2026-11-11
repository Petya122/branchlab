import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BranchModal, CommitModal, MergeModal } from '../components/ActionModals'
import { MergeConflictModal } from '../components/MergeConflictModal'
import { PullRequestModal } from '../components/PullRequestModal'
import { SettingsModal } from '../components/SettingsModal'
import { TrophyRoomModal } from '../components/TrophyRoomModal'
import { TutorialModal } from '../components/TutorialModal'
import { getInitialGitState } from '../utils/gitEngine'
import { DEFAULT_SETTINGS } from '../utils/settings'
import { INITIAL_TROPHIES } from '../utils/trophies'

/**
 * WHY: each dialog is a small form with its own rules (what may be submitted,
 * what is blocked, what is saved). React Testing Library drives them the way
 * a user does (by role and label), so the tests survive styling changes and
 * only fail when the behaviour a user relies on changes.
 */

const gitState = getInitialGitState('gitflow')

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('Commit dialog', () => {
  it('commits the trimmed message and refuses an empty one', () => {
    const onCommit = vi.fn()
    render(<CommitModal isOpen onClose={vi.fn()} activeBranch="develop" onCommit={onCommit} />)
    const input = screen.getByPlaceholderText('feat: add responsive layout')

    fireEvent.submit(input.closest('form')!)
    expect(onCommit).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '  feat: x  ' } })
    fireEvent.submit(input.closest('form')!)
    expect(onCommit).toHaveBeenCalledWith('feat: x')
  })
})

describe('Branch dialog', () => {
  it('creates the branch from the selected base', () => {
    const onCreateBranch = vi.fn()
    render(<BranchModal isOpen onClose={vi.fn()} state={gitState} onCreateBranch={onCreateBranch} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'main' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'New branch name' }), { target: { value: 'hotfix/login' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Branch' }))
    expect(onCreateBranch).toHaveBeenCalledWith('hotfix/login', 'main')
  })

  it('explains why a name is invalid or taken, and blocks it', () => {
    render(<BranchModal isOpen onClose={vi.fn()} state={gitState} onCreateBranch={vi.fn()} />)
    const name = screen.getByRole('textbox', { name: 'New branch name' })

    fireEvent.change(name, { target: { value: 'my branch' } })
    expect(screen.getByRole('alert')).toHaveTextContent(/spaces/)
    expect(screen.getByRole('button', { name: 'Create Branch' })).toBeDisabled()

    fireEvent.change(name, { target: { value: 'develop' } })
    expect(screen.getByRole('alert')).toHaveTextContent(/already exists/)
  })
})

describe('Merge dialog', () => {
  it('blocks merging a branch into itself and merges two different branches', () => {
    const onMerge = vi.fn()
    render(<MergeModal isOpen onClose={vi.fn()} state={gitState} onMerge={onMerge} />)
    const [source, target] = screen.getAllByRole('combobox')

    fireEvent.change(source, { target: { value: 'main' } })
    fireEvent.change(target, { target: { value: 'main' } })
    expect(screen.getByRole('button', { name: 'Confirm Merge' })).toBeDisabled()

    fireEvent.change(source, { target: { value: 'feature/auth' } })
    fireEvent.change(target, { target: { value: 'develop' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Merge' }))
    expect(onMerge).toHaveBeenCalledWith('feature/auth', 'develop')
  })
})

describe('Merge conflict dialog', () => {
  it.each([
    ['Accept Current (develop)', 'current', 'API_BASE = "https://api.branchlab.tech/v1"'],
    ['Accept Incoming (feature/auth)', 'incoming', 'API_BASE = "https://api.branchlab.tech/v2-edge"'],
    ['Accept Both (Combine)', 'both', 'API_BASE_V2'],
  ])('"%s" previews that side and resolves with it', (label, strategy, preview) => {
    const onResolve = vi.fn()
    render(<MergeConflictModal isOpen sourceBranch="feature/auth" targetBranch="develop" onClose={vi.fn()} onResolve={onResolve} />)
    fireEvent.click(screen.getByRole('button', { name: label }))
    expect(document.querySelector('pre')?.textContent).toContain(preview)
    fireEvent.click(screen.getByRole('button', { name: /resolve conflict & commit/i }))
    expect(onResolve).toHaveBeenCalledWith(strategy)
  })
})

describe('Pull request dialog (the CI gate)', () => {
  const renderPr = (ciStatus: 'idle' | 'running' | 'passed' | 'failed', onMergePR = vi.fn()) =>
    render(
      <PullRequestModal isOpen sourceBranch="feature/auth" targetBranch="develop" ciStatus={ciStatus} onClose={vi.fn()} onMergePR={onMergePR} />
    )

  it.each(['idle', 'running', 'failed'] as const)('cannot be merged while CI is %s', (status) => {
    renderPr(status)
    expect(screen.getByRole('button', { name: /confirm squash & merge/i })).toBeDisabled()
  })

  it('merges with the edited title once CI passed', () => {
    const onMergePR = vi.fn()
    renderPr('passed', onMergePR)
    fireEvent.change(screen.getByDisplayValue('feat: integrate feature/auth updates'), { target: { value: 'feat: SSO login' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm squash & merge/i }))
    expect(onMergePR).toHaveBeenCalledWith('feat: SSO login')
  })
})

describe('Settings dialog', () => {
  function renderSettings() {
    const props = { onClose: vi.fn(), onUpdateSettings: vi.fn(), onResetTrophies: vi.fn(), onResetTour: vi.fn() }
    render(
      <SettingsModal isOpen settings={DEFAULT_SETTINGS} gitState={gitState} trophyState={{ xp: 0, unlockedIds: [], unlockedDates: {} }} {...props} />
    )
    return props
  }

  it('changes branch protection and the default model', () => {
    const { onUpdateSettings } = renderSettings()
    fireEvent.click(screen.getByRole('button', { name: /enforced/i }))
    expect(onUpdateSettings).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, strictBranchProtection: false })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'trunk-based' } })
    expect(onUpdateSettings).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, defaultModel: 'trunk-based' })
  })

  it('only deletes progress or data after the user confirms', () => {
    const { onResetTrophies } = renderSettings()
    localStorage.setItem('branchlab_settings_v1', '{}')
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    fireEvent.click(screen.getByRole('button', { name: /reset trophies/i }))
    fireEvent.click(screen.getByRole('button', { name: /clear saved data/i }))
    expect(onResetTrophies).not.toHaveBeenCalled()
    expect(localStorage.getItem('branchlab_settings_v1')).toBe('{}')
  })

  it('exports the session as a downloadable JSON file', () => {
    renderSettings()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toMatch(/^branchlab-session-\d+\.json$/)
      const json = JSON.parse(decodeURIComponent(this.href.split(',')[1]))
      expect(json).toMatchObject({ app: 'BranchLab', gitState: { activeBranch: gitState.activeBranch } })
    })
    fireEvent.click(screen.getByRole('button', { name: /export session/i }))
    expect(click).toHaveBeenCalledTimes(1)
  })
})

describe('Trophy Room', () => {
  it('at the top level it says so instead of promising a level that does not exist', () => {
    const total = INITIAL_TROPHIES.reduce((sum, t) => sum + t.xp, 0)
    render(<TrophyRoomModal isOpen onClose={vi.fn()} trophyState={{ xp: total, unlockedIds: INITIAL_TROPHIES.map((t) => t.id), unlockedDates: {} }} />)
    expect(screen.getByText(/maximum level reached/i)).toBeInTheDocument()
    expect(screen.queryByText(/to level 5/i)).toBeNull()
  })
})

describe('Onboarding tour', () => {
  // Regression: the choice was only saved via "Skip tour", so the tour kept reopening
  it('remembers "don\'t show again" however it is closed', () => {
    const onClose = vi.fn()
    render(<TutorialModal isOpen onClose={onClose} />)
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
    expect(localStorage.getItem('branchlab_tutorial_seen')).toBe('true')
  })

  it('walks through all 5 steps; the last button closes the tour', () => {
    const onClose = vi.fn()
    render(<TutorialModal isOpen onClose={onClose} />)
    for (let step = 1; step < 5; step++) fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText(/step 5 of 5/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /start exploring/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
