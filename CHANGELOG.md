# Changelog

All notable changes to BranchLab are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/).
Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

## [1.6.0] - 2026-11-11

Full site review: layout, logic and content consistency.

### Fixed
- **Desktop navbar:** at common laptop widths (e.g. 1280px) the PR, Conflict and Run CI/CD buttons
  were pushed off-screen. The navbar now wraps the quick actions onto a second row.
- **Phone action dock** did not stick to the bottom of the screen (`overflow-x: hidden` on body broke
  `position: sticky`); it now uses `overflow-x: clip`.
- **Onboarding tour:** "Don't show this guide" was ignored when the tour was closed with ✕, Esc or a
  click outside, so it opened on every visit. The choice is now saved as soon as it is ticked.
- **Terminal:** every typed git command was printed twice; `git status` showed an internal id (`c1`)
  instead of the commit hash.
- **Pipeline:** feature-branch runs "deployed" to a made-up preview URL and showed "Deployment Live on
  branchlab.tech". Like the real workflow, the deploy stage is now skipped for anything but `main`.
- **Challenges:** "Defend the Quality Gate" said a test was broken but injected no failure; it now
  starts with "Tests Fail". The first challenge, terminal text and pipeline now match the default
  branching model from Settings (they always assumed GitFlow).
- **Quality Gatekeeper** trophy unlocked on any green run; it now needs a red pipeline turned green.
- **Trophy Room:** "XP to next level" showed the level's size instead of the XP still missing, and the
  top level promised an unreachable next level.
- **Branch names** with spaces, `..`, a trailing `/` etc. were accepted; they are now validated like
  Git does, with an explanation in the Branch dialog.
- The `v0.1.0` tag badge covered the `main` lane label; the homepage animation box showed a needless
  scrollbar.

### Changed
- Pipeline stages and logs mirror the real workflow (oxlint + tsc, Vitest with coverage, npm audit +
  Trivy, Docker image + Playwright E2E, GHCR + SSH deploy + smoke test) instead of the old Vercel-era
  "edge CDN" texts.
- Up-to-date texts: homepage test badge, footer, tutorial button names, Settings descriptions, Trophy
  descriptions, valid hexadecimal commit hashes in the homepage animation. The terminal header shows
  the real app version.
- `favicon.png` was a 1024×1024 JPEG (462 KB) with a `.png` name; replaced by real PNGs
  (`apple-touch-icon.png` 180×180, `favicon-32.png`). Unused `avatar.png` removed.
- Link previews: absolute `og:image` URL, `og:site_name`, Twitter card, canonical URL; added
  `robots.txt`, `sitemap.xml` and a `<noscript>` message.

### Added
- Terminal commands `git log`, `git branch`, `git switch` and `git switch -c`.
- A GitHub Flow challenge ("Merge Through a Pull Request").
- Keyboard access and labels: commit dots and pipeline stages are focusable buttons, the terminal
  input and the Settings button have accessible names, `Esc` already closes dialogs.
- 34 new regression tests (162 Vitest tests) and an E2E test that checks every quick action is on
  screen at 1280px and on phones.

## [1.5.1] - 2026-11-11

### Fixed
- The `apk upgrade` layer of the Docker image was reused from the CI build cache, so the image kept
  `libxslt 1.1.43-r3` with two HIGH CVEs (CVE-2026-87636, CVE-2026-9947) although Alpine already
  shipped the fix. Trivy then blocked the merges of the Dependabot updates. CI now passes a value
  that changes every run (`APK_CACHE_BUST`), so the security update always runs; the image has
  `libxslt 1.1.43-r4` and Trivy reports 0 HIGH/CRITICAL findings.

### Changed
- Trivy 0.70.0 → 0.76.2 (`--vuln-type` → `--pkg-types`).
- Weekly scheduled CI run (Mondays 06:00 UTC, also startable by hand): builds, scans and tests `main`
  so newly published CVEs show up without waiting for the next merge. Scheduled runs never push or
  deploy; images are pushed on `push` events only.
- Caddy 2.11.9 also in the CI Caddyfile check and `set-user.sh`, matching the Dependabot bump.
- Includes the merged Dependabot updates: Caddy 2.11.7 → 2.11.9, `@vitejs/plugin-react` 6.1.2 → 6.2.1.

## [1.5.0] - 2026-11-04

Simulator correctness: the lab now follows its own Git and branch-protection rules.

### Fixed
- **CI gate bypass:** the pull request used the result of the *last* pipeline run, so a green run
  on one branch unlocked a PR from any other branch after `git checkout`. CI results are now stored
  per commit (like GitHub status checks) and the PR checks the head commit of its own branch.
- **Fake conflict merge:** in Trunk-Based and GitHub Flow the conflict targeted the non-existent
  `develop` branch, failed silently, yet printed "resolved" and awarded the trophy. Feature branches
  now integrate into `develop` only in GitFlow, otherwise into `main`; failures are reported.
- **Branch protection did nothing:** with "Strict Branch Protection" on (the default), direct commits
  to `main` are blocked and merges into `main` need a green pipeline on the source branch.
- **Squash & merge** created a two-parent merge commit; it now creates one single-parent commit on the
  target, like GitHub. PR numbers count up, and GitFlow feature PRs target `develop`.
- `git checkout -b <new> <base>` from another branch left HEAD on the old commit.
- Merging a branch into itself (possible from the terminal) and merging an already-merged branch
  created empty merge commits; they now fail with git-like messages ("Already up to date").
- An empty `develop` lane was drawn in Trunk-Based and GitHub Flow.
- Opening a PR or conflict while on the integration target itself is explained instead of opening.
- Feature-branch pipeline runs no longer claim a production release.
- `Esc` closes the open dialog (e.g. the onboarding tour).

### Added
- 21 regression tests (128 in total); each fails on the previous code.

## [1.4.0] - 2026-11-04

Proper login for the Arcane admin UI.

### Added
- **tinyauth** (`infra/tinyauth`) in front of Arcane: a login page at `auth.branchlab.tech` with
  password + TOTP (authenticator app), a 7-day `Secure`/`HttpOnly` session cookie and a
  15-minute lockout after 5 wrong passwords. Caddy checks every Arcane request with `forward_auth`.
- `infra/tinyauth/set-user.sh` creates or replaces the login and shows the TOTP QR code.
- Dependabot also updates the pinned tinyauth image.
- tinyauth is hidden in Arcane (stopping it there would lock Arcane), and Arcane's own
  updater is off for tinyauth and Caddy: their versions come from Git via Dependabot.

### Removed
- Caddy basic auth on Arcane (`set-arcane-password.sh`, `infra/caddy/.env`). Arcane's own
  401 responses made browsers forget the basic-auth password and ask for it several times in a row.

## [1.3.0] - 2026-11-04

Strict Content-Security-Policy, modal tests and privacy.

### Changed
- Content-Security-Policy is now deny-by-default (`default-src 'none'`) and no longer allows
  `'unsafe-inline'` styles. Only same-origin scripts, styles, fonts, images and requests are allowed.
- `Referrer-Policy` is now `no-referrer`: other sites (e.g. GitHub, when following a link)
  no longer learn that the visitor came from branchlab.tech.
- `vite preview` sends the production security headers (read from `nginx/security-headers.conf`),
  so local Playwright runs enforce the same CSP as production.
- Coverage thresholds raised (now ~90% statements / ~93% lines, 108 tests).

### Added
- E2E test that walks through every modal and a confetti-firing pipeline run and fails on any CSP
  violation reported by the browser.
- Component tests for the Commit, Branch, Merge, Merge Conflict, Pull Request, Trophy Room and
  Settings modals.

### Fixed
- The confetti library started a `blob:` Web Worker, which the CSP blocked. Confetti now renders
  on the main thread (`useWorker: false`), so no CSP exception is needed.
- The Branch, Merge and Pull Request modals kept the values from the first page render, e.g.
  "Branch off from" stayed on `feature/auth` after `git checkout main`. Modals now mount only
  while open and always start from the current lab state.

## [1.2.0] - 2026-11-04

Testing and maintainability.

### Added
- Code coverage with `@vitest/coverage-v8`. CI fails below the configured thresholds, shows a
  coverage table in the job summary and uploads the HTML report.
- Integration tests for the whole Interactive Lab, plus unit tests for the new hooks and the
  terminal command parser (34 → 85 tests, coverage 44% → 83% lines).
- Playwright end-to-end tests (desktop and mobile Chromium). CI runs them against the freshly
  built production Docker image before it is pushed, checking for console/CSP errors,
  third-party requests, lab flows, security headers and `/version.json`.
- `aria-label="Close"` on all modal close buttons.

### Changed
- `App.tsx` split from 890 to ~220 lines: `useGitSimulator`, `usePipelineSimulator`,
  `useTrophies`, `useTerminalLog` and `useModals` hooks, a pure `parseTerminalCommand` parser,
  and `AppNavbar`, `LabDashboard` and `LabQuickActions` components.
- Eight separate modal flags replaced by a single "open modal" state.

### Fixed
- In development (React StrictMode), unlocked achievements and chaos toggles were logged twice
  because side effects ran inside state updaters.
- Caddy error responses (Arcane's basic-auth 401 prompt, 502 pages) now also send HSTS and no
  `Server` header (`handle_errors` in the shared Caddy snippet).

## [1.1.0] - 2026-11-04

Security hardening round 2.

### Added
- Content-Security-Policy (only same-origin scripts, styles, fonts and images).
- HSTS (`max-age=1y; includeSubDomains`) on every site via a shared Caddy snippet.
- `infra/host/setup-host.sh`: OS setup as code, covering growing `/` to the full boot volume,
  fail2ban for SSH, automatic security updates with reboot-when-needed and Docker log rotation.
- Dependabot now also updates the pinned Caddy and Arcane images in `infra/`.

### Changed
- The app container runs nginx as a non-root user (`nginx-unprivileged`, port 8080).
- Base images are pinned to exact versions (Node 26.13.0, nginx 1.31.7, Caddy 2.11.7, Arcane v2.17.3).
- Fonts (Inter, JetBrains Mono) are self-hosted instead of loaded from Google Fonts.
- TypeScript `strict` mode is enabled in all tsconfig files.
- The deploy also applies the Arcane compose file, so its version is managed in Git.

### Removed
- `Server` (nginx version) and `Via` response headers.

## [1.0.0] - 2026-11-04

First versioned release. Production runs on Oracle Cloud at https://branchlab.tech.

### Added
- Interactive Git graph simulator for GitFlow, Trunk-Based Development and GitHub Flow.
- CI/CD pipeline visualizer with terminal logs and Chaos Mode (error injection).
- Merge conflict resolver, pull request simulation and the DevOps Trophy Room.
- Onboarding tutorial, homepage with the "Living Git Pulse" animation and a Settings modal.
- Responsive phone layout with a two-tier mobile navbar.
- Container image published to GHCR (`ghcr.io/petya122/branchlab`), tagged per commit (`sha-<short>`), per release (`1.0.0`, `1.0`) and `latest`.
- Docker `HEALTHCHECK` and `/version.json` build metadata (version + commit).
- CI: oxlint, `npm audit`, compose and Caddyfile validation, and a Trivy image scan.
- CD: deploy pulls the pre-built image, waits for the container to be healthy and runs a smoke test that checks the live commit.
- Manual rollback workflow to redeploy any published image tag.
- Dependabot for npm packages, GitHub Actions and Docker base images.
- `infra/` folder with the server's Caddy (edge proxy) and Arcane setup, and a server runbook.

### Changed
- Hosting moved from Vercel to an Oracle Cloud ARM64 VM with Docker, Caddy (automatic HTTPS) and Nginx.
- Domain changed from branchlab.me to branchlab.tech.
- Images are built in CI on a native ARM64 runner instead of on the server.
- Caddy is now a shared, server-wide proxy defined in `infra/caddy`, connected to apps over the `proxy` network.

### Fixed
- Security headers were missing on `/assets/` and image responses (nginx `add_header` inheritance).
- Duplicate `Cache-Control` headers on static assets.
- The app container's port 5000 was published to the internet and bypassed HTTPS.

### Removed
- Vercel configuration, Analytics and Speed Insights.
- Deprecated `X-XSS-Protection` header.
- Routes for the retired lecture4 demo stack.

[Unreleased]: https://github.com/Petya122/branchlab/compare/v1.6.0...HEAD
[1.6.0]: https://github.com/Petya122/branchlab/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/Petya122/branchlab/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/Petya122/branchlab/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Petya122/branchlab/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Petya122/branchlab/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Petya122/branchlab/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Petya122/branchlab/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Petya122/branchlab/releases/tag/v1.0.0
