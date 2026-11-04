#!/usr/bin/env bash
# Deploys a BranchLab image tag on the server and refreshes the edge proxy.
# Called by the CI deploy job and the rollback workflow; also usable by hand:
#   cd ~/branchlab && bash infra/deploy.sh sha-1a2b3c4
#   cd ~/branchlab && bash infra/deploy.sh 1.0.0
# Pulling from GHCR requires a prior `docker login ghcr.io` (CI does it with
# its short-lived GITHUB_TOKEN) unless the package is public.
set -euo pipefail

TAG="${1:?usage: infra/deploy.sh <image-tag>}"
cd "$(dirname "$0")/.."

echo "==> Deploying ghcr.io/petya122/branchlab:${TAG}"
# Pin the tag in .env so a manual `docker compose up -d` keeps the same version.
echo "IMAGE_TAG=${TAG}" > .env

docker compose pull branchlab
docker compose up -d --no-build --wait --wait-timeout 120 branchlab

echo "==> Updating Caddy"
docker compose -f infra/caddy/compose.yml up -d
docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile

echo "==> Cleaning up dangling images"
docker image prune -f

docker compose ps
