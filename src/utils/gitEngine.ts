import type { Branch, BranchingModel, Commit, GitGraphState } from '../types/git'

export const BRANCH_COLORS: Record<string, string> = {
  main: '#10b981', // Emerald
  master: '#10b981',
  develop: '#06b6d4', // Cyan
  'feature/auth': '#a855f7', // Violet
  'feature/dashboard': '#8b5cf6',
  'release/v1.0': '#f43f5e', // Rose
  'hotfix/critical-patch': '#f59e0b', // Amber
}

export function getBranchColor(branchName: string): string {
  if (BRANCH_COLORS[branchName]) return BRANCH_COLORS[branchName]
  if (branchName.startsWith('feature/')) return '#a855f7'
  if (branchName.startsWith('hotfix/')) return '#f59e0b'
  if (branchName.startsWith('release/')) return '#f43f5e'
  if (branchName.startsWith('bugfix/')) return '#ec4899'
  return '#38bdf8'
}

export function generateShortHash(): string {
  return Math.random().toString(16).substring(2, 9)
}

export function getInitialGitState(model: BranchingModel): GitGraphState {
  if (model === 'gitflow') {
    const c1: Commit = {
      id: 'c1',
      hash: '7a12b4e',
      message: 'chore: initial project setup with vite & react',
      parents: [],
      branch: 'main',
      timestamp: Date.now() - 3600000 * 5,
      author: 'DevOps Student',
      tag: 'v0.1.0',
    }
    const c2: Commit = {
      id: 'c2',
      hash: '3f90c1a',
      message: 'ci: configure github actions workflow & vitest',
      parents: ['c1'],
      branch: 'develop',
      timestamp: Date.now() - 3600000 * 4,
      author: 'DevOps Student',
    }
    const c3: Commit = {
      id: 'c3',
      hash: '5d88e2b',
      message: 'feat(auth): implement student sso oauth flow',
      parents: ['c2'],
      branch: 'feature/auth',
      timestamp: Date.now() - 3600000 * 2,
      author: 'Frontend Dev',
    }

    const branches: Record<string, Branch> = {
      main: {
        name: 'main',
        targetCommitId: 'c1',
        color: '#10b981',
        isProtected: true,
        isDefault: true,
        description: 'Production releases (branchlab.tech)',
      },
      develop: {
        name: 'develop',
        targetCommitId: 'c2',
        color: '#06b6d4',
        description: 'Integration branch for feature development',
      },
      'feature/auth': {
        name: 'feature/auth',
        targetCommitId: 'c3',
        color: '#a855f7',
        description: 'User authentication & token management',
      },
    }

    return {
      commits: [c1, c2, c3],
      branches,
      activeBranch: 'feature/auth',
      headCommitId: 'c3',
      model,
    }
  }

  if (model === 'trunk-based') {
    const c1: Commit = {
      id: 'c1',
      hash: '9e11a2f',
      message: 'chore: scaffold trunk-based repo',
      parents: [],
      branch: 'main',
      timestamp: Date.now() - 3600000 * 3,
      author: 'DevOps Student',
    }
    const c2: Commit = {
      id: 'c2',
      hash: '4b77d1c',
      message: 'feat: add health check endpoint',
      parents: ['c1'],
      branch: 'main',
      timestamp: Date.now() - 3600000 * 2,
      author: 'DevOps Student',
    }
    const c3: Commit = {
      id: 'c3',
      hash: '2c55e9a',
      message: 'feat: quick experiment branch',
      parents: ['c2'],
      branch: 'feature/fast-patch',
      timestamp: Date.now() - 3600000,
      author: 'DevOps Student',
    }

    return {
      commits: [c1, c2, c3],
      branches: {
        main: {
          name: 'main',
          targetCommitId: 'c2',
          color: '#10b981',
          isProtected: true,
          isDefault: true,
          description: 'Single source of truth (Trunk)',
        },
        'feature/fast-patch': {
          name: 'feature/fast-patch',
          targetCommitId: 'c3',
          color: '#a855f7',
          description: 'Short-lived branch (<24h lifecycle)',
        },
      },
      activeBranch: 'main',
      headCommitId: 'c2',
      model,
    }
  }

  // GitHub Flow
  const c1: Commit = {
    id: 'c1',
    hash: '1a2b3c4',
    message: 'Initial production deploy on Oracle Cloud (Docker)',
    parents: [],
    branch: 'main',
    timestamp: Date.now() - 3600000 * 4,
    author: 'Admin',
    tag: 'v1.0.0',
  }
  const c2: Commit = {
    id: 'c2',
    hash: '5e6f7a8',
    message: 'feat: add status check dashboard',
    parents: ['c1'],
    branch: 'feature/status-page',
    timestamp: Date.now() - 3600000,
    author: 'Developer',
  }

  return {
    commits: [c1, c2],
    branches: {
      main: {
        name: 'main',
        targetCommitId: 'c1',
        color: '#10b981',
        isProtected: true,
        isDefault: true,
        description: 'Deployable production branch',
      },
      'feature/status-page': {
        name: 'feature/status-page',
        targetCommitId: 'c2',
        color: '#a855f7',
        description: 'Feature pull request branch',
      },
    },
    activeBranch: 'feature/status-page',
    headCommitId: 'c2',
    model,
  }
}

export function commitToActiveBranch(
  state: GitGraphState,
  message: string
): { nextState: GitGraphState; newCommit: Commit } {
  const activeBranchName = state.activeBranch
  const activeBranch = state.branches[activeBranchName]
  const newCommitId = `c${state.commits.length + 1}`
  const newCommit: Commit = {
    id: newCommitId,
    hash: generateShortHash(),
    message: message || `feat: update on ${activeBranchName}`,
    parents: activeBranch ? [activeBranch.targetCommitId] : [state.headCommitId],
    branch: activeBranchName,
    timestamp: Date.now(),
    author: 'You (Developer)',
  }

  const nextBranches = {
    ...state.branches,
    [activeBranchName]: {
      ...(activeBranch || {
        name: activeBranchName,
        color: getBranchColor(activeBranchName),
      }),
      targetCommitId: newCommitId,
    },
  }

  return {
    nextState: {
      ...state,
      commits: [...state.commits, newCommit],
      branches: nextBranches,
      headCommitId: newCommitId,
    },
    newCommit,
  }
}

/**
 * A simplified `git check-ref-format`: returns why a branch name is invalid,
 * or null if it is fine. Real Git rejects the same cases (spaces, "..",
 * a leading "-", a trailing "/" or ".", "//", ".lock" at the end, ...).
 */
export function validateBranchName(name: string): string | null {
  if (!name) return 'Branch name is empty.'
  if (/\s/.test(name)) return 'Branch names cannot contain spaces.'
  if (!/^[A-Za-z0-9._/-]+$/.test(name)) return 'Use only letters, digits and . _ - /'
  if (name.startsWith('-') || name.startsWith('/') || name.startsWith('.')) return "Branch names cannot start with '-', '/' or '.'."
  if (name.endsWith('/') || name.endsWith('.') || name.endsWith('.lock')) return "Branch names cannot end with '/', '.' or '.lock'."
  if (name.includes('..') || name.includes('//') || name.includes('/.')) return "Branch names cannot contain '..', '//' or '/.'."
  if (name.toUpperCase() === 'HEAD') return "'HEAD' is reserved."
  return null
}

export function createBranch(
  state: GitGraphState,
  newBranchName: string,
  fromBranchName?: string
): GitGraphState {
  const invalid = validateBranchName(newBranchName)
  if (invalid) {
    throw new Error(`'${newBranchName}' is not a valid branch name: ${invalid}`)
  }
  if (state.branches[newBranchName]) {
    throw new Error(`Branch '${newBranchName}' already exists.`)
  }

  const sourceBranchName = fromBranchName || state.activeBranch
  const sourceBranch = state.branches[sourceBranchName]
  const targetCommitId = sourceBranch ? sourceBranch.targetCommitId : state.headCommitId

  const newBranch: Branch = {
    name: newBranchName,
    targetCommitId,
    color: getBranchColor(newBranchName),
    description: `Created from ${sourceBranchName}`,
  }

  return {
    ...state,
    branches: {
      ...state.branches,
      [newBranchName]: newBranch,
    },
    activeBranch: newBranchName,
    // `git checkout -b new base` moves HEAD to the base commit
    headCommitId: targetCommitId,
  }
}

/** True if `ancestorId` is reachable from `descendantId` by following parents (or is the same commit). */
export function isAncestor(state: GitGraphState, ancestorId: string, descendantId: string): boolean {
  const byId = new Map(state.commits.map((c) => [c.id, c]))
  const stack = [descendantId]
  const seen = new Set<string>()
  while (stack.length > 0) {
    const id = stack.pop()!
    if (id === ancestorId) return true
    if (seen.has(id)) continue
    seen.add(id)
    stack.push(...(byId.get(id)?.parents ?? []))
  }
  return false
}

/** Checks shared by every kind of merge; throws with a git-like message. */
function assertMergeable(state: GitGraphState, sourceBranchName: string, targetBranchName: string) {
  const source = state.branches[sourceBranchName]
  const target = state.branches[targetBranchName]
  if (!source || !target) {
    throw new Error('Both source and target branches must exist to merge.')
  }
  if (sourceBranchName === targetBranchName) {
    throw new Error(`Cannot merge '${sourceBranchName}' into itself.`)
  }
  if (isAncestor(state, source.targetCommitId, target.targetCommitId)) {
    throw new Error(`Already up to date: '${targetBranchName}' already contains '${sourceBranchName}'.`)
  }
  return { source, target }
}

export function checkoutBranch(state: GitGraphState, branchName: string): GitGraphState {
  const branch = state.branches[branchName]
  if (!branch) {
    throw new Error(`Branch '${branchName}' does not exist.`)
  }
  return {
    ...state,
    activeBranch: branchName,
    headCommitId: branch.targetCommitId,
  }
}

/**
 * `git merge --no-ff`: always records a merge commit with two parents (the
 * GitFlow convention), so the merge stays visible in the graph.
 */
export function mergeBranches(
  state: GitGraphState,
  sourceBranchName: string,
  targetBranchName: string
): { nextState: GitGraphState; mergeCommit: Commit } {
  const { source, target } = assertMergeable(state, sourceBranchName, targetBranchName)

  const newCommitId = `c${state.commits.length + 1}`
  const mergeCommit: Commit = {
    id: newCommitId,
    hash: generateShortHash(),
    message: `Merge branch '${sourceBranchName}' into ${targetBranchName}`,
    parents: [target.targetCommitId, source.targetCommitId],
    branch: targetBranchName,
    timestamp: Date.now(),
    author: 'Git Merger',
    isMerge: true,
  }

  return {
    nextState: {
      ...state,
      commits: [...state.commits, mergeCommit],
      branches: {
        ...state.branches,
        [targetBranchName]: {
          ...target,
          targetCommitId: newCommitId,
        },
      },
      headCommitId: newCommitId,
      activeBranch: targetBranchName,
    },
    mergeCommit,
  }
}

/**
 * GitHub "Squash and merge": all changes of the source branch become ONE new
 * commit on the target with a single parent. The source branch is not an
 * ancestor of the result, exactly like on GitHub.
 */
export function squashMerge(
  state: GitGraphState,
  sourceBranchName: string,
  targetBranchName: string,
  message: string
): { nextState: GitGraphState; squashCommit: Commit } {
  const { target } = assertMergeable(state, sourceBranchName, targetBranchName)

  const newCommitId = `c${state.commits.length + 1}`
  const squashCommit: Commit = {
    id: newCommitId,
    hash: generateShortHash(),
    message,
    parents: [target.targetCommitId],
    branch: targetBranchName,
    timestamp: Date.now(),
    author: 'You (via Pull Request)',
  }

  return {
    nextState: {
      ...state,
      commits: [...state.commits, squashCommit],
      branches: {
        ...state.branches,
        [targetBranchName]: { ...target, targetCommitId: newCommitId },
      },
      headCommitId: newCommitId,
      activeBranch: targetBranchName,
    },
    squashCommit,
  }
}

/**
 * `git log --oneline` from HEAD: follows first parents (the branch's own
 * line of history), newest first, with branch and tag decorations.
 */
export function onelineLog(state: GitGraphState, limit = 10): string[] {
  const byId = new Map(state.commits.map((c) => [c.id, c]))
  const lines: string[] = []
  let current = byId.get(state.headCommitId)
  while (current && lines.length < limit) {
    const commit: Commit = current
    const refs = Object.values(state.branches)
      .filter((b) => b.targetCommitId === commit.id)
      .map((b) => (b.name === state.activeBranch ? `HEAD -> ${b.name}` : b.name))
    if (commit.tag) refs.push(`tag: ${commit.tag}`)
    lines.push(`${commit.hash}${refs.length ? ` (${refs.join(', ')})` : ''} ${commit.message}`)
    current = byId.get(commit.parents[0])
  }
  return lines
}

/**
 * Where a branch is integrated: GitFlow feature branches go to develop,
 * everything else to the default branch (main).
 */
export function integrationTarget(state: GitGraphState): string {
  if (state.model === 'gitflow' && state.activeBranch.startsWith('feature/') && state.branches['develop']) {
    return 'develop'
  }
  return Object.values(state.branches).find((b) => b.isDefault)?.name ?? 'main'
}
