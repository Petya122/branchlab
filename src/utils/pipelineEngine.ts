import type { PipelineFailureConfig, PipelineRun, PipelineStage } from '../types/pipeline'

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'lint',
    name: 'Lint & Code Style',
    description: 'Runs oxlint & TypeScript compiler check',
    status: 'idle',
    durationMs: 0,
    logs: [],
    iconName: 'FileCheck',
    requiredForDeploy: true,
  },
  {
    id: 'unit-tests',
    name: 'Unit & Integration Tests',
    description: 'Executes Vitest automated test suite',
    status: 'idle',
    durationMs: 0,
    logs: [],
    iconName: 'TestTube2',
    requiredForDeploy: true,
  },
  {
    id: 'security',
    name: 'SAST & Dependency Audit',
    description: 'Scans for CVEs & insecure dependencies',
    status: 'idle',
    durationMs: 0,
    logs: [],
    iconName: 'ShieldCheck',
    requiredForDeploy: true,
  },
  {
    id: 'build',
    name: 'Production Bundle (Vite)',
    description: 'Compiles minified assets & chunk trees',
    status: 'idle',
    durationMs: 0,
    logs: [],
    iconName: 'PackageCheck',
    requiredForDeploy: true,
  },
  {
    id: 'deploy',
    name: 'Deploy to Vercel (branchlab.me)',
    description: 'Promotes artifacts to edge CDN & DNS',
    status: 'idle',
    durationMs: 0,
    logs: [],
    iconName: 'CloudUpload',
    requiredForDeploy: false,
  },
]

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

  if (stageId === 'lint') {
    if (isSuccess) {
      return [
        `[${timestamp}] [CI] Starting oxlint & tsc --noEmit check on commit ${commitHash}...`,
        `[${timestamp}] [CI] Checked 18 source files.`,
        `[${timestamp}] [CI] No syntax, formatting, or type errors detected.`,
        `[${timestamp}] [SUCCESS] Lint checks passed in 480ms. ✨`,
      ]
    }
    return [
      `[${timestamp}] [CI] Starting oxlint & tsc --noEmit check on commit ${commitHash}...`,
      `[${timestamp}] [ERROR] src/components/GitCanvas.tsx:42:18 - Type 'undefined' is not assignable to type 'string'.`,
      `[${timestamp}] [ERROR] Lint failed with exit code 1.`,
      `[${timestamp}] [FAILED] CI pipeline halted due to code quality check failure. ❌`,
    ]
  }

  if (stageId === 'unit-tests') {
    if (isSuccess) {
      return [
        `[${timestamp}] [VITEST] Starting test suite in jsdom environment...`,
        `[${timestamp}] PASS src/test/App.test.tsx (4 tests passed)`,
        `[${timestamp}] PASS src/test/gitEngine.test.ts (6 tests passed)`,
        `[${timestamp}] PASS src/test/pipelineEngine.test.ts (5 tests passed)`,
        `[${timestamp}] Tests: 15 passed, 15 total | Duration: 1.12s`,
        `[${timestamp}] [SUCCESS] Automated test suite passed 100% green! ✅`,
      ]
    }
    return [
      `[${timestamp}] [VITEST] Starting test suite in jsdom environment...`,
      `[${timestamp}] FAIL src/test/gitEngine.test.ts > mergeBranches()`,
      `[${timestamp}] AssertionError: expected branch 'main' head to point to merge commit c5, but got c4`,
      `[${timestamp}] Tests: 1 failed, 14 passed, 15 total`,
      `[${timestamp}] [FAILED] Test suite failed with exit code 1. Deployment blocked by CI guard! ❌`,
    ]
  }

  if (stageId === 'security') {
    if (isSuccess) {
      return [
        `[${timestamp}] [AUDIT] Scanning package.json and npm lockfile dependencies...`,
        `[${timestamp}] [AUDIT] 157 dependencies audited against GitHub Advisory Database.`,
        `[${timestamp}] [AUDIT] 0 known vulnerabilities found.`,
        `[${timestamp}] [SUCCESS] SAST & security compliance check passed. 🛡️`,
      ]
    }
    return [
      `[${timestamp}] [AUDIT] Scanning package.json and lockfile dependencies...`,
      `[${timestamp}] [ALERT] Found High Severity CVE in third-party bundle parser.`,
      `[${timestamp}] [FAILED] Security gate failed: Insecure dependencies must be patched. ❌`,
    ]
  }

  if (stageId === 'build') {
    if (isSuccess) {
      return [
        `[${timestamp}] [VITE] Building for production (tsc -b && vite build)...`,
        `[${timestamp}] dist/index.html                     0.78 kB │ gzip:  0.42 kB`,
        `[${timestamp}] dist/assets/index-B_9K12a.css      14.22 kB │ gzip:  3.65 kB`,
        `[${timestamp}] dist/assets/index-D78mG10.js      188.10 kB │ gzip: 59.80 kB`,
        `[${timestamp}] [SUCCESS] Built in 620ms. Bundle artifacts ready. 📦`,
      ]
    }
    return [
      `[${timestamp}] [VITE] Building for production (tsc -b && vite build)...`,
      `[${timestamp}] [ERROR] Out of memory during chunk optimization or invalid asset path.`,
      `[${timestamp}] [FAILED] Build failed with exit code 1. ❌`,
    ]
  }

  if (stageId === 'deploy') {
    const domain = branch === 'main' ? 'https://branchlab.me' : `https://branchlab-preview-${commitHash}.vercel.app`
    return [
      `[${timestamp}] [VERCEL] Promoting build artifacts to edge network...`,
      `[${timestamp}] [VERCEL] Provisioning SSL certificate & DNS records...`,
      `[${timestamp}] [VERCEL] Environment: ${branch === 'main' ? 'PRODUCTION' : 'PREVIEW'}`,
      `[${timestamp}] [SUCCESS] Deployed successfully to ${domain} 🚀`,
    ]
  }

  return [`[${timestamp}] Completed stage ${stageId}.`]
}

export function shouldStageFail(stageId: string, config: PipelineFailureConfig): boolean {
  if (stageId === 'lint' && config.failLint) return true
  if (stageId === 'unit-tests' && config.failTests) return true
  if (stageId === 'security' && config.failSecurity) return true
  if (stageId === 'build' && config.failBuild) return true
  return false
}
