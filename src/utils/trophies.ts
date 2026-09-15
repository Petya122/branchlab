export interface Trophy {
  id: string
  title: string
  badge: string
  description: string
  xp: number
  icon: string
  unlockedAt?: number
}

export interface TrophyState {
  xp: number
  unlockedIds: string[]
  unlockedDates: Record<string, number>
}

export const INITIAL_TROPHIES: Trophy[] = [
  {
    id: 'quality-gatekeeper',
    title: 'Quality Gatekeeper',
    badge: 'CI Defender',
    description: 'Diagnose a failing CI/CD pipeline and achieve 100% green tests.',
    xp: 50,
    icon: 'ShieldCheck',
  },
  {
    id: 'hotfix-firefighter',
    title: 'Production Firefighter',
    badge: 'SRE Hero',
    description: 'Deploy an urgent hotfix patch safely to the main production branch.',
    xp: 100,
    icon: 'Flame',
  },
  {
    id: 'conflict-master',
    title: 'Conflict Master',
    badge: 'Git Wizard',
    description: 'Successfully resolve a 3-way Git merge conflict using diff markers.',
    xp: 75,
    icon: 'GitMerge',
  },
  {
    id: 'pr-champion',
    title: 'PR Champion',
    badge: 'Code Reviewer',
    description: 'Pass all CI branch protection gates and merge code via Pull Request.',
    xp: 50,
    icon: 'GitPullRequest',
  },
  {
    id: 'trunk-pioneer',
    title: 'Trunk Pioneer',
    badge: 'Fast Delivery',
    description: 'Switch to Trunk-Based development and integrate short-lived branches.',
    xp: 50,
    icon: 'Zap',
  },
]

const STORAGE_KEY = 'branchlab_trophies_v1'

export function loadTrophyState(): TrophyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
        unlockedIds: Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds : [],
        unlockedDates: parsed.unlockedDates || {},
      }
    }
  } catch {
    // Fallback if storage access is blocked
  }
  return { xp: 0, unlockedIds: [], unlockedDates: {} }
}

export function saveTrophyState(state: TrophyState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage quota errors
  }
}

export function awardTrophy(
  trophyId: string,
  state: TrophyState
): { nextState: TrophyState; newlyUnlocked: Trophy | null } {
  if (state.unlockedIds.includes(trophyId)) {
    return { nextState: state, newlyUnlocked: null }
  }

  const trophy = INITIAL_TROPHIES.find((t) => t.id === trophyId)
  if (!trophy) {
    return { nextState: state, newlyUnlocked: null }
  }

  const nextState: TrophyState = {
    xp: state.xp + trophy.xp,
    unlockedIds: [...state.unlockedIds, trophyId],
    unlockedDates: {
      ...state.unlockedDates,
      [trophyId]: Date.now(),
    },
  }

  saveTrophyState(nextState)
  return { nextState, newlyUnlocked: trophy }
}

export interface LevelInfo {
  level: number
  rank: string
  currentXp: number
  nextLevelXp: number
  progressPct: number
}

export function calculateDevOpsLevel(xp: number): LevelInfo {
  if (xp < 100) {
    return {
      level: 1,
      rank: 'Junior DevOps Apprentice',
      currentXp: xp,
      nextLevelXp: 100,
      progressPct: Math.min(100, (xp / 100) * 100),
    }
  }
  if (xp < 200) {
    return {
      level: 2,
      rank: 'CI/CD Pipeline Engineer',
      currentXp: xp - 100,
      nextLevelXp: 100,
      progressPct: Math.min(100, ((xp - 100) / 100) * 100),
    }
  }
  if (xp < 325) {
    return {
      level: 3,
      rank: 'GitFlow Strategist',
      currentXp: xp - 200,
      nextLevelXp: 125,
      progressPct: Math.min(100, ((xp - 200) / 125) * 100),
    }
  }
  return {
    level: 4,
    rank: 'Principal SRE Architect',
    currentXp: xp - 325,
    nextLevelXp: 150,
    progressPct: 100,
  }
}
