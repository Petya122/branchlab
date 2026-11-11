import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import { getInitialGitState } from '../utils/gitEngine'

vi.mock('../utils/celebrate', () => ({ celebrate: vi.fn() }))

/** Integration tests for the Interactive Lab: terminal, git actions, pipeline, trophies. */

function renderLab() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /^interactive lab$/i }))
}

function terminalLines(): string[] {
  return Array.from(document.querySelectorAll('.terminal-body .log-line')).map(
    (el) => el.textContent ?? ''
  )
}

function runCommand(cmd: string) {
  const input = screen.getByPlaceholderText(/git commit -m/i)
  fireEvent.change(input, { target: { value: cmd } })
  fireEvent.submit(input.closest('form')!)
}

function graphHeader(): string {
  return screen.getByText(/commits • active:/i).textContent ?? ''
}

function xpText(): string {
  return screen.getByTitle('Open DevOps Trophy Room').textContent ?? ''
}

async function runPipelineToEnd() {
  fireEvent.click(screen.getAllByRole('button', { name: /run ci\/cd/i })[0])
  await act(async () => {
    await vi.runAllTimersAsync()
  })
}

beforeEach(() => {
  localStorage.clear()
  // Skip the onboarding tour so it doesn't cover the lab
  localStorage.setItem('branchlab_tutorial_seen', 'true')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Interactive Lab terminal', () => {
  it('lists the available commands for "help"', () => {
    renderLab()
    runCommand('help')
    expect(terminalLines()).toContain('Available commands:')
  })

  it('creates and switches to a new branch with "git checkout -b"', () => {
    renderLab()
    runCommand('git checkout -b feature/e2e-test')
    expect(terminalLines()).toContain("Switched to a new branch 'feature/e2e-test'")
    expect(graphHeader()).toContain('active: feature/e2e-test')
  })

  it('adds a commit to the graph with "git commit -m"', () => {
    renderLab()
    const before = parseInt(graphHeader(), 10)
    runCommand('git commit -m "feat: add tests"')
    expect(parseInt(graphHeader(), 10)).toBe(before + 1)
    expect(terminalLines().some((l) => l.endsWith('feat: add tests'))).toBe(true)
  })

  it('switches branches with "git checkout <branch>"', () => {
    renderLab()
    runCommand('git checkout main')
    expect(terminalLines()).toContain("Switched to branch 'main'")
    expect(graphHeader()).toContain('active: main')
  })

  it('reports an error for an unknown branch', () => {
    renderLab()
    runCommand('git checkout does-not-exist')
    expect(terminalLines().some((l) => l.startsWith('[ERROR]'))).toBe(true)
  })

  it('merges a branch into the active branch with "git merge"', () => {
    renderLab()
    runCommand('git checkout develop')
    const before = parseInt(graphHeader(), 10)
    runCommand('git merge feature/auth')
    expect(terminalLines().some((l) => l.startsWith("Merged branch 'feature/auth' into develop"))).toBe(true)
    expect(parseInt(graphHeader(), 10)).toBe(before + 1)
  })

  it('shows the repository status for "git status"', () => {
    renderLab()
    runCommand('git status')
    expect(terminalLines()).toContain('On branch feature/auth')
  })

  it('explains unknown commands', () => {
    renderLab()
    runCommand('rm -rf /')
    expect(terminalLines().some((l) => l.startsWith('Command not recognized'))).toBe(true)
  })

  it('clears the output with "clear"', () => {
    renderLab()
    runCommand('help')
    runCommand('clear')
    expect(terminalLines()).toHaveLength(0)
  })
})

describe('Branching models and challenges', () => {
  it('resets the graph and awards a trophy when switching to Trunk-Based', () => {
    renderLab()
    expect(xpText()).toContain('0 XP')
    fireEvent.click(screen.getByRole('button', { name: /trunk-based/i }))
    const trunk = getInitialGitState('trunk-based')
    expect(graphHeader()).toBe(`${trunk.commits.length} commits • active: ${trunk.activeBranch}`)
    expect(terminalLines()).toContain('$ switched branching strategy to TRUNK-BASED')
    expect(terminalLines().some((l) => l.includes('[ACHIEVEMENT UNLOCKED]'))).toBe(true)
    expect(xpText()).toMatch(/• [1-9][0-9]* XP/)
  })

  it('awards each trophy only once', () => {
    renderLab()
    fireEvent.click(screen.getByRole('button', { name: /trunk-based/i }))
    fireEvent.click(screen.getByRole('button', { name: /gitflow/i }))
    fireEvent.click(screen.getByRole('button', { name: /trunk-based/i }))
    const unlocks = terminalLines().filter((l) => l.includes('[ACHIEVEMENT UNLOCKED]'))
    expect(unlocks).toHaveLength(1)
  })

  it('loads the next challenge scenario', () => {
    renderLab()
    fireEvent.click(screen.getByRole('button', { name: /next challenge/i }))
    expect(terminalLines().some((l) => l.includes('Loaded Challenge:'))).toBe(true)
  })
})

describe('CI/CD pipeline simulator', () => {
  it('runs all stages and reports success', async () => {
    vi.useFakeTimers()
    renderLab()
    await runPipelineToEnd()
    expect(terminalLines().some((l) => l.startsWith('[CI/CD RESULT] All checks passed'))).toBe(true)
  })

  // The Quality Gatekeeper trophy is for fixing a red pipeline, not for any green run
  it('awards Quality Gatekeeper only after turning a red pipeline green', async () => {
    vi.useFakeTimers()
    renderLab()
    await runPipelineToEnd()
    expect(terminalLines().some((l) => l.includes('Quality Gatekeeper'))).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: /tests pass/i }))
    await runPipelineToEnd()
    fireEvent.click(screen.getByRole('button', { name: /tests fail/i }))
    await runPipelineToEnd()
    expect(terminalLines().some((l) => l.includes('[ACHIEVEMENT UNLOCKED] Quality Gatekeeper'))).toBe(true)
  })

  it('skips the deploy for a feature branch, like the real workflow', async () => {
    vi.useFakeTimers()
    renderLab() // GitFlow starts on feature/auth
    await runPipelineToEnd()
    expect(terminalLines().some((l) => l.includes("Deploy skipped: 'feature/auth' is not main"))).toBe(true)
    expect(screen.queryByText(/deployment live/i)).toBeNull()
    expect(screen.getByRole('button', { name: /deploy to oracle cloud: skipped/i })).toBeInTheDocument()
  })

  it('stops at the failing stage when chaos injection is enabled', async () => {
    vi.useFakeTimers()
    renderLab()
    fireEvent.click(screen.getByRole('button', { name: /tests pass/i }))
    expect(terminalLines().some((l) => l.startsWith('[CHAOS CONTROL] failTests is now ENABLED'))).toBe(true)
    await runPipelineToEnd()
    expect(terminalLines().some((l) => l.startsWith('[CI/CD RESULT] Pipeline terminated with errors'))).toBe(true)
    expect(terminalLines().some((l) => l.startsWith('[CI/CD RESULT] All checks passed'))).toBe(false)
  })

  it('can be triggered from the terminal', async () => {
    vi.useFakeTimers()
    renderLab()
    runCommand('run pipeline')
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(terminalLines().some((l) => l.includes('[CI/CD TRIGGERED]'))).toBe(true)
  })
})

describe('Lab modals', () => {
  it('commits through the Commit modal', () => {
    renderLab()
    const before = parseInt(graphHeader(), 10)
    fireEvent.click(screen.getAllByRole('button', { name: /^commit$/i })[0])
    const input = screen.getByPlaceholderText('feat: add responsive layout')
    fireEvent.change(input, { target: { value: 'feat: modal commit' } })
    fireEvent.submit(input.closest('form')!)
    expect(parseInt(graphHeader(), 10)).toBe(before + 1)
  })

  it('opens the Pull Request, Merge Conflict and Trophy Room modals', () => {
    renderLab()
    fireEvent.click(screen.getByTitle(/simulate github pull request/i))
    expect(document.querySelector('.modal-overlay')).not.toBeNull()
    fireEvent.click(document.querySelector('.modal-overlay')!)

    fireEvent.click(screen.getByTitle(/simulate interactive git merge conflict/i))
    expect(document.querySelector('.modal-overlay')).not.toBeNull()
    fireEvent.click(document.querySelector('.modal-overlay')!)

    fireEvent.click(screen.getByTitle('Open DevOps Trophy Room'))
    const overlay = document.querySelector('.modal-overlay') as HTMLElement
    expect(within(overlay).getAllByText(/trophy/i).length).toBeGreaterThan(0)
  })

  it('shows the onboarding tour on the first visit', () => {
    localStorage.removeItem('branchlab_tutorial_seen')
    render(<App />)
    expect(screen.getByText(/step 1 of/i)).toBeInTheDocument()
  })
})

describe('Simulator rules (regressions)', () => {
  // A green run on feature/auth used to unlock a PR from develop after
  // `git checkout develop`, because the PR read "the last run".
  it('does not reuse a green CI run for another branch', async () => {
    vi.useFakeTimers()
    renderLab()
    await runPipelineToEnd() // feature/auth passes
    runCommand('git checkout develop')
    fireEvent.click(screen.getByTitle(/simulate github pull request/i))
    expect(screen.getByText(/ci pipeline not yet passed/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm squash & merge/i })).toBeDisabled()
  })

  it('keeps the green status when switching back to the tested branch', async () => {
    vi.useFakeTimers()
    renderLab()
    await runPipelineToEnd()
    runCommand('git checkout develop')
    runCommand('git checkout feature/auth')
    fireEvent.click(screen.getByTitle(/simulate github pull request/i))
    expect(screen.getByText(/all checks have passed/i)).toBeInTheDocument()
    // GitFlow: feature branches are integrated into develop
    expect(document.querySelector('.modal-content')?.textContent).toContain('into develop from feature/auth')
  })

  it('does not open a PR from the integration target itself', () => {
    renderLab()
    runCommand('git checkout main')
    fireEvent.click(screen.getByTitle(/simulate github pull request/i))
    expect(document.querySelector('.modal-overlay')).toBeNull()
    expect(terminalLines().some((l) => l.startsWith("[INFO] You are on 'main'"))).toBe(true)
  })

  it('draws no empty develop lane in GitHub Flow', () => {
    renderLab()
    fireEvent.click(screen.getByRole('button', { name: /github flow/i }))
    const lanes = Array.from(document.querySelectorAll('svg.canvas-svg text')).map((t) => t.textContent)
    expect(lanes).toContain('main')
    expect(lanes).not.toContain('develop')
  })

  it('closes the open modal with Escape', () => {
    renderLab()
    fireEvent.click(screen.getByTitle('Open DevOps Trophy Room'))
    expect(document.querySelector('.modal-overlay')).not.toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.querySelector('.modal-overlay')).toBeNull()
  })
})

describe('Modals opened after state changes', () => {
  // Regression: modals used to keep the values from the first render
  // (e.g. "branch off from" stayed on feature/auth after checking out main).
  it('starts the Branch modal from the current active branch', () => {
    renderLab()
    runCommand('git checkout main')
    fireEvent.click(screen.getAllByRole('button', { name: /^branch$/i })[0])
    expect(screen.getByRole('combobox')).toHaveValue('main')
  })

  it('suggests a PR title for the current branch', () => {
    renderLab()
    runCommand('git checkout -b feature/payments')
    fireEvent.click(screen.getByTitle(/simulate github pull request/i))
    expect(screen.getByDisplayValue('feat: integrate feature/payments updates')).toBeInTheDocument()
  })

  it('offers newly created branches in the Merge modal', () => {
    renderLab()
    runCommand('git checkout -b feature/brand-new')
    fireEvent.click(screen.getAllByRole('button', { name: /^merge$/i })[0])
    const [source] = screen.getAllByRole('combobox')
    expect(Array.from((source as HTMLSelectElement).options).map((o) => o.value)).toContain('feature/brand-new')
  })
})
