export interface Scenario {
  id: string
  title: string
  badge: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  description: string
  objective: string
  initialModel: 'gitflow' | 'trunk-based' | 'github-flow'
  hint: string
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'gitflow-hotfix',
    title: 'Hotfix Deployment Emergency',
    badge: 'Production Incident',
    difficulty: 'Intermediate',
    description:
      'A critical vulnerability was discovered in production on branchlab.me. You must branch off main, apply a hotfix commit, run CI/CD to verify green tests, and merge back to main.',
    objective: 'Create a branch named hotfix/patch, commit a fix, and merge it back to main.',
    initialModel: 'gitflow',
    hint: 'Use [+ New Branch] from main, then make a commit, and finally click [🔀 Merge] into main.',
  },
  {
    id: 'ci-guardkeeper',
    title: 'Defend the Quality Gate',
    badge: 'CI/CD Failure',
    difficulty: 'Beginner',
    description:
      'A teammate injected a failing test that breaks the build. Observe the red pipeline in the simulator, fix the test gate, and achieve green deployment.',
    objective: 'Toggle off the failing test in Chaos Control and rerun the CI/CD pipeline.',
    initialModel: 'trunk-based',
    hint: 'Check the Chaos Controls section under the pipeline and toggle off "Fail Tests", then trigger Run Pipeline.',
  },
  {
    id: 'feature-release',
    title: 'Ship a New Feature',
    badge: 'Release Flow',
    difficulty: 'Beginner',
    description:
      'Develop a new feature on feature/auth, commit your changes, ensure CI tests pass, and integrate into develop.',
    objective: 'Add 2 commits on feature/auth and merge into develop.',
    initialModel: 'gitflow',
    hint: 'Select feature/auth, click [+ Commit] twice, then merge into develop.',
  },
]
