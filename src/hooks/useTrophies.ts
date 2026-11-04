import { useCallback, useEffect, useRef, useState } from 'react'
import {
  awardTrophy,
  calculateDevOpsLevel,
  loadTrophyState,
  saveTrophyState,
  type Trophy,
  type TrophyState,
} from '../utils/trophies'

/**
 * Trophy / XP state persisted in localStorage.
 *
 * The latest state is mirrored in a ref so `triggerTrophy` can decide
 * synchronously whether a trophy is new and run the `onUnlock` side effect
 * exactly once (side effects inside a setState updater would run twice under
 * React StrictMode).
 */
export function useTrophies(onUnlock: (trophy: Trophy) => void) {
  const [trophyState, setTrophyState] = useState<TrophyState>(loadTrophyState)
  const stateRef = useRef(trophyState)
  const onUnlockRef = useRef(onUnlock)

  useEffect(() => {
    onUnlockRef.current = onUnlock
  }, [onUnlock])

  const triggerTrophy = useCallback((trophyId: string) => {
    const { nextState, newlyUnlocked } = awardTrophy(trophyId, stateRef.current)
    if (!newlyUnlocked) return
    stateRef.current = nextState
    setTrophyState(nextState)
    onUnlockRef.current(newlyUnlocked)
  }, [])

  const resetTrophies = useCallback(() => {
    const clean: TrophyState = { xp: 0, unlockedIds: [], unlockedDates: {} }
    stateRef.current = clean
    setTrophyState(clean)
    saveTrophyState(clean)
  }, [])

  return {
    trophyState,
    level: calculateDevOpsLevel(trophyState.xp),
    triggerTrophy,
    resetTrophies,
  }
}
