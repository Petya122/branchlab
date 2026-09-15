import { describe, it, expect, beforeEach } from 'vitest'
import {
  awardTrophy,
  calculateDevOpsLevel,
  loadTrophyState,
  saveTrophyState,
  type TrophyState,
} from '../utils/trophies'

describe('trophies & leveling system', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('calculates DevOps levels and ranks correctly', () => {
    const l1 = calculateDevOpsLevel(0)
    expect(l1.level).toBe(1)
    expect(l1.rank).toBe('Junior DevOps Apprentice')

    const l2 = calculateDevOpsLevel(150)
    expect(l2.level).toBe(2)
    expect(l2.rank).toBe('CI/CD Pipeline Engineer')

    const l3 = calculateDevOpsLevel(250)
    expect(l3.level).toBe(3)
    expect(l3.rank).toBe('GitFlow Strategist')

    const l4 = calculateDevOpsLevel(500)
    expect(l4.level).toBe(4)
    expect(l4.rank).toBe('Principal SRE Architect')
  })

  it('awards a new trophy, increases XP, and prevents duplicate awards', () => {
    const initialState: TrophyState = { xp: 0, unlockedIds: [], unlockedDates: {} }

    const { nextState, newlyUnlocked } = awardTrophy('conflict-master', initialState)
    expect(newlyUnlocked).not.toBeNull()
    expect(newlyUnlocked?.id).toBe('conflict-master')
    expect(nextState.xp).toBe(75)
    expect(nextState.unlockedIds).toContain('conflict-master')

    // Attempting to award again should be a no-op
    const secondTry = awardTrophy('conflict-master', nextState)
    expect(secondTry.newlyUnlocked).toBeNull()
    expect(secondTry.nextState.xp).toBe(75)
  })

  it('saves and loads trophy state from localStorage', () => {
    const testState: TrophyState = {
      xp: 125,
      unlockedIds: ['quality-gatekeeper', 'pr-champion'],
      unlockedDates: { 'quality-gatekeeper': 123456789 },
    }
    saveTrophyState(testState)

    const loaded = loadTrophyState()
    expect(loaded.xp).toBe(125)
    expect(loaded.unlockedIds).toEqual(['quality-gatekeeper', 'pr-champion'])
  })
})
