# Changelog

All notable changes to BranchLab are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/).
Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/Petya122/branchlab/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Petya122/branchlab/releases/tag/v1.0.0
