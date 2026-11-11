import { StrictMode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import App from '../App'
import { useTrophies } from '../hooks/useTrophies'
import { useModals } from '../hooks/useModals'
import { useTerminalLog, errorLine } from '../hooks/useTerminalLog'
import { usePipelineSimulator } from '../hooks/usePipelineSimulator'
import { useGitSimulator } from '../hooks/useGitSimulator'
import { resetTutorialSeen, shouldShowTutorial } from '../utils/tutorial'

vi.mock('../utils/celebrate', () => ({ celebrate: vi.fn() }))

beforeEach(() => localStorage.clear())
afterEach(() => vi.useRealTimers())

describe('useTrophies', () => {
  it('unlocks a trophy once, adds XP and persists it', () => {
    const onUnlock = vi.fn()
    const { result } = renderHook(() => useTrophies(onUnlock))

    act(() => result.current.triggerTrophy('trunk-pioneer'))
    act(() => result.current.triggerTrophy('trunk-pioneer'))

    expect(onUnlock).toHaveBeenCalledTimes(1)
    expect(result.current.trophyState.unlockedIds).toEqual(['trunk-pioneer'])
    expect(result.current.trophyState.xp).toBeGreaterThan(0)
    expect(localStorage.getItem('branchlab_trophies_v1')).toContain('trunk-pioneer')
  })

  it('ignores unknown trophy ids', () => {
    const onUnlock = vi.fn()
    const { result } = renderHook(() => useTrophies(onUnlock))
    act(() => result.current.triggerTrophy('does-not-exist'))
    expect(onUnlock).not.toHaveBeenCalled()
    expect(result.current.trophyState.xp).toBe(0)
  })

  it('resets XP and unlocked trophies', () => {
    const { result } = renderHook(() => useTrophies(vi.fn()))
    act(() => result.current.triggerTrophy('trunk-pioneer'))
    act(() => result.current.resetTrophies())
    expect(result.current.trophyState).toEqual({ xp: 0, unlockedIds: [], unlockedDates: {} })
    expect(result.current.level.level).toBe(1)
  })
})

describe('useModals', () => {
  it('keeps at most one modal open', () => {
    const { result } = renderHook(() => useModals('tutorial'))
    expect(result.current.isOpen('tutorial')).toBe(true)
    act(() => result.current.openModal('settings'))
    expect(result.current.isOpen('settings')).toBe(true)
    expect(result.current.isOpen('tutorial')).toBe(false)
    act(() => result.current.closeModal())
    expect(result.current.openModalId).toBeNull()
  })
})

describe('useTerminalLog', () => {
  it('appends and clears lines', () => {
    const { result } = renderHook(() => useTerminalLog(['first']))
    act(() => result.current.log('second', 'third'))
    expect(result.current.logs).toEqual(['first', 'second', 'third'])
    act(() => result.current.clear())
    expect(result.current.logs).toEqual([])
  })

  it('formats thrown values as error lines', () => {
    expect(errorLine(new Error('boom'))).toBe('[ERROR] boom')
    expect(errorLine('plain', '[PR ERROR]')).toBe('[PR ERROR] plain')
  })
})

describe('usePipelineSimulator', () => {
  const target = { commitHash: 'abc1234', commitMessage: 'feat: x', branch: 'main' }

  function setup() {
    const deps = { log: vi.fn(), triggerTrophy: vi.fn(), onPassed: vi.fn(), animationSpeed: 'fast' as const }
    const hook = renderHook(() => usePipelineSimulator(target, deps))
    return { ...hook, deps }
  }

  it('passes every stage on main, including the deploy', async () => {
    vi.useFakeTimers()
    const { result, deps } = setup()
    await act(async () => {
      const run = result.current.runPipeline(target)
      await vi.runAllTimersAsync()
      await run
    })
    expect(result.current.pipelineRun.status).toBe('passed')
    expect(result.current.pipelineRun.stages.every((s) => s.status === 'success')).toBe(true)
    // A first green run is not a "fix", so no Quality Gatekeeper trophy yet
    expect(deps.triggerTrophy).not.toHaveBeenCalled()
    expect(deps.onPassed).toHaveBeenCalledTimes(1)
    expect(result.current.isRunning).toBe(false)
  })

  it('stops at the first failing stage and skips the rest', async () => {
    vi.useFakeTimers()
    const { result, deps } = setup()
    act(() => result.current.toggleChaos('failSecurity'))
    await act(async () => {
      const run = result.current.runPipeline(target)
      await vi.runAllTimersAsync()
      await run
    })
    const statuses = Object.fromEntries(result.current.pipelineRun.stages.map((s) => [s.id, s.status]))
    expect(result.current.pipelineRun.status).toBe('failed')
    expect(statuses).toMatchObject({ lint: 'success', 'unit-tests': 'success', security: 'failed', build: 'idle', deploy: 'idle' })
    expect(deps.onPassed).not.toHaveBeenCalled()
  })

  it('ignores a second start while a run is in progress', async () => {
    vi.useFakeTimers()
    const { result, deps } = setup()
    await act(async () => {
      const first = result.current.runPipeline(target)
      const second = result.current.runPipeline(target)
      await vi.runAllTimersAsync()
      await Promise.all([first, second])
    })
    const triggered = deps.log.mock.calls.filter(([line]) => String(line).includes('[CI/CD TRIGGERED]'))
    expect(triggered).toHaveLength(1)
  })
})

describe('tutorial storage helpers', () => {
  it('remembers and resets the "seen" flag', () => {
    expect(shouldShowTutorial()).toBe(true)
    localStorage.setItem('branchlab_tutorial_seen', 'true')
    expect(shouldShowTutorial()).toBe(false)
    resetTutorialSeen()
    expect(shouldShowTutorial()).toBe(true)
  })
})

describe('App under React StrictMode', () => {
  // Regression test: side effects used to run inside setState updaters, which
  // StrictMode calls twice, so achievements and chaos messages were logged twice.
  it('logs an unlocked achievement and a chaos toggle exactly once', () => {
    localStorage.setItem('branchlab_tutorial_seen', 'true')
    render(
      <StrictMode>
        <App />
      </StrictMode>
    )
    fireEvent.click(screen.getByRole('button', { name: /^interactive lab$/i }))
    fireEvent.click(screen.getByRole('button', { name: /trunk-based/i }))
    fireEvent.click(screen.getByRole('button', { name: /tests pass/i }))

    const lines = Array.from(document.querySelectorAll('.terminal-body .log-line')).map((el) => el.textContent)
    expect(lines.filter((l) => l?.includes('[ACHIEVEMENT UNLOCKED]'))).toHaveLength(1)
    expect(lines.filter((l) => l?.startsWith('[CHAOS CONTROL]'))).toHaveLength(1)
  })
})

describe('useGitSimulator', () => {
  type CiStatus = 'idle' | 'running' | 'passed' | 'failed'
  function setup(
    opts: { model?: 'gitflow' | 'trunk-based' | 'github-flow'; strict?: boolean; ci?: (hash: string) => CiStatus } = {}
  ) {
    const deps = {
      log: vi.fn(),
      triggerTrophy: vi.fn(),
      onNewHead: vi.fn(),
      strictBranchProtection: opts.strict ?? true,
      ciStatusFor: vi.fn(opts.ci ?? ((): CiStatus => 'passed')),
    }
    const hook = renderHook(() => useGitSimulator(opts.model ?? 'gitflow', deps))
    return { ...hook, deps }
  }
  const logged = (deps: { log: ReturnType<typeof vi.fn> }) => deps.log.mock.calls.flat().map(String)

  it('integrates GitFlow feature branches into develop and everything else into main', () => {
    const { result } = setup()
    expect(result.current.gitState.activeBranch).toBe('feature/auth')
    expect(result.current.integrationTarget).toBe('develop')
    act(() => result.current.createBranch('hotfix/x', 'main'))
    expect(result.current.integrationTarget).toBe('main')
  })

  it('targets main for feature branches in GitHub Flow (there is no develop)', () => {
    const { result } = setup({ model: 'github-flow' })
    expect(result.current.gitState.branches['develop']).toBeUndefined()
    expect(result.current.integrationTarget).toBe('main')
  })

  it('resolves a merge conflict with a merge commit and a trophy', () => {
    const { result, deps } = setup()
    const before = result.current.gitState.commits.length
    act(() => result.current.resolveConflict('both'))
    expect(result.current.gitState.commits.length).toBe(before + 1)
    expect(result.current.selectedCommit?.isMerge).toBe(true)
    expect(logged(deps).some((l) => l.includes('Conflict Resolved via strategy: both'))).toBe(true)
    expect(deps.triggerTrophy).toHaveBeenCalledWith('conflict-master')
  })

  // Regression: in GitHub Flow the conflict targeted the non-existent develop
  // branch, the merge failed silently and still printed success + a trophy.
  it('really merges a GitHub Flow conflict into main', () => {
    const { result, deps } = setup({ model: 'github-flow' })
    const before = result.current.gitState.commits.length
    act(() => result.current.resolveConflict('incoming'))
    expect(result.current.gitState.commits.length).toBe(before + 1)
    expect(result.current.gitState.activeBranch).toBe('main')
    expect(deps.triggerTrophy).toHaveBeenCalledWith('conflict-master')
  })

  it('reports a failed conflict merge instead of faking success', () => {
    const { result, deps } = setup()
    act(() => result.current.resolveConflict('both')) // feature/auth -> develop
    act(() => result.current.checkout('feature/auth'))
    deps.triggerTrophy.mockClear()
    act(() => result.current.resolveConflict('both')) // nothing new to merge
    expect(logged(deps).some((l) => l.startsWith('[CONFLICT] Already up to date'))).toBe(true)
    expect(deps.triggerTrophy).not.toHaveBeenCalled()
  })

  // Regression: "Squash & merge" used to create a two-parent merge commit.
  it('squash-merges a pull request as one single-parent commit with the PR title', () => {
    const { result, deps } = setup()
    const developHead = result.current.gitState.branches['develop'].targetCommitId
    act(() => result.current.mergePullRequest('feat: SSO login'))
    const squash = result.current.selectedCommit!
    expect(squash.message).toBe('feat: SSO login (#24)')
    expect(squash.branch).toBe('develop')
    expect(squash.parents).toEqual([developHead])
    expect(squash.isMerge).toBeFalsy()
    expect(result.current.prNumber).toBe(25)
    expect(deps.triggerTrophy).toHaveBeenCalledWith('pr-champion')
  })

  it('awards the hotfix trophy only for hotfix branches merged into main', () => {
    const { result, deps } = setup()
    act(() => result.current.createBranch('hotfix/urgent', 'main'))
    act(() => result.current.commit('fix: urgent patch'))
    act(() => result.current.merge('hotfix/urgent', 'main'))
    expect(deps.triggerTrophy).toHaveBeenCalledWith('hotfix-firefighter')
    expect(deps.onNewHead).toHaveBeenCalled()
  })

  // Regression: the "Strict Branch Protection" setting used to do nothing.
  describe('branch protection', () => {
    it('blocks direct commits to main while enforced', () => {
      const { result, deps } = setup()
      act(() => result.current.checkout('main'))
      const before = result.current.gitState.commits.length
      act(() => result.current.commit('fix: straight to prod'))
      expect(result.current.gitState.commits.length).toBe(before)
      expect(logged(deps).some((l) => l.startsWith("[BRANCH PROTECTION] Direct commits to 'main'"))).toBe(true)
    })

    it('blocks merges into main from a branch without green CI', () => {
      const { result, deps } = setup({ ci: () => 'failed' })
      act(() => result.current.createBranch('hotfix/untested', 'main'))
      act(() => result.current.commit('fix: untested'))
      const before = result.current.gitState.commits.length
      act(() => result.current.merge('hotfix/untested', 'main'))
      expect(result.current.gitState.commits.length).toBe(before)
      expect(logged(deps).some((l) => l.startsWith("[BRANCH PROTECTION] 'main' is protected"))).toBe(true)
    })

    it('allows everything in Permissive mode', () => {
      const { result } = setup({ strict: false, ci: () => 'idle' })
      act(() => result.current.checkout('main'))
      const before = result.current.gitState.commits.length
      act(() => result.current.commit('fix: allowed'))
      act(() => result.current.merge('develop', 'main'))
      expect(result.current.gitState.commits.length).toBe(before + 2)
    })

    it('does not protect develop', () => {
      const { result } = setup({ ci: () => 'idle' })
      act(() => result.current.merge('feature/auth', 'develop'))
      expect(result.current.gitState.activeBranch).toBe('develop')
    })
  })

  it('reports CI per branch head commit', () => {
    const { result } = setup({ ci: (hash) => (hash === '5d88e2b' ? 'passed' : 'idle') })
    expect(result.current.ciStatusOfBranch('feature/auth')).toBe('passed')
    expect(result.current.ciStatusOfBranch('develop')).toBe('idle')
  })

  it('logs errors instead of throwing for invalid operations', () => {
    const { result, deps } = setup()
    act(() => result.current.createBranch('main', 'develop'))
    act(() => result.current.merge('nope', 'develop'))
    act(() => result.current.merge('develop', 'develop'))
    expect(logged(deps).filter((l) => l.startsWith('[ERROR]'))).toHaveLength(3)
  })

  it('resets the graph when the branching model changes', () => {
    const { result, deps } = setup()
    act(() => result.current.commit('feat: will be discarded'))
    act(() => result.current.changeModel('github-flow'))
    expect(result.current.model).toBe('github-flow')
    expect(result.current.selectedCommit).toBeNull()
    expect(deps.triggerTrophy).not.toHaveBeenCalledWith('trunk-pioneer')
  })
})

describe('usePipelineSimulator results per commit', () => {
  // Regression: the PR gate read "the last run", so a green run on one branch
  // unlocked PRs from any other branch after a checkout.
  it('remembers the result only for the commit that was tested', async () => {
    vi.useFakeTimers()
    const deps = { log: vi.fn(), triggerTrophy: vi.fn(), onPassed: vi.fn(), animationSpeed: 'fast' as const }
    const target = { commitHash: 'aaa1111', commitMessage: 'm', branch: 'feature/x' }
    const { result } = renderHook(() => usePipelineSimulator(target, deps))
    expect(result.current.statusFor('aaa1111')).toBe('idle')
    await act(async () => {
      const run = result.current.runPipeline(target)
      await vi.runAllTimersAsync()
      await run
    })
    expect(result.current.statusFor('aaa1111')).toBe('passed')
    expect(result.current.statusFor('bbb2222')).toBe('idle')
    expect(deps.log.mock.calls.flat().map(String)).toContain(
      "[CI/CD RESULT] All checks passed on 'feature/x' ✨ Deploy skipped: merge to main to release."
    )
    expect(result.current.pipelineRun.stages.find((s) => s.id === 'deploy')?.status).toBe('skipped')
  })
})
