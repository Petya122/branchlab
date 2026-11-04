#!/usr/bin/env bash
# Creates (or replaces) the tinyauth login used for Arcane: username, password
# and a TOTP secret for an authenticator app. Run it on the server:
#   bash ~/branchlab/infra/tinyauth/set-user.sh
# The password only goes to `caddy hash-password` via stdin; only its bcrypt
# hash and the TOTP secret are stored, in infra/tinyauth/.env (mode 600).
set -euo pipefail
cd "$(dirname "$0")"

TINYAUTH_IMAGE=ghcr.io/tinyauthapp/tinyauth:v5.2.0
CADDY_IMAGE=caddy:2.11.7-alpine

read -rp "Username: " user
[[ "$user" =~ ^[A-Za-z0-9._@-]+$ ]] || { echo "Use letters, digits and . _ @ - only." >&2; exit 1; }
read -rsp "Password: " pw; echo
read -rsp "Repeat password: " pw2; echo
[[ ${#pw} -ge 12 && "$pw" == "$pw2" ]] || { echo "Passwords do not match or are shorter than 12 characters." >&2; exit 1; }

# caddy reads one line from stdin, so the trailing newline is required
hash=$(printf '%s\n' "$pw" | docker run --rm -i "$CADDY_IMAGE" caddy hash-password | tr -d '\r' | tail -n1)
unset pw pw2
[[ "$hash" == \$2* ]] || { echo "Hashing failed." >&2; exit 1; }

echo
echo "Scan this QR code with your authenticator app (Google Authenticator, Aegis, 1Password, ...):"
# tinyauth prints the QR code and the secret; keep a copy to read the secret from
out=$(docker run --rm -t "$TINYAUTH_IMAGE" totp generate --user "${user}:${hash}" | tee /dev/tty)
# Strip colours / carriage returns, then take the secret after "authenticator app:"
secret=$(printf '%s' "$out" | sed 's/\x1b\[[0-9;]*m//g' | tr -d '\r' \
  | sed -n 's/.*authenticator app: *\([A-Z2-7]\{16,\}\).*/\1/p' | tail -n1)
[[ -n "$secret" ]] || { echo "Could not read the TOTP secret." >&2; exit 1; }

echo
read -rp "Press Enter once the app shows a 'tinyauth' entry (Ctrl+C to abort, nothing is saved yet)... " _

umask 077
# Single quotes: docker compose would otherwise expand the $ signs in the hash
printf "TINYAUTH_AUTH_USERS='%s:%s:%s'\n" "$user" "$hash" "$secret" > .env
echo "Saved $(pwd)/.env"

docker compose -f compose.yml up -d --force-recreate --wait
echo "tinyauth restarted. Log in at https://arcane.branchlab.tech"
