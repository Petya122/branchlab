/**
 * Pure parser for the Interactive Lab terminal. Turning text into a typed
 * command keeps the parsing rules unit-testable and separate from React state.
 */
export type TerminalCommand =
  | { kind: 'help' }
  | { kind: 'clear' }
  | { kind: 'run-pipeline' }
  | { kind: 'status' }
  | { kind: 'commit'; message: string }
  | { kind: 'create-branch'; branch: string }
  | { kind: 'checkout'; branch: string }
  | { kind: 'merge'; source: string }
  | { kind: 'unknown'; input: string }

export const HELP_LINES: readonly string[] = [
  'Available commands:',
  '  git commit -m "<message>"      - Commit changes to current branch',
  '  git checkout -b <new_branch>  - Create and switch to new branch',
  '  git checkout <branch>          - Switch active branch',
  '  git merge <source_branch>      - Merge source branch into active',
  '  git status                     - Show active branch and status',
  '  run pipeline                   - Trigger CI/CD runner',
  '  clear                          - Clear terminal output',
]

const BRANCH = '([a-zA-Z0-9_\\-/]+)'
const COMMIT_RE = /^git commit -m ["'](.+)["']$/i
const CREATE_BRANCH_RE = new RegExp(`^git checkout -b ${BRANCH}$`, 'i')
const CHECKOUT_RE = new RegExp(`^git checkout ${BRANCH}$`, 'i')
const MERGE_RE = new RegExp(`^git merge ${BRANCH}$`, 'i')

export function parseTerminalCommand(input: string): TerminalCommand {
  const lower = input.trim().toLowerCase()

  if (lower === 'help') return { kind: 'help' }
  if (lower === 'clear') return { kind: 'clear' }
  if (lower === 'run pipeline' || lower === 'ci' || lower === 'deploy') return { kind: 'run-pipeline' }
  if (lower === 'git status') return { kind: 'status' }

  const commit = input.match(COMMIT_RE)
  if (commit) return { kind: 'commit', message: commit[1] }

  const createBranch = input.match(CREATE_BRANCH_RE)
  if (createBranch) return { kind: 'create-branch', branch: createBranch[1] }

  const checkout = input.match(CHECKOUT_RE)
  if (checkout) return { kind: 'checkout', branch: checkout[1] }

  const merge = input.match(MERGE_RE)
  if (merge) return { kind: 'merge', source: merge[1] }

  return { kind: 'unknown', input }
}
