import type { PipelineFailureConfig, PipelineRun, PipelineStage } from '../types/pipeline'

/**
 * The simulated pipeline mirrors BranchLab's own GitHub Actions workflow
 * (.github/workflows/ci.yml): lint & typecheck → tests → security scans →
 * Docker image + E2E → deploy to Oracle Cloud (main only).
 */
export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'lint',
    name: 'Lint & Typecheck',
    description: 'oxlint (0 warnings) and the TypeScript compiler',
    status: 'idle',
    durationMs: 0,
    logs: [],
    iconName: 'FileCheck',
    requiredForDeploy: true,
  },
  {
    id: 'unit-tests',
    name: 'Unit & Integration Tests',
    description: 'Vitest + React Testing Library with a coverage gate',
    status: 'idle',
    durationMs: 0,
    logs: [],
    iconName: 'TestTube2',
    requiredForDeploy: true,
  },
  {
    id: 'security',
    name: 'Security Scan',
    description: 'npm audit and Trivy CVE scan of the image',
    status: 'idle',
    durationMs: 0,
    logs: [],
    iconName: 'ShieldCheck',
    requiredForDeploy: true,
  },
  {
    id: 'build',
    name: 'Docker Image & E2E',
    description: 'Vite build, ARM64 image, Playwright tests against it',
    status: 'idle',
    durationMs: 0,
    logs: [],
    iconName: 'PackageCheck',
    requiredForDeploy: true,
  },
  {
    id: 'deploy',
    name: 'Deploy to Oracle Cloud',
    description: 'main only: push to GHCR, SSH deploy, health check',
    status: 'idle',
    durationMs: 0,
    logs: [],
    iconName: 'CloudUpload',
    requiredForDeploy: false,
  },
]

/** Like the real workflow, only commits on main are deployed. */
export function deploysFrom(branch: string): boolean {
  return branch === 'main'
}

export function createInitialPipelineRun(
  commitHash: string,
  commitMessage: string,
  branch: string
): PipelineRun {
  return {
    id: `run-${Date.now().toString(36)}`,
    trigger: branch === 'main' ? 'push' : 'pull_request',
    commitHash,
    commitMessage,
    branch,
    status: 'idle',
    stages: DEFAULT_PIPELINE_STAGES.map((stage) => ({
      ...stage,
      status: 'idle',
      logs: [],
      durationMs: 0,
    })),
  }
}

export function generateStageLogs(
  stageId: string,
  isSuccess: boolean,
  branch: string,
  commitHash: string
): string[] {
  const timestamp = new Date().toLocaleTimeString()
  const t = (line: string) => `[${timestamp}] ${line}`

  if (stageId === 'lint') {
    if (isSuccess) {
      return [
        t(`[CI] npm run lint -- --deny-warnings && tsc -b (commit ${commitHash})`),
        t('[CI] Found 0 warnings and 0 errors.'),
        t('[SUCCESS] Lint & typecheck passed. ✨'),
      ]
    }
    return [
      t(`[CI] npm run lint -- --deny-warnings && tsc -b (commit ${commitHash})`),
      t("[ERROR] src/components/GitCanvas.tsx:42:18 - Type 'undefined' is not assignable to type 'string'."),
      t('[FAILED] Typecheck failed with exit code 1. Pipeline halted. ❌'),
    ]
  }

  if (stageId === 'unit-tests') {
    if (isSuccess) {
      return [
        t('[VITEST] npm run test:coverage (jsdom environment)'),
        t('PASS src/test/gitEngine.test.ts'),
        t('PASS src/test/AppLab.test.tsx'),
        t('PASS src/test/hooks.test.tsx'),
        t('Tests: 128 passed, 128 total | Coverage: 93% lines (threshold 88%)'),
        t('[SUCCESS] Test suite passed 100% green! ✅'),
      ]
    }
    return [
      t('[VITEST] npm run test:coverage (jsdom environment)'),
      t('FAIL src/test/gitEngine.test.ts > mergeBranches()'),
      t("AssertionError: expected branch 'main' to point to merge commit c5, but got c4"),
      t('Tests: 1 failed, 127 passed, 128 total'),
      t('[FAILED] Test suite failed with exit code 1. Deployment blocked by the CI gate! ❌'),
    ]
  }

  if (stageId === 'security') {
    if (isSuccess) {
      return [
        t('[AUDIT] npm audit --audit-level=high'),
        t('[AUDIT] found 0 vulnerabilities'),
        t('[TRIVY] Scanning image (alpine 3.24) for HIGH/CRITICAL CVEs...'),
        t('[SUCCESS] 0 vulnerabilities found. 🛡️'),
      ]
    }
    return [
      t('[AUDIT] npm audit --audit-level=high'),
      t('[TRIVY] Scanning image (alpine 3.24) for HIGH/CRITICAL CVEs...'),
      t('[ALERT] libxslt CVE-2026-9947 HIGH: installed 1.1.43-r3, fixed in 1.1.43-r4'),
      t('[FAILED] Security gate failed: patch the vulnerable package first. ❌'),
    ]
  }

  if (stageId === 'build') {
    if (isSuccess) {
      return [
        t('[VITE] npm run build → dist/ (HTML, JS, CSS)'),
        t('[DOCKER] Building ARM64 image: node builder → nginx-unprivileged runtime'),
        t('[E2E] Playwright: 15 passed (desktop + mobile) against the image'),
        t('[SUCCESS] Image built and tested. 📦'),
      ]
    }
    return [
      t('[VITE] npm run build → dist/ (HTML, JS, CSS)'),
      t('[ERROR] Could not resolve "./components/Missing" from "src/App.tsx"'),
      t('[FAILED] Build failed with exit code 1. ❌'),
    ]
  }

  if (stageId === 'deploy') {
    if (!deploysFrom(branch)) {
      return [
        t(`[CI] Deploy skipped: '${branch}' is not main. Only main is deployed to production.`),
        t('[CI] Merge this branch (via PR) into main to release it.'),
      ]
    }
    return [
      t(`[DOCKER] Pushing ghcr.io/petya122/branchlab:sha-${commitHash}`),
      t('[CLOUD] SSH to the Oracle Cloud VM → docker compose up --wait'),
      t('[CLOUD] Health check: healthy • Caddy reloaded'),
      t(`[SUCCESS] Smoke test passed: https://branchlab.tech serves ${commitHash} 🚀`),
    ]
  }

  return [t(`Completed stage ${stageId}.`)]
}

export function shouldStageFail(stageId: string, config: PipelineFailureConfig): boolean {
  if (stageId === 'lint' && config.failLint) return true
  if (stageId === 'unit-tests' && config.failTests) return true
  if (stageId === 'security' && config.failSecurity) return true
  if (stageId === 'build' && config.failBuild) return true
  return false
}
