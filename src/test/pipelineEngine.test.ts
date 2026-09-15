import { describe, it, expect } from 'vitest'
import {
  createInitialPipelineRun,
  generateStageLogs,
  shouldStageFail,
} from '../utils/pipelineEngine'

describe('pipelineEngine', () => {
  it('creates initial pipeline run with 5 stages in idle state', () => {
    const run = createInitialPipelineRun('a1b2c3d', 'feat: initial test', 'main')
    expect(run.status).toBe('idle')
    expect(run.commitHash).toBe('a1b2c3d')
    expect(run.branch).toBe('main')
    expect(run.trigger).toBe('push')
    expect(run.stages.length).toBe(5)
    expect(run.stages.every((s) => s.status === 'idle')).toBe(true)
  })

  it('sets trigger to pull_request for non-main branches', () => {
    const run = createInitialPipelineRun('a1b2c3d', 'feat: feature branch', 'feature/test')
    expect(run.trigger).toBe('pull_request')
  })

  it('correctly detects chaos failure triggers', () => {
    const cleanConfig = {
      failLint: false,
      failTests: false,
      failSecurity: false,
      failBuild: false,
    }
    expect(shouldStageFail('lint', cleanConfig)).toBe(false)
    expect(shouldStageFail('unit-tests', cleanConfig)).toBe(false)

    const failingConfig = {
      ...cleanConfig,
      failTests: true,
    }
    expect(shouldStageFail('unit-tests', failingConfig)).toBe(true)
    expect(shouldStageFail('lint', failingConfig)).toBe(false)
  })

  it('generates accurate success and failure logs with emojis and exit codes', () => {
    const successLogs = generateStageLogs('unit-tests', true, 'main', '7a12b4e')
    expect(successLogs.some((l) => l.includes('100% green'))).toBe(true)

    const failLogs = generateStageLogs('unit-tests', false, 'main', '7a12b4e')
    expect(failLogs.some((l) => l.includes('AssertionError'))).toBe(true)
    expect(failLogs.some((l) => l.includes('exit code 1'))).toBe(true)
  })

  it('includes production branchlab.me domain in deploy logs on main branch', () => {
    const deployLogs = generateStageLogs('deploy', true, 'main', '7a12b4e')
    expect(deployLogs.some((l) => l.includes('https://branchlab.me'))).toBe(true)
  })
})
