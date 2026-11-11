import { describe, it, expect } from 'vitest'
import {
  checkoutBranch,
  commitToActiveBranch,
  createBranch,
  getInitialGitState,
  integrationTarget,
  isAncestor,
  mergeBranches,
  onelineLog,
  squashMerge,
  validateBranchName,
} from '../utils/gitEngine'

/**
 * WHY: BranchLab teaches Git. If the engine gets a Git rule wrong (where a
 * branch points, what a merge looks like, when there is nothing to merge),
 * students learn the wrong thing. These are pure functions, so the tests are
 * fast and pinpoint the broken rule exactly.
 */

const gitflow = () => getInitialGitState('gitflow') // main c1 ← develop c2 ← feature/auth c3 (HEAD)

describe('commits and branches are pointers', () => {
  it('a commit moves the active branch and HEAD to the new commit, whose parent is the old tip', () => {
    const state = gitflow()
    const oldTip = state.branches['feature/auth'].targetCommitId
    const { nextState, newCommit } = commitToActiveBranch(state, 'feat: test')

    expect(newCommit.parents).toEqual([oldTip])
    expect(nextState.branches['feature/auth'].targetCommitId).toBe(newCommit.id)
    expect(nextState.headCommitId).toBe(newCommit.id)
    // other branches do not move
    expect(nextState.branches['develop']).toEqual(state.branches['develop'])
  })

  it('a new branch points at its base, and HEAD moves there too (git checkout -b new base)', () => {
    const state = gitflow()
    const next = createBranch(state, 'hotfix/x', 'main')
    expect(next.branches['hotfix/x'].targetCommitId).toBe(state.branches['main'].targetCommitId)
    expect(next.activeBranch).toBe('hotfix/x')
    expect(next.headCommitId).toBe(state.branches['main'].targetCommitId)
  })

  it('checkout moves HEAD to the branch tip', () => {
    const next = checkoutBranch(gitflow(), 'main')
    expect(next.activeBranch).toBe('main')
    expect(next.headCommitId).toBe('c1')
  })

  it.each(['main', 'my branch', 'feature/', '-x', 'a..b', 'a//b', 'x.lock', 'HEAD', 'ékezet'])(
    'refuses the branch name %j (existing or invalid in Git)',
    (name) => {
      expect(() => createBranch(gitflow(), name)).toThrow()
    }
  )

  it.each(['feature/login', 'hotfix/v1.2', 'release/2026-11', 'bugfix/a_b'])('accepts %j', (name) => {
    expect(validateBranchName(name)).toBeNull()
  })
})

describe('merging', () => {
  it('a merge commit has two parents: the target tip and the source tip', () => {
    const state = gitflow()
    const { nextState, mergeCommit } = mergeBranches(state, 'feature/auth', 'develop')
    expect(mergeCommit.parents).toEqual(['c2', 'c3'])
    expect(nextState.branches['develop'].targetCommitId).toBe(mergeCommit.id)
    expect(nextState.activeBranch).toBe('develop')
  })

  it('refuses to merge a branch into itself', () => {
    expect(() => mergeBranches(gitflow(), 'develop', 'develop')).toThrow(/into itself/)
  })

  it('reports "Already up to date" instead of creating an empty merge commit', () => {
    const { nextState } = mergeBranches(gitflow(), 'feature/auth', 'develop')
    expect(() => mergeBranches(nextState, 'feature/auth', 'develop')).toThrow(/Already up to date/)
    expect(() => mergeBranches(gitflow(), 'main', 'develop')).toThrow(/Already up to date/) // main is an ancestor
  })

  it('a squash merge is ONE commit with ONE parent; the feature branch is not in the history', () => {
    const state = getInitialGitState('github-flow')
    const { nextState, squashCommit } = squashMerge(state, 'feature/status-page', 'main', 'feat: status (#1)')
    expect(squashCommit.parents).toEqual([state.branches['main'].targetCommitId])
    expect(isAncestor(nextState, state.branches['feature/status-page'].targetCommitId, squashCommit.id)).toBe(false)
  })

  it('ancestry follows both parents of merge commits', () => {
    const { nextState, mergeCommit } = mergeBranches(gitflow(), 'feature/auth', 'develop')
    expect(isAncestor(nextState, 'c3', mergeCommit.id)).toBe(true) // via the second parent
    expect(isAncestor(nextState, 'c1', mergeCommit.id)).toBe(true)
    expect(isAncestor(nextState, mergeCommit.id, 'c1')).toBe(false)
  })
})

describe('branching models', () => {
  it('GitFlow integrates feature branches into develop; everything else (and other models) into main', () => {
    expect(integrationTarget(gitflow())).toBe('develop')
    expect(integrationTarget(createBranch(gitflow(), 'hotfix/x', 'main'))).toBe('main')
    expect(integrationTarget(getInitialGitState('github-flow'))).toBe('main') // no develop there
  })
})

describe('git log --oneline', () => {
  it('lists HEAD history newest first, following first parents, with branch and tag labels', () => {
    expect(onelineLog(gitflow())).toEqual([
      '5d88e2b (HEAD -> feature/auth) feat(auth): implement student sso oauth flow',
      '3f90c1a (develop) ci: configure github actions workflow & vitest',
      '7a12b4e (main, tag: v0.1.0) chore: initial project setup with vite & react',
    ])
  })
})
