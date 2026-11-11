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
    description: 'Turn a failing (red) CI/CD pipeline green again.',
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
    description: 'Switch to Trunk-Based Development, where everyone integrates into main in small steps.',
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
  /** XP earned inside the current level */
  currentXp: number
  /** XP the current level spans (0 at the top level) */
  nextLevelXp: number
  /** XP still missing to reach the next level (0 at the top level) */
  xpToNextLevel: number
  progressPct: number
  isMaxLevel: boolean
}

const LEVELS = [
  { level: 1, rank: 'Junior DevOps Apprentice', from: 0 },
  { level: 2, rank: 'CI/CD Pipeline Engineer', from: 100 },
  { level: 3, rank: 'GitFlow Strategist', from: 200 },
  // Reached with every trophy: 50 + 100 + 75 + 50 + 50 = 325 XP
  { level: 4, rank: 'Principal SRE Architect', from: 325 },
]

export function calculateDevOpsLevel(xp: number): LevelInfo {
  const index = LEVELS.findLastIndex((l) => xp >= l.from)
  const current = LEVELS[Math.max(index, 0)]
  const next = LEVELS[index + 1]
  if (!next) {
    return {
      level: current.level,
      rank: current.rank,
      currentXp: xp - current.from,
      nextLevelXp: 0,
      xpToNextLevel: 0,
      progressPct: 100,
      isMaxLevel: true,
    }
  }
  const span = next.from - current.from
  const inLevel = xp - current.from
  return {
    level: current.level,
    rank: current.rank,
    currentXp: inLevel,
    nextLevelXp: span,
    xpToNextLevel: span - inLevel,
    progressPct: Math.min(100, (inLevel / span) * 100),
    isMaxLevel: false,
  }
}
