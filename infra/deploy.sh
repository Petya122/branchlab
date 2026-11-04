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

echo "==> Updating Arcane (version pinned in infra/arcane/compose.yml)"
docker compose -f infra/arcane/compose.yml up -d

echo "==> Updating tinyauth (login for Arcane)"
if [[ -f infra/tinyauth/.env ]]; then
  docker compose -f infra/tinyauth/compose.yml up -d --wait --wait-timeout 60
else
  # tinyauth refuses to start without a user. Arcane stays locked (502)
  # until someone runs the setup script once.
  echo "WARNING: no tinyauth user yet - run: bash infra/tinyauth/set-user.sh" >&2
fi

echo "==> Updating Caddy"
docker compose -f infra/caddy/compose.yml up -d
# If the container was just (re)created, Caddy's admin API needs a moment
# before it accepts a reload, so retry for up to ~30 seconds.
for attempt in $(seq 1 15); do
  if docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile; then
    break
  fi
  if [[ $attempt -eq 15 ]]; then
    echo "Caddy reload failed" >&2
    exit 1
  fi
  echo "Caddy not ready yet, retrying ($attempt/15)..."
  sleep 2
done

echo "==> Cleaning up dangling images"
docker image prune -f

docker compose ps
