import type { BranchingModel } from '../types/git'
import type { PipelineFailureConfig } from '../types/pipeline'

export interface Scenario {
  id: string
  title: string
  badge: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  description: string
  objective: string
  initialModel: BranchingModel
  hint: string
  /** Chaos toggles switched on when the challenge loads (the "broken" starting point). */
  chaos?: Partial<PipelineFailureConfig>
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'gitflow-hotfix',
    title: 'Hotfix Deployment Emergency',
    badge: 'Production Incident',
    difficulty: 'Intermediate',
    description:
      'A critical vulnerability was discovered in production on branchlab.tech. Branch off main, commit a fix, get the pipeline green and merge it back into the protected main branch.',
    objective: 'Create hotfix/patch from main, commit a fix, run the pipeline, then merge it into main.',
    initialModel: 'gitflow',
    hint: 'Use [Branch] from main, make a commit, run the pipeline (main is protected: it only accepts green commits), then click [Merge] into main.',
  },
  {
    id: 'ci-guardkeeper',
    title: 'Defend the Quality Gate',
    badge: 'CI/CD Failure',
    difficulty: 'Beginner',
    description:
      'A teammate pushed a failing test, so the pipeline is red and nothing can be deployed. Run it to see where it stops, fix the test, and get it green again.',
    objective: 'Run the pipeline, switch "Tests Fail" back to passing in the Chaos controls, and rerun it until it is green.',
    initialModel: 'trunk-based',
    hint: 'The Chaos Injection Controls under the pipeline show the injected failure. Click "Tests Fail" to fix it, then Run Pipeline again.',
    chaos: { failTests: true },
  },
  {
    id: 'feature-release',
    title: 'Ship a New Feature',
    badge: 'Release Flow',
    difficulty: 'Beginner',
    description:
      'Develop a new feature on feature/auth, commit your changes, make sure CI passes, and integrate it into develop.',
    objective: 'Add 2 commits on feature/auth, run the pipeline and merge into develop.',
    initialModel: 'gitflow',
    hint: 'Stay on feature/auth, click [Commit] twice, run the pipeline, then [PR] or [Merge] into develop.',
  },
  {
    id: 'github-flow-pr',
    title: 'Merge Through a Pull Request',
    badge: 'GitHub Flow',
    difficulty: 'Beginner',
    description:
      'In GitHub Flow, main is always deployable and every change arrives through a pull request with green checks, exactly how BranchLab itself is developed.',
    objective: 'Run the pipeline on feature/status-page, open a PR and squash-merge it into main.',
    initialModel: 'github-flow',
    hint: 'Click Run Pipeline first. The PR stays blocked until the checks on the branch’s latest commit are green.',
  },
]

/** The first challenge that fits the branching model the lab starts with. */
export function firstScenarioIndexFor(model: BranchingModel): number {
  const index = SCENARIOS.findIndex((s) => s.initialModel === model)
  return index === -1 ? 0 : index
}
