import { describe, it, expect } from 'vitest'
import { HELP_LINES, parseTerminalCommand } from '../utils/terminalCommands'

describe('parseTerminalCommand', () => {
  it.each([
    ['help', { kind: 'help' }],
    ['  HELP  ', { kind: 'help' }],
    ['clear', { kind: 'clear' }],
    ['run pipeline', { kind: 'run-pipeline' }],
    ['ci', { kind: 'run-pipeline' }],
    ['deploy', { kind: 'run-pipeline' }],
    ['git status', { kind: 'status' }],
  ])('parses %j', (input, expected) => {
    expect(parseTerminalCommand(input)).toEqual(expected)
  })

  it('parses commits with double or single quotes', () => {
    expect(parseTerminalCommand('git commit -m "feat: login"')).toEqual({ kind: 'commit', message: 'feat: login' })
    expect(parseTerminalCommand("git commit -m 'fix: typo'")).toEqual({ kind: 'commit', message: 'fix: typo' })
  })

  it('parses branch creation before plain checkout', () => {
    expect(parseTerminalCommand('git checkout -b feature/x')).toEqual({ kind: 'create-branch', branch: 'feature/x' })
    expect(parseTerminalCommand('git checkout main')).toEqual({ kind: 'checkout', branch: 'main' })
  })

  it('parses merges', () => {
    expect(parseTerminalCommand('git merge hotfix/urgent_1')).toEqual({ kind: 'merge', source: 'hotfix/urgent_1' })
  })

  it.each([
    'git commit -m feat-without-quotes',
    'git checkout bad branch name',
    'git merge',
    'ls -la',
    '',
  ])('treats %j as unknown', (input) => {
    expect(parseTerminalCommand(input)).toEqual({ kind: 'unknown', input })
  })

  it('documents every command in the help text', () => {
    const help = HELP_LINES.join('\n')
    for (const cmd of ['git commit', 'git checkout -b', 'git checkout', 'git merge', 'git status', 'run pipeline', 'clear']) {
      expect(help).toContain(cmd)
    }
  })
})
