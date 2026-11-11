import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePipelineSimulator, type PipelineTarget } from '../hooks/usePipelineSimulator'

/**
 * WHY: the simulated pipeline must behave like a real CI/CD system, because
 * that is what the app teaches: stages run in order, the first failure stops
 * everything after it (fail fast), only main is deployed, and one click starts
 * exactly one run.
 */
afterEach(() => vi.useRealTimers())

function setup(target: PipelineTarget) {
  const deps = { log: vi.fn(), triggerTrophy: vi.fn(), onPassed: vi.fn(), animationSpeed: 'fast' as const }
  const hook = renderHook(() => usePipelineSimulator(target, deps))
  const run = async () => {
    await act(async () => {
      const running = hook.result.current.runPipeline(target)
      await vi.runAllTimersAsync()
      await running
    })
  }
  const stageStatus = () => Object.fromEntries(hook.result.current.pipelineRun.stages.map((s) => [s.id, s.status]))
  return { ...hook, deps, run, stageStatus }
}

const main = { commitHash: 'abc1234', commitMessage: 'feat: x', branch: 'main' }
const feature = { commitHash: 'def5678', commitMessage: 'feat: y', branch: 'feature/y' }

describe('pipeline run', () => {
  it('on main every stage passes, including the deploy, and the run is recorded for that commit', async () => {
    vi.useFakeTimers()
    const { result, run, stageStatus, deps } = setup(main)
    await run()
    expect(Object.values(stageStatus()).every((s) => s === 'success')).toBe(true)
    expect(result.current.statusFor('abc1234')).toBe('passed')
    expect(result.current.statusFor('0000000')).toBe('idle') // other commits are not green
    expect(deps.onPassed).toHaveBeenCalledTimes(1)
  })

  it('stops at the first failing stage; later stages never run and nothing is deployed', async () => {
    vi.useFakeTimers()
    const { result, run, stageStatus } = setup(main)
    act(() => result.current.toggleChaos('failSecurity'))
    await run()
    expect(stageStatus()).toEqual({
      lint: 'success',
      'unit-tests': 'success',
      security: 'failed',
      build: 'idle',
      deploy: 'idle',
    })
    expect(result.current.statusFor('abc1234')).toBe('failed')
  })

  it('a feature branch passes all checks but skips the deploy, like the real workflow', async () => {
    vi.useFakeTimers()
    const { result, run, stageStatus } = setup(feature)
    await run()
    expect(stageStatus().deploy).toBe('skipped')
    expect(result.current.pipelineRun.status).toBe('passed')
  })

  it('a double click starts only one run', async () => {
    vi.useFakeTimers()
    const { result, deps } = setup(main)
    await act(async () => {
      const first = result.current.runPipeline(main)
      const second = result.current.runPipeline(main)
      await vi.runAllTimersAsync()
      await Promise.all([first, second])
    })
    const triggered = deps.log.mock.calls.filter(([line]) => String(line).includes('[CI/CD TRIGGERED]'))
    expect(triggered).toHaveLength(1)
  })
})
