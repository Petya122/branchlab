import { describe, it, expect } from 'vitest'
import { HELP_LINES, parseTerminalCommand } from '../utils/terminalCommands'

/**
 * WHY: the terminal is where students type real Git commands. A parsing
 * mistake silently runs the wrong action (e.g. `git checkout -b x` treated as
 * a checkout of a branch called "-b x"). The parser is pure, so a table of
 * inputs covers it cheaply.
 */
describe('parseTerminalCommand', () => {
  it.each([
    ['  HELP  ', { kind: 'help' }],
    ['run pipeline', { kind: 'run-pipeline' }],
    ['git status', { kind: 'status' }],
    ['git log --oneline', { kind: 'log' }],
    ['git branch', { kind: 'list-branches' }],
    ['git commit -m "feat: login"', { kind: 'commit', message: 'feat: login' }],
    ["git commit -m 'fix: it\"s'", { kind: 'commit', message: 'fix: it"s' }],
    // order matters: -b / -c must win over a plain checkout / switch
    ['git checkout -b feature/x', { kind: 'create-branch', branch: 'feature/x' }],
    ['git switch -c feature/x', { kind: 'create-branch', branch: 'feature/x' }],
    ['git checkout main', { kind: 'checkout', branch: 'main' }],
    ['git switch release/v1.0', { kind: 'checkout', branch: 'release/v1.0' }],
    ['git merge hotfix/urgent_1', { kind: 'merge', source: 'hotfix/urgent_1' }],
  ])('parses %j', (input, expected) => {
    expect(parseTerminalCommand(input)).toEqual(expected)
  })

  it.each(['git commit -m no-quotes', 'git commit -m "mixed\'', 'git checkout bad name', 'git merge', 'rm -rf /'])(
    'treats %j as unknown instead of guessing',
    (input) => {
      expect(parseTerminalCommand(input)).toEqual({ kind: 'unknown', input })
    }
  )

  it('documents every supported command in `help`', () => {
    const help = HELP_LINES.join('\n')
    for (const cmd of ['git status', 'git log', 'git branch', 'git commit', 'git checkout -b', 'git switch -c', 'git merge', 'run pipeline', 'clear']) {
      expect(help).toContain(cmd)
    }
  })
})
