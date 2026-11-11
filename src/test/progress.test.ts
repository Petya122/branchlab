import { describe, it, expect, beforeEach } from 'vitest'
import { awardTrophy, calculateDevOpsLevel, INITIAL_TROPHIES, loadTrophyState, saveTrophyState } from '../utils/trophies'

/**
 * WHY: XP and trophies are the student's progress. It must never be counted
 * twice, must survive a reload, and a corrupted value in localStorage must not
 * crash the app. Level boundaries are classic off-by-one territory.
 */
beforeEach(() => localStorage.clear())

describe('levels', () => {
  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [199, 2],
    [200, 3],
    [324, 3],
    [325, 4],
  ])('%i XP is level %i', (xp, level) => {
    expect(calculateDevOpsLevel(xp).level).toBe(level)
  })

  it('reports the XP still missing to the next level', () => {
    expect(calculateDevOpsLevel(50)).toMatchObject({ currentXp: 50, nextLevelXp: 100, xpToNextLevel: 50 })
  })

  it('unlocking every trophy reaches exactly the top level, which promises no further level', () => {
    const total = INITIAL_TROPHIES.reduce((sum, t) => sum + t.xp, 0)
    expect(calculateDevOpsLevel(total)).toMatchObject({ level: 4, isMaxLevel: true, xpToNextLevel: 0 })
  })
})

describe('trophies', () => {
  it('a trophy gives its XP only once', () => {
    const first = awardTrophy('conflict-master', { xp: 0, unlockedIds: [], unlockedDates: {} })
    const second = awardTrophy('conflict-master', first.nextState)
    expect(first.nextState.xp).toBe(75)
    expect(second.newlyUnlocked).toBeNull()
    expect(second.nextState.xp).toBe(75)
  })

  it('progress survives a page reload (localStorage round trip)', () => {
    const { nextState } = awardTrophy('pr-champion', { xp: 0, unlockedIds: [], unlockedDates: {} })
    saveTrophyState(nextState)
    expect(loadTrophyState()).toMatchObject({ xp: 50, unlockedIds: ['pr-champion'] })
  })

  it('corrupted saved data starts from zero instead of crashing', () => {
    localStorage.setItem('branchlab_trophies_v1', '{not json')
    expect(loadTrophyState()).toEqual({ xp: 0, unlockedIds: [], unlockedDates: {} })
  })
})
