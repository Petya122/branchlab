export type BranchingModel = 'gitflow' | 'trunk-based' | 'github-flow'

export interface Commit {
  id: string
  hash: string
  message: string
  parents: string[]
  branch: string
  timestamp: number
  author: string
  tag?: string
  isMerge?: boolean
}

export interface Branch {
  name: string
  targetCommitId: string
  color: string
  isProtected?: boolean
  isDefault?: boolean
  description?: string
}

export interface GitGraphState {
  commits: Commit[]
  branches: Record<string, Branch>
  activeBranch: string
  headCommitId: string
  model: BranchingModel
}

export type GitCommandAction =
  | { type: 'commit'; message: string }
  | { type: 'branch'; branchName: string; fromBranch?: string }
  | { type: 'checkout'; branchName: string }
  | { type: 'merge'; sourceBranch: string; targetBranch: string }
  | { type: 'rebase'; sourceBranch: string; ontoBranch: string }
  | { type: 'tag'; tagName: string; commitId?: string }
  | { type: 'reset'; commitId: string; hard?: boolean }
