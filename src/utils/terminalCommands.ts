/**
 * Pure parser for the Interactive Lab terminal. Turning text into a typed
 * command keeps the parsing rules unit-testable and separate from React state.
 */
export type TerminalCommand =
  | { kind: 'help' }
  | { kind: 'clear' }
  | { kind: 'run-pipeline' }
  | { kind: 'status' }
  | { kind: 'log' }
  | { kind: 'list-branches' }
  | { kind: 'commit'; message: string }
  | { kind: 'create-branch'; branch: string }
  | { kind: 'checkout'; branch: string }
  | { kind: 'merge'; source: string }
  | { kind: 'unknown'; input: string }

export const HELP_LINES: readonly string[] = [
  'Available commands:',
  '  git status                     - Show the active branch and HEAD commit',
  '  git log                        - Show the history of HEAD (like --oneline)',
  '  git branch                     - List branches (* = active)',
  '  git commit -m "<message>"      - Commit to the active branch',
  '  git checkout -b <new_branch>   - Create a branch and switch to it',
  '  git switch -c <new_branch>     - Same as checkout -b',
  '  git checkout <branch>          - Switch to a branch (also: git switch)',
  '  git merge <source_branch>      - Merge a branch into the active one',
  '  run pipeline                   - Trigger the CI/CD pipeline (also: ci)',
  '  clear                          - Clear the terminal output',
]

const BRANCH = '([a-zA-Z0-9_\\-/.]+)'
const COMMIT_RE = /^git commit -m (["'])(.+)\1$/i
const CREATE_BRANCH_RE = new RegExp(`^git (?:checkout -b|switch -c) ${BRANCH}$`, 'i')
const CHECKOUT_RE = new RegExp(`^git (?:checkout|switch) ${BRANCH}$`, 'i')
const MERGE_RE = new RegExp(`^git merge ${BRANCH}$`, 'i')

export function parseTerminalCommand(input: string): TerminalCommand {
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase().replace(/\s+/g, ' ')

  if (lower === 'help') return { kind: 'help' }
  if (lower === 'clear') return { kind: 'clear' }
  if (lower === 'run pipeline' || lower === 'ci' || lower === 'deploy') return { kind: 'run-pipeline' }
  if (lower === 'git status') return { kind: 'status' }
  if (lower === 'git log' || lower === 'git log --oneline') return { kind: 'log' }
  if (lower === 'git branch') return { kind: 'list-branches' }

  const commit = trimmed.match(COMMIT_RE)
  if (commit) return { kind: 'commit', message: commit[2] }

  const createBranch = trimmed.match(CREATE_BRANCH_RE)
  if (createBranch) return { kind: 'create-branch', branch: createBranch[1] }

  const checkout = trimmed.match(CHECKOUT_RE)
  if (checkout) return { kind: 'checkout', branch: checkout[1] }

  const merge = trimmed.match(MERGE_RE)
  if (merge) return { kind: 'merge', source: merge[1] }

  return { kind: 'unknown', input }
}
