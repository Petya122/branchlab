#!/usr/bin/env bash
# Creates / updates infra/caddy/.env with the Arcane basic-auth user and a
# bcrypt hash of the password. Run it on the server:
#   bash ~/branchlab/infra/caddy/set-arcane-password.sh
# The password is only sent to `caddy hash-password` via stdin and is never stored.
set -euo pipefail
cd "$(dirname "$0")"

read -rp "Arcane basic-auth username: " user
read -rsp "Password: " pw; echo
read -rsp "Repeat password: " pw2; echo
[[ -n "$pw" && "$pw" == "$pw2" ]] || { echo "Passwords are empty or do not match." >&2; exit 1; }

# caddy reads one line from stdin, so the trailing newline is required
hash=$(printf '%s\n' "$pw" | docker run --rm -i caddy:2.11.7-alpine caddy hash-password | tr -d '\r' | tail -n1)
unset pw pw2
[[ "$hash" == \$2* ]] || { echo "Hashing failed." >&2; exit 1; }

umask 077
printf "ARCANE_AUTH_USER='%s'\nARCANE_AUTH_HASH='%s'\n" "$user" "$hash" > .env
echo "Saved $(pwd)/.env"

if docker ps --format '{{.Names}}' | grep -qx caddy; then
  docker compose -f compose.yml up -d --force-recreate
  echo "Caddy restarted with the new password."
fi
