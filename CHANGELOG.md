# Changelog

All notable changes to BranchLab are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/).
Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

## [1.4.0] - 2026-11-04

Proper login for the Arcane admin UI.

### Added
- **tinyauth** (`infra/tinyauth`) in front of Arcane: a login page at `auth.branchlab.tech` with
  password + TOTP (authenticator app), a 7-day `Secure`/`HttpOnly` session cookie and a
  15-minute lockout after 5 wrong passwords. Caddy checks every Arcane request with `forward_auth`.
- `infra/tinyauth/set-user.sh` creates or replaces the login and shows the TOTP QR code.
- Dependabot also updates the pinned tinyauth image.

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

[Unreleased]: https://github.com/Petya122/branchlab/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/Petya122/branchlab/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Petya122/branchlab/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Petya122/branchlab/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Petya122/branchlab/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Petya122/branchlab/releases/tag/v1.0.0
