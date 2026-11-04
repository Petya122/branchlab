import { describe, it, expect, vi, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BranchModal, CommitModal, MergeModal } from '../components/ActionModals'
import { MergeConflictModal } from '../components/MergeConflictModal'
import { PullRequestModal } from '../components/PullRequestModal'
import { SettingsModal } from '../components/SettingsModal'
import { TrophyRoomModal } from '../components/TrophyRoomModal'
import { getInitialGitState } from '../utils/gitEngine'
import { DEFAULT_SETTINGS } from '../utils/settings'
import { INITIAL_TROPHIES } from '../utils/trophies'

const gitState = getInitialGitState('gitflow')

afterEach(() => vi.restoreAllMocks())

describe('CommitModal', () => {
  it('commits the trimmed message and closes; ignores empty input', () => {
    const onCommit = vi.fn()
    const onClose = vi.fn()
    render(<CommitModal isOpen onClose={onClose} activeBranch="develop" onCommit={onCommit} />)
    const input = screen.getByPlaceholderText('feat: add responsive layout')

    fireEvent.submit(input.closest('form')!)
    expect(onCommit).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '  feat: x  ' } })
    fireEvent.submit(input.closest('form')!)
    expect(onCommit).toHaveBeenCalledWith('feat: x')
    expect(onClose).toHaveBeenCalled()
  })

  it('renders nothing when closed', () => {
    const { container } = render(<CommitModal isOpen={false} onClose={vi.fn()} activeBranch="main" onCommit={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('BranchModal', () => {
  it('creates a branch from the selected base', () => {
    const onCreateBranch = vi.fn()
    render(<BranchModal isOpen onClose={vi.fn()} state={gitState} onCreateBranch={onCreateBranch} />)
    const create = screen.getByRole('button', { name: 'Create Branch' })
    expect(create).toBeDisabled()

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'main' } })
    fireEvent.change(screen.getByPlaceholderText(/feature\/payment/), { target: { value: 'hotfix/login' } })
    fireEvent.click(create)
    expect(onCreateBranch).toHaveBeenCalledWith('hotfix/login', 'main')
  })

  it('defaults "branch off from" to the active branch', () => {
    render(<BranchModal isOpen onClose={vi.fn()} state={gitState} onCreateBranch={vi.fn()} />)
    expect(screen.getByRole('combobox')).toHaveValue(gitState.activeBranch)
  })
})

describe('MergeModal', () => {
  it('blocks merging a branch into itself', () => {
    render(<MergeModal isOpen onClose={vi.fn()} state={gitState} onMerge={vi.fn()} />)
    const [source] = screen.getAllByRole('combobox')
    fireEvent.change(source, { target: { value: 'main' } })
    expect(screen.getByText(/must be different/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm Merge' })).toBeDisabled()
  })

  it('merges source into target', () => {
    const onMerge = vi.fn()
    const onClose = vi.fn()
    render(<MergeModal isOpen onClose={onClose} state={gitState} onMerge={onMerge} />)
    const [source, target] = screen.getAllByRole('combobox')
    fireEvent.change(source, { target: { value: 'feature/auth' } })
    fireEvent.change(target, { target: { value: 'develop' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Merge' }))
    expect(onMerge).toHaveBeenCalledWith('feature/auth', 'develop')
    expect(onClose).toHaveBeenCalled()
  })
})

describe('MergeConflictModal', () => {
  it.each([
    ['Accept Current (develop)', 'current', 'API_BASE = "https://api.branchlab.tech/v1"'],
    ['Accept Incoming (feature/auth)', 'incoming', 'API_BASE = "https://api.branchlab.tech/v2-edge"'],
    ['Accept Both (Combine)', 'both', 'API_BASE_V2'],
  ])('resolves with "%s"', (label, strategy, preview) => {
    const onResolve = vi.fn()
    render(
      <MergeConflictModal isOpen sourceBranch="feature/auth" targetBranch="develop" onClose={vi.fn()} onResolve={onResolve} />
    )
    fireEvent.click(screen.getByRole('button', { name: label }))
    expect(document.body.textContent).toContain(preview)
    fireEvent.click(screen.getByRole('button', { name: /resolve conflict & commit/i }))
    expect(onResolve).toHaveBeenCalledWith(strategy)
  })
})

describe('PullRequestModal', () => {
  const renderPr = (ciStatus: 'idle' | 'running' | 'passed' | 'failed', onMergePR = vi.fn()) =>
    render(
      <PullRequestModal
        isOpen
        sourceBranch="feature/auth"
        targetBranch="main"
        ciStatus={ciStatus}
        onClose={vi.fn()}
        onMergePR={onMergePR}
      />
    )

  it.each([
    ['idle', /not yet passed/i],
    ['failed', /required checks failed/i],
  ] as const)('blocks merging while CI is %s (branch protection)', (status, message) => {
    renderPr(status)
    expect(screen.getByText(message)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm squash & merge/i })).toBeDisabled()
  })

  it('squash-merges with the edited title once CI passed', () => {
    const onMergePR = vi.fn()
    renderPr('passed', onMergePR)
    expect(screen.getByText(/all checks have passed/i)).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('feat: integrate feature/auth updates'), {
      target: { value: 'feat: SSO login' },
    })
    fireEvent.click(screen.getByRole('button', { name: /confirm squash & merge/i }))
    expect(onMergePR).toHaveBeenCalledWith('feat: SSO login')
  })

  it('shows the diff tab', () => {
    renderPr('passed')
    fireEvent.click(screen.getByRole('button', { name: /files changed/i }))
    expect(document.body.textContent).toContain('legacy-api.branchlab.tech')
  })
})

describe('TrophyRoomModal', () => {
  it('shows level, XP and which trophies are unlocked', () => {
    const first = INITIAL_TROPHIES[0]
    render(
      <TrophyRoomModal
        isOpen
        onClose={vi.fn()}
        trophyState={{ xp: first.xp, unlockedIds: [first.id], unlockedDates: { [first.id]: Date.now() } }}
      />
    )
    expect(screen.getByText(/total xp/i).parentElement).toHaveTextContent(String(first.xp))
    for (const trophy of INITIAL_TROPHIES) {
      expect(screen.getByText(trophy.title)).toBeInTheDocument()
    }
  })
})

describe('SettingsModal', () => {
  function renderSettings() {
    const props = {
      onClose: vi.fn(),
      onUpdateSettings: vi.fn(),
      onResetTrophies: vi.fn(),
      onResetTour: vi.fn(),
    }
    render(
      <SettingsModal
        isOpen
        settings={DEFAULT_SETTINGS}
        gitState={gitState}
        trophyState={{ xp: 0, unlockedIds: [], unlockedDates: {} }}
        {...props}
      />
    )
    return props
  }

  it('updates animation speed, branch protection and default model', () => {
    const { onUpdateSettings } = renderSettings()
    fireEvent.click(screen.getByRole('button', { name: /fast/i }))
    expect(onUpdateSettings).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, animationSpeed: 'fast' })

    fireEvent.click(screen.getByRole('button', { name: /enforced/i }))
    expect(onUpdateSettings).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, strictBranchProtection: false })

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'trunk-based' } })
    expect(onUpdateSettings).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, defaultModel: 'trunk-based' })
  })

  it('resets trophies only after confirmation', () => {
    const { onResetTrophies } = renderSettings()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const button = screen.getByRole('button', { name: /reset trophies/i })
    fireEvent.click(button)
    expect(onResetTrophies).not.toHaveBeenCalled()
    fireEvent.click(button)
    expect(onResetTrophies).toHaveBeenCalledTimes(1)
    expect(confirm).toHaveBeenCalledTimes(2)
  })

  it('resets the tour', () => {
    const { onResetTour } = renderSettings()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: /reset tour/i }))
    expect(onResetTour).toHaveBeenCalled()
  })

  it('exports the session as a JSON download', () => {
    renderSettings()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toMatch(/^branchlab-session-\d+\.json$/)
      const json = JSON.parse(decodeURIComponent(this.href.split(',')[1]))
      expect(json).toMatchObject({ app: 'BranchLab', gitState: { activeBranch: gitState.activeBranch } })
    })
    fireEvent.click(screen.getByRole('button', { name: /export session/i }))
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('keeps all data when "Clear Cache" is cancelled', () => {
    renderSettings()
    localStorage.setItem('branchlab_settings_v1', '{}')
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    fireEvent.click(screen.getByRole('button', { name: /clear cache/i }))
    expect(localStorage.getItem('branchlab_settings_v1')).toBe('{}')
  })
})
