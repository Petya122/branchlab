import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from '../App'
import { BranchModal } from '../components/ActionModals'
import { TrophyRoomModal } from '../components/TrophyRoomModal'
import { TutorialModal } from '../components/TutorialModal'
import { createBranch, getInitialGitState, onelineLog, validateBranchName } from '../utils/gitEngine'
import { parseTerminalCommand } from '../utils/terminalCommands'
import { calculateDevOpsLevel, INITIAL_TROPHIES } from '../utils/trophies'
import { firstScenarioIndexFor, SCENARIOS } from '../utils/scenarios'
import { generateStageLogs } from '../utils/pipelineEngine'
import pkg from '../../package.json'

vi.mock('../utils/celebrate', () => ({ celebrate: vi.fn() }))

/** Regression tests for the issues found in the full site review (release 1.6.0). */

const terminalLines = () =>
  Array.from(document.querySelectorAll('.terminal-body .log-line')).map((el) => el.textContent ?? '')

function runCommand(cmd: string) {
  const input = screen.getByRole('textbox', { name: 'Terminal command' })
  fireEvent.change(input, { target: { value: cmd } })
  fireEvent.submit(input.closest('form')!)
}

function renderLab() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /^interactive lab$/i }))
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('branchlab_tutorial_seen', 'true')
})
afterEach(() => vi.useRealTimers())

describe('onboarding tour', () => {
  it('remembers "don\'t show again" even when closed with ✕', () => {
    localStorage.clear()
    const onClose = vi.fn()
    render(<TutorialModal isOpen onClose={onClose} />)
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
    expect(localStorage.getItem('branchlab_tutorial_seen')).toBe('true')
  })

  it('shows the saved choice and can undo it', () => {
    render(<TutorialModal isOpen onClose={vi.fn()} />)
    const box = screen.getByRole('checkbox')
    expect(box).toBeChecked()
    fireEvent.click(box)
    expect(localStorage.getItem('branchlab_tutorial_seen')).toBeNull()
  })
})

describe('lab terminal', () => {
  it('prints each typed git command only once', () => {
    renderLab()
    runCommand('git commit -m "feat: once"')
    runCommand('git checkout -b feature/once')
    expect(terminalLines().filter((l) => l.startsWith('$ git commit'))).toHaveLength(1)
    expect(terminalLines().filter((l) => l.startsWith('$ git checkout -b'))).toHaveLength(1)
  })

  it('shows the HEAD commit hash in git status, not an internal id', () => {
    renderLab()
    runCommand('git status')
    expect(terminalLines()).toContain('HEAD is at 5d88e2b feat(auth): implement student sso oauth flow')
    expect(terminalLines().some((l) => l.includes('c3'))).toBe(false)
  })

  it('supports git log, git branch and git switch', () => {
    renderLab()
    runCommand('git log')
    expect(terminalLines()).toContain('5d88e2b (HEAD -> feature/auth) feat(auth): implement student sso oauth flow')
    runCommand('git switch -c feature/new')
    runCommand('git branch')
    expect(terminalLines()).toContain('* feature/new')
    runCommand('git switch main')
    expect(terminalLines()).toContain("Switched to branch 'main'")
  })

  it('shows the real app version in the terminal header', () => {
    renderLab()
    expect(screen.getByText(`v${pkg.version}`)).toBeInTheDocument()
  })

  it.each([
    ['git log --oneline', { kind: 'log' }],
    ['git branch', { kind: 'list-branches' }],
    ['git switch -c feature/x', { kind: 'create-branch', branch: 'feature/x' }],
    ['git switch develop', { kind: 'checkout', branch: 'develop' }],
    ['git commit -m "mixed\'', { kind: 'unknown', input: 'git commit -m "mixed\'' }],
  ])('parses %j', (input, expected) => {
    expect(parseTerminalCommand(input)).toEqual(expected)
  })
})

describe('challenges', () => {
  it('"Defend the Quality Gate" really starts with a failing test', () => {
    renderLab()
    while (!screen.queryByText('Defend the Quality Gate')) {
      fireEvent.click(screen.getByRole('button', { name: /next challenge/i }))
    }
    expect(screen.getByRole('button', { name: /tests fail/i })).toBeInTheDocument()
  })

  it('starts with a challenge and terminal text that match the default model', () => {
    localStorage.setItem('branchlab_settings_v1', JSON.stringify({ defaultModel: 'trunk-based' }))
    renderLab()
    expect(screen.getByText(SCENARIOS[firstScenarioIndexFor('trunk-based')].title)).toBeInTheDocument()
    expect(terminalLines()).toContain('On branch main')
    expect(screen.getByRole('button', { name: /tests fail/i })).toBeInTheDocument()
  })

  it('has a challenge for every branching model', () => {
    for (const model of ['gitflow', 'trunk-based', 'github-flow'] as const) {
      expect(SCENARIOS[firstScenarioIndexFor(model)].initialModel).toBe(model)
    }
  })
})

describe('trophies and levels', () => {
  it('shows the XP still missing, not the size of the level', () => {
    const level = calculateDevOpsLevel(50)
    expect(level).toMatchObject({ level: 1, currentXp: 50, nextLevelXp: 100, xpToNextLevel: 50, isMaxLevel: false })
  })

  it('treats all trophies (325 XP) as the maximum level', () => {
    const total = INITIAL_TROPHIES.reduce((sum, t) => sum + t.xp, 0)
    expect(total).toBe(325)
    const level = calculateDevOpsLevel(total)
    expect(level).toMatchObject({ level: 4, isMaxLevel: true, xpToNextLevel: 0, progressPct: 100 })
    render(
      <TrophyRoomModal
        isOpen
        onClose={vi.fn()}
        trophyState={{ xp: total, unlockedIds: INITIAL_TROPHIES.map((t) => t.id), unlockedDates: {} }}
      />
    )
    expect(screen.getByText(/maximum level reached/i)).toBeInTheDocument()
    expect(screen.queryByText(/to level 5/i)).toBeNull()
  })
})

describe('branch names', () => {
  it.each(['feature/login', 'hotfix/v1.2', 'release/2026-11', 'bugfix/a_b'])('accepts %j', (name) => {
    expect(validateBranchName(name)).toBeNull()
  })

  it.each(['my branch', 'feature/', '-x', 'a..b', 'a//b', 'x.lock', 'HEAD', 'ékezet', '.hidden'])(
    'rejects %j',
    (name) => {
      expect(validateBranchName(name)).not.toBeNull()
      expect(() => createBranch(getInitialGitState('gitflow'), name)).toThrow(/not a valid branch name/)
    }
  )

  it('explains an invalid name in the Branch dialog and blocks it', () => {
    const onCreateBranch = vi.fn()
    render(<BranchModal isOpen onClose={vi.fn()} state={getInitialGitState('gitflow')} onCreateBranch={onCreateBranch} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'New branch name' }), { target: { value: 'my branch' } })
    expect(screen.getByRole('alert')).toHaveTextContent(/spaces/)
    expect(screen.getByRole('button', { name: 'Create Branch' })).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox', { name: 'New branch name' }), { target: { value: 'develop' } })
    expect(screen.getByRole('alert')).toHaveTextContent(/already exists/)
  })
})

describe('git log and pipeline texts', () => {
  it('follows first parents from HEAD with decorations', () => {
    const state = getInitialGitState('gitflow')
    expect(onelineLog(state)).toEqual([
      '5d88e2b (HEAD -> feature/auth) feat(auth): implement student sso oauth flow',
      '3f90c1a (develop) ci: configure github actions workflow & vitest',
      '7a12b4e (main, tag: v0.1.0) chore: initial project setup with vite & react',
    ])
  })

  it('describes the real deploy: GHCR, SSH and a smoke test on main only', () => {
    const main = generateStageLogs('deploy', true, 'main', 'abc1234').join('\n')
    expect(main).toContain('ghcr.io/petya122/branchlab:sha-abc1234')
    expect(main).toContain('https://branchlab.tech')
    expect(main).not.toMatch(/edge|cdn/i)
    const feature = generateStageLogs('deploy', true, 'feature/x', 'abc1234').join('\n')
    expect(feature).toContain('Deploy skipped')
    expect(feature).not.toContain('https://')
  })
})
