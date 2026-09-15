import { describe, it, expect } from 'vitest'
import {
  getInitialGitState,
  commitToActiveBranch,
  createBranch,
  checkoutBranch,
  mergeBranches,
} from '../utils/gitEngine'

describe('gitEngine', () => {
  it('initializes GitFlow state with main, develop, and feature branches', () => {
    const state = getInitialGitState('gitflow')
    expect(state.model).toBe('gitflow')
    expect(state.commits.length).toBeGreaterThanOrEqual(3)
    expect(state.branches['main']).toBeDefined()
    expect(state.branches['develop']).toBeDefined()
    expect(state.branches['feature/auth']).toBeDefined()
    expect(state.activeBranch).toBe('feature/auth')
  })

  it('initializes Trunk-Based state with main and short-lived feature branch', () => {
    const state = getInitialGitState('trunk-based')
    expect(state.model).toBe('trunk-based')
    expect(state.branches['main']).toBeDefined()
    expect(state.branches['feature/fast-patch']).toBeDefined()
  })

  it('adds a new commit and updates the active branch targetCommitId', () => {
    const state = getInitialGitState('gitflow')
    const initialCommitCount = state.commits.length
    const { nextState, newCommit } = commitToActiveBranch(state, 'feat: test commit')

    expect(nextState.commits.length).toBe(initialCommitCount + 1)
    expect(newCommit.message).toBe('feat: test commit')
    expect(newCommit.branch).toBe('feature/auth')
    expect(nextState.branches['feature/auth'].targetCommitId).toBe(newCommit.id)
    expect(nextState.headCommitId).toBe(newCommit.id)
  })

  it('creates a new branch off the active branch', () => {
    const state = getInitialGitState('gitflow')
    const nextState = createBranch(state, 'feature/settings')

    expect(nextState.branches['feature/settings']).toBeDefined()
    expect(nextState.activeBranch).toBe('feature/settings')
    expect(nextState.branches['feature/settings'].targetCommitId).toBe(
      state.branches['feature/auth'].targetCommitId
    )
  })

  it('throws error if branch already exists', () => {
    const state = getInitialGitState('gitflow')
    expect(() => createBranch(state, 'main')).toThrow()
  })

  it('checks out an existing branch', () => {
    const state = getInitialGitState('gitflow')
    const nextState = checkoutBranch(state, 'main')
    expect(nextState.activeBranch).toBe('main')
    expect(nextState.headCommitId).toBe(state.branches['main'].targetCommitId)
  })

  it('merges source branch into target branch with 2 parents', () => {
    const state = getInitialGitState('gitflow')
    const { nextState, mergeCommit } = mergeBranches(state, 'feature/auth', 'develop')

    expect(mergeCommit.isMerge).toBe(true)
    expect(mergeCommit.parents.length).toBe(2)
    expect(mergeCommit.branch).toBe('develop')
    expect(nextState.activeBranch).toBe('develop')
    expect(nextState.branches['develop'].targetCommitId).toBe(mergeCommit.id)
  })
})
