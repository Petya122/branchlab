# Testing strategy

> **Rule for every test in this repository:** it must fail when something a
> user (or the operator) cares about breaks, and it must stay green when the
> code is only refactored. A test that cannot fail for a meaningful reason is
> deleted.

## The layers (test pyramid)

| Layer | Tool | Count | What it is for |
| :--- | :--- | ---: | :--- |
| Unit | Vitest | 53 | Pure rules: Git engine, terminal parser, levels/trophies. Milliseconds, pinpoints the broken rule. |
| Hook / component | Vitest + React Testing Library | 30 | Team rules (protected `main`, CI gate, PRs, conflicts), the pipeline, each dialog, driven by role and label like a user. |
| Integration | Vitest + RTL, whole `<App />` | 19 | Journeys through the real lab state: terminal → graph → pipeline → PR. Most are regression tests of real bugs. |
| End-to-end | Playwright (desktop + phone) | 10 | What only a real browser shows: layout, fonts, CSP enforcement, nginx headers, the full quality-gate journey. |

Every file starts with a `WHY:` comment that names the risk it protects.

## Tests worth showing (and why they matter)

1. **The quality-gate journey (E2E)**: `e2e/app.spec.ts`
   - **What:** a red pipeline blocks the pull request; fixing the test makes CI green; the PR squash-merges into `develop`.
   - **Why it matters:** this is the DevOps story of the whole app, run in a real browser. It mirrors this repository's own GitHub ruleset, where `main` only accepts PRs with green checks.

2. **A green run on one branch must not unlock another branch's PR**: `lab.test.tsx`
   - **What:** a regression test for a real bug found on the live site. The PR gate used the *last* pipeline run, so `git checkout develop` after a green run on `feature/auth` allowed a merge without CI.
   - **Why it matters:** CI results belong to a commit (like GitHub status checks). This test was **red on the buggy code and green after the fix**.

3. **Fail fast**: `pipeline.test.tsx`
   - **What:** when the security stage fails, `build` and `deploy` never run, and the commit is recorded as failed.
   - **Why it matters:** this is the core CI/CD property. A broken build must never reach production.

4. **Protected `main`**: `gitRules.test.tsx`
   - **What:** direct commits are blocked, and a merge without green CI is blocked. With green CI the hotfix merges, and Permissive mode lifts the rules.
   - **Why it matters:** these are the branch-protection rules of the course, tested from both sides (blocked *and* allowed). That way a test can't pass just because everything is blocked.

5. **Git correctness**: `gitEngine.test.ts`
   - **What:**
     - a merge commit has two parents;
     - a squash merge has one, and the feature branch is not in the history;
     - merging something already merged says "Already up to date".
   - **Why it matters:** the simulator teaches Git, so a wrong Git rule means a wrong lesson.

6. **Boundary values**: `progress.test.ts`
   - **What:** 99 vs 100, 199 vs 200 and 324 vs 325 XP.
   - **Why it matters:** the classic test-design technique (boundary value analysis). It catches off-by-one mistakes (`>` vs `>=`) that a single "middle" value never would.

7. **Equivalence classes**: `gitEngine.test.ts`
   - **What:** a table of valid and invalid branch names (spaces, `..`, a trailing `/`, `.lock`, `HEAD`, accented letters).
   - **Why it matters:** one test per *class* of input, not one per example.

8. **Layout only a browser can see (E2E)**
   - **What:** at 1280 px every quick action must be fully on screen, and on a phone the action dock must be visible, with no horizontal scroll.
   - **Why it matters:** both were real bugs that jsdom cannot detect.

9. **Security and privacy (E2E)**
   - **What:**
     - the CSP is deny-by-default;
     - clicking through every dialog and a confetti pipeline run produces **zero CSP violations**;
     - the page loads nothing from third-party origins (GDPR);
     - against the production image: security headers, `version.json` with `no-store` (used by the deploy smoke test), and the SPA fallback.

10. **Robustness**: `progress.test.ts`, `gitRules.test.tsx`
    - **What:** corrupted data in `localStorage` starts from zero instead of crashing, and invalid Git operations are logged as errors instead of throwing.

## Proof that the tests are meaningful: mutation testing

```bash
python scripts/mutation-check.py
```

The script puts one realistic bug into the app at a time (a merge commit losing its second parent, the old PR bypass, an off-by-one at a level boundary, a missing "already awarded" guard, ...). It runs the suite and restores the file afterwards. **Result: 10/10 injected bugs are caught.** A suite with high coverage but weak assertions would let these through. That's why mutation testing tells you more than coverage does.

## What was removed, and why

Version 1.6.0 had 162 Vitest tests. A review against the rule above removed or merged about 60 of them. Coverage only dropped from about 93% to 91% of lines, which shows how little those tests checked.

| Removed kind of test | Example | Why it did not matter |
| :--- | :--- | :--- |
| "Renders X" smoke tests | `renders the hero title`, `renders the Clear button` | Static text; they fail on copy edits and catch no bug. |
| Callback wiring | `calls onClose when clicking Save & Close` | Tests React, not our logic. Real flows already click these buttons. |
| Fixture checks | `initializes GitFlow state with main, develop…` | Restates hard-coded data. |
| Implementation details | `useModals keeps one id`, `confetti create() called with …`, a hard-coded `3.2s` animation value | Breaks on refactoring. The behaviour is covered elsewhere (E2E CSP test, dialog flows). |
| Duplicates | the same rule at engine, hook *and* UI level | Kept once at the level where it is cheapest and clearest. |
| Copy assertions | `logs contain "100% green"` | Fails when wording changes, not when behaviour breaks. |

## Practices used

- **AAA** (Arrange, Act, Assert) in every test.
- **Queries by role and label** (`getByRole('button', { name: … })`), never CSS classes, so the tests also check accessibility.
- **Fake timers** for the pipeline, so tests are fast and deterministic (no flakiness).
- **Mocks only at real boundaries:** the confetti canvas, which jsdom does not have. Nothing of our own logic is mocked.
- **Regression tests are proven** red on the old code before the fix is merged.
- **In CI:** lint → typecheck → Vitest with coverage thresholds → `npm audit` → build → Docker image → Trivy → Playwright against the exact image that will be deployed.
