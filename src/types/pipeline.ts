export type StageStatus = 'idle' | 'running' | 'success' | 'failed' | 'skipped'

export interface PipelineStage {
  id: string
  name: string
  description: string
  status: StageStatus
  durationMs: number
  logs: string[]
  iconName: string
  requiredForDeploy: boolean
}

export interface PipelineRun {
  id: string
  trigger: 'push' | 'pull_request' | 'manual'
  commitHash: string
  commitMessage: string
  branch: string
  status: 'idle' | 'running' | 'passed' | 'failed'
  startedAt?: number
  finishedAt?: number
  stages: PipelineStage[]
}

export interface PipelineFailureConfig {
  failLint: boolean
  failTests: boolean
  failSecurity: boolean
  failBuild: boolean
}
