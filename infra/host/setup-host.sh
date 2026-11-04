#!/usr/bin/env bash
# One-time (and safely re-runnable) host setup for the branchlab.tech VM
# (Oracle Linux 9, OCI). Everything the server needs beyond Docker lives here,
# so the host configuration is versioned in Git like the rest of the infra.
#
#   ssh -t ssh.branchlab.tech "sudo bash ~/branchlab/infra/host/setup-host.sh"
#
# What it does:
#   1. Grows / into the unused part of the 75 GB boot volume (oci-growfs)
#   2. fail2ban for SSH brute-force protection (bans via firewalld)
#   3. Automatic daily security updates (dnf-automatic) + reboot when required
#   4. Docker log rotation (10 MB x 3 per container) + live-restore
#   5. Removes leftover firewalld port rules, prints a summary
set -euo pipefail

[[ $EUID -eq 0 ]] || { echo "Run with sudo: sudo bash $0" >&2; exit 1; }

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OWNER_HOME="$(getent passwd "${SUDO_USER:-peter}" | cut -d: -f6)"
step() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

# ---------------------------------------------------------------------------
step "1/5 Disk: grow / into the free space of the boot volume"
df -h / | tail -1
if [[ -x /usr/libexec/oci-growfs ]]; then
  # Exits non-zero when there is nothing to grow; that's fine on re-runs.
  /usr/libexec/oci-growfs -y || echo "oci-growfs: nothing to grow (already at full size?)"
else
  echo "oci-growfs not found (dnf install oci-utils), skipping"
fi
df -h / | tail -1

# ---------------------------------------------------------------------------
step "2/5 Packages: fail2ban + dnf-automatic"
# yum-utils provides needs-restarting (used by the reboot fallback below)
dnf install -y fail2ban dnf-automatic yum-utils

step "2/5 fail2ban: SSH jail"
cat > /etc/fail2ban/jail.d/sshd.local <<'EOF'
# Managed by branchlab/infra/host/setup-host.sh - do not edit by hand
[DEFAULT]
# 5 failures within 10 minutes -> banned for 1 hour,
# repeat offenders get exponentially longer bans
bantime = 1h
findtime = 10m
maxretry = 5
bantime.increment = true
bantime.maxtime = 1w
ignoreip = 127.0.0.1/8 ::1
banaction = firewallcmd-rich-rules
banaction_allports = firewallcmd-rich-rules

[sshd]
enabled = true
backend = systemd
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

# ---------------------------------------------------------------------------
step "3/5 Automatic security updates (dnf-automatic)"
conf=/etc/dnf/automatic.conf
sed -i -E 's/^#?\s*upgrade_type\s*=.*/upgrade_type = security/' "$conf"
sed -i -E 's/^#?\s*apply_updates\s*=.*/apply_updates = yes/' "$conf"
if grep -qE '^#?\s*reboot\s*=' "$conf"; then
  # Supported by this dnf version: reboot only if a kernel/core lib changed
  sed -i -E 's/^#?\s*reboot\s*=.*/reboot = when-needed/' "$conf"
  rm -f /etc/systemd/system/reboot-if-needed.{service,timer}
  echo "dnf-automatic handles reboots (reboot = when-needed)"
else
  # Fallback for older dnf: reboot at 06:45 only when needs-restarting says so
  cat > /etc/systemd/system/reboot-if-needed.service <<'EOF'
[Unit]
Description=Reboot if updated packages require it (managed by setup-host.sh)

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'needs-restarting -r >/dev/null || systemctl reboot'
EOF
  cat > /etc/systemd/system/reboot-if-needed.timer <<'EOF'
[Unit]
Description=Daily check whether a reboot is required after updates

[Timer]
OnCalendar=*-*-* 06:45
Persistent=false

[Install]
WantedBy=timers.target
EOF
  systemctl daemon-reload
  systemctl enable --now reboot-if-needed.timer
  echo "dnf-automatic has no reboot option here: installed reboot-if-needed.timer"
fi
systemctl enable --now dnf-automatic.timer
grep -E '^(upgrade_type|apply_updates|reboot)\s*=' "$conf"

# ---------------------------------------------------------------------------
step "4/5 Docker: log rotation + live-restore"
daemon=/etc/docker/daemon.json
wanted='{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "live-restore": true
}'
if [[ -f $daemon ]] && [[ "$(cat "$daemon")" == "$wanted" ]]; then
  echo "daemon.json already up to date"
else
  [[ -f $daemon ]] && cp "$daemon" "$daemon.bak.$(date +%F)"
  printf '%s\n' "$wanted" > "$daemon"
  # Reload first: live-restore is reloadable, so the restart below keeps
  # the running containers alive instead of stopping them.
  systemctl reload docker
  systemctl restart docker
  echo "Docker restarted with log rotation"
fi

# Log options only apply to newly created containers: recreate every stack.
step "4/5 Recreating containers so the log limits apply"
cd "$REPO_DIR"
docker compose up -d --no-build --force-recreate --wait --wait-timeout 120
docker compose -f infra/arcane/compose.yml up -d --force-recreate
if [[ -f infra/tinyauth/.env ]]; then
  docker compose -f infra/tinyauth/compose.yml up -d --force-recreate
fi
docker compose -f infra/caddy/compose.yml up -d --force-recreate
if [[ -f "$OWNER_HOME/codeblue/docker-compose.yml" ]]; then
  (cd "$OWNER_HOME/codeblue" && docker compose up -d --no-build --force-recreate)
fi

# ---------------------------------------------------------------------------
step "5/5 Firewall cleanup + summary"
for p in 5000/tcp 3001/tcp 3552/tcp; do
  if firewall-cmd --permanent --query-port="$p" >/dev/null 2>&1; then
    firewall-cmd --permanent --remove-port="$p" && echo "removed firewalld port $p"
  fi
done
firewall-cmd --reload >/dev/null
firewall-cmd --list-services

echo
df -h / | tail -1
fail2ban-client status sshd | sed -n '1,8p'
systemctl list-timers --no-pager 'dnf-automatic*' 'reboot-if-needed*' | head -5
docker ps --format '{{.Names}}\t{{.Status}}'
for c in $(docker ps --format '{{.Names}}'); do
  printf '%-18s %s\n' "$c" "$(docker inspect --format '{{.HostConfig.LogConfig.Config}}' "$c")"
done
echo
echo "Host setup complete."
