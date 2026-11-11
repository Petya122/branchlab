import { StrictMode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import App from '../App'
import pkg from '../../package.json'

vi.mock('../utils/celebrate', () => ({ celebrate: vi.fn() })) // jsdom has no canvas

/**
 * WHY: integration tests of the whole Interactive Lab, driven like a student
 * drives it (terminal, buttons, dialogs). They catch bugs that only appear
 * when the pieces work together: the git graph, the pipeline, branch
 * protection and the dialogs sharing one state. Most of them are regression
 * tests for bugs that really happened on branchlab.tech.
 */

const terminalLines = () =>
  Array.from(document.querySelectorAll('.terminal-body .log-line')).map((el) => el.textContent ?? '')
const graphHeader = () => screen.getByText(/commits • active:/i).textContent ?? ''
const commitCount = () => parseInt(graphHeader(), 10)

function runCommand(cmd: string) {
  const input = screen.getByRole('textbox', { name: 'Terminal command' })
  fireEvent.change(input, { target: { value: cmd } })
  fireEvent.submit(input.closest('form')!)
}

function renderLab(ui = <App />) {
  render(ui)
  fireEvent.click(screen.getByRole('button', { name: /^interactive lab$/i }))
}

async function runPipelineToEnd() {
  fireEvent.click(screen.getAllByRole('button', { name: /run ci\/cd/i })[0])
  await act(async () => {
    await vi.runAllTimersAsync()
  })
}

const openPr = () => fireEvent.click(screen.getByTitle(/simulate github pull request/i))

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('branchlab_tutorial_seen', 'true') // keep the tour out of the way
})
afterEach(() => vi.useRealTimers())

describe('terminal: git commands change the graph', () => {
  it('git checkout -b + git commit adds one commit on the new branch, echoed once', () => {
    renderLab()
    const before = commitCount()
    runCommand('git checkout -b feature/tests')
    runCommand('git commit -m "test: meaningful"')
    expect(graphHeader()).toContain('active: feature/tests')
    expect(commitCount()).toBe(before + 1)
    // Regression: each typed command used to be printed twice
    expect(terminalLines().filter((l) => l.startsWith('$ git commit'))).toHaveLength(1)
  })

  it('git merge creates a merge commit on the active branch', () => {
    renderLab()
    runCommand('git checkout develop')
    const before = commitCount()
    runCommand('git merge feature/auth')
    expect(commitCount()).toBe(before + 1)
    expect(terminalLines().some((l) => l.startsWith("Merged branch 'feature/auth' into develop"))).toBe(true)
  })

  it('git status, log and branch show the real repository state', () => {
    renderLab()
    runCommand('git status')
    runCommand('git log')
    runCommand('git branch')
    const out = terminalLines()
    // Regression: status used to show an internal id ("c3") instead of the hash
    expect(out).toContain('HEAD is at 5d88e2b feat(auth): implement student sso oauth flow')
    expect(out).toContain('3f90c1a (develop) ci: configure github actions workflow & vitest')
    expect(out).toContain('* feature/auth')
  })

  it('a mistyped branch gives a git-like error instead of crashing', () => {
    renderLab()
    runCommand('git checkout does-not-exist')
    expect(terminalLines()).toContain("[ERROR] Branch 'does-not-exist' does not exist.")
    expect(graphHeader()).toContain('active: feature/auth')
  })
})

describe('CI quality gate', () => {
  // Regression: the PR gate read "the last pipeline run", so a green run on
  // feature/auth unlocked a PR from develop after `git checkout develop`.
  it('a green run on one branch does not unlock a pull request from another branch', async () => {
    vi.useFakeTimers()
    renderLab()
    await runPipelineToEnd() // feature/auth is green
    runCommand('git checkout develop')
    openPr()
    expect(screen.getByRole('button', { name: /confirm squash & merge/i })).toBeDisabled()
  })

  it('switching back to the tested branch keeps it green, and its GitFlow PR targets develop', async () => {
    vi.useFakeTimers()
    renderLab()
    await runPipelineToEnd()
    runCommand('git checkout develop')
    runCommand('git checkout feature/auth')
    openPr()
    expect(screen.getByRole('button', { name: /confirm squash & merge/i })).toBeEnabled()
    expect(document.querySelector('.modal-content')?.textContent).toContain('into develop from feature/auth')
  })

  it('a failing stage stops the pipeline and blocks the PR; fixing it unblocks and earns Quality Gatekeeper', async () => {
    vi.useFakeTimers()
    renderLab()
    fireEvent.click(screen.getByRole('button', { name: /tests pass/i })) // inject a failing test
    await runPipelineToEnd()
    expect(terminalLines().some((l) => l.startsWith('[CI/CD RESULT] Pipeline terminated with errors'))).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /tests fail/i })) // fix it
    await runPipelineToEnd()
    expect(terminalLines().some((l) => l.includes('[ACHIEVEMENT UNLOCKED] Quality Gatekeeper'))).toBe(true)
  })

  it('a first green run is not a "fix", so it earns no Quality Gatekeeper', async () => {
    vi.useFakeTimers()
    renderLab()
    await runPipelineToEnd()
    expect(terminalLines().some((l) => l.includes('Quality Gatekeeper'))).toBe(false)
  })

  // Regression: feature branches "deployed" to a made-up preview URL
  it('a feature branch skips the deploy, like the real GitHub Actions workflow', async () => {
    vi.useFakeTimers()
    renderLab()
    await runPipelineToEnd()
    expect(screen.getByRole('button', { name: /deploy to oracle cloud: skipped/i })).toBeInTheDocument()
    expect(screen.queryByText(/deployment live/i)).toBeNull()
  })
})

describe('branching models and challenges', () => {
  it('switching to Trunk-Based resets the graph and awards Trunk Pioneer exactly once', () => {
    renderLab()
    runCommand('git commit -m "feat: discarded"')
    fireEvent.click(screen.getByRole('button', { name: /trunk-based/i }))
    expect(graphHeader()).toBe('3 commits • active: main')
    fireEvent.click(screen.getByRole('button', { name: /gitflow/i }))
    fireEvent.click(screen.getByRole('button', { name: /trunk-based/i }))
    expect(terminalLines().filter((l) => l.includes('[ACHIEVEMENT UNLOCKED]'))).toHaveLength(1)
  })

  // Regression: the challenge said a test was broken but nothing failed
  it('"Defend the Quality Gate" really starts with a failing test', () => {
    renderLab()
    while (!screen.queryByText('Defend the Quality Gate')) {
      fireEvent.click(screen.getByRole('button', { name: /next challenge/i }))
    }
    expect(screen.getByRole('button', { name: /tests fail/i })).toBeInTheDocument()
  })

  // Regression: the lab always started with GitFlow texts, whatever the setting
  it('the default model from Settings decides the first challenge, terminal text and pipeline', () => {
    localStorage.setItem('branchlab_settings_v1', JSON.stringify({ defaultModel: 'trunk-based' }))
    renderLab()
    expect(screen.getByText('Defend the Quality Gate')).toBeInTheDocument()
    expect(terminalLines()).toContain('On branch main')
  })

  it('GitHub Flow draws no lane for a develop branch it does not have', () => {
    renderLab()
    fireEvent.click(screen.getByRole('button', { name: /github flow/i }))
    const labels = Array.from(document.querySelectorAll('svg.canvas-svg text')).map((t) => t.textContent)
    expect(labels).not.toContain('develop')
  })
})

describe('dialogs always start from the current lab state', () => {
  // Regression: dialogs kept the values of the very first render
  it('the Branch dialog branches off the branch you are on now', () => {
    renderLab()
    runCommand('git checkout main')
    fireEvent.click(screen.getAllByRole('button', { name: /^branch$/i })[0])
    expect(screen.getByRole('combobox')).toHaveValue('main')
  })

  it('the Merge dialog offers branches created after the page loaded', () => {
    renderLab()
    runCommand('git checkout -b feature/brand-new')
    fireEvent.click(screen.getAllByRole('button', { name: /^merge$/i })[0])
    const [source] = screen.getAllByRole('combobox')
    expect(Array.from((source as HTMLSelectElement).options).map((o) => o.value)).toContain('feature/brand-new')
  })

  it('a PR cannot be opened from the branch it would merge into', () => {
    renderLab()
    runCommand('git checkout main')
    openPr()
    expect(document.querySelector('.modal-overlay')).toBeNull()
    expect(terminalLines().some((l) => l.startsWith("[INFO] You are on 'main'"))).toBe(true)
  })

  it('Escape closes the open dialog', () => {
    renderLab()
    fireEvent.click(screen.getByTitle('Open DevOps Trophy Room'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.querySelector('.modal-overlay')).toBeNull()
  })
})

describe('app-wide', () => {
  // Regression: side effects inside state updaters ran twice under StrictMode
  it('under React StrictMode an achievement and a chaos toggle are logged exactly once', () => {
    renderLab(
      <StrictMode>
        <App />
      </StrictMode>
    )
    fireEvent.click(screen.getByRole('button', { name: /trunk-based/i }))
    fireEvent.click(screen.getByRole('button', { name: /tests fail|tests pass/i }))
    expect(terminalLines().filter((l) => l.includes('[ACHIEVEMENT UNLOCKED]'))).toHaveLength(1)
    expect(terminalLines().filter((l) => l.startsWith('[CHAOS CONTROL] failTests'))).toHaveLength(1)
  })

  it('the terminal shows the version from package.json, so it never goes stale', () => {
    renderLab()
    expect(screen.getByText(`v${pkg.version}`)).toBeInTheDocument()
  })
})
