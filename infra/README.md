# Server infrastructure (branchlab.tech)

Everything that runs on the server is described in Git, so the server can be
rebuilt from this repository. **Never edit files on the server by hand.** The
deploy job refuses to run while the server checkout has uncommitted changes.

| Item | Value |
| :--- | :--- |
| Provider | Oracle Cloud Infrastructure, Frankfurt |
| Shape | VM.Standard.A1.Flex: Ampere ARM64, 1 OCPU, 6 GB RAM, 4 GB swap |
| OS | Oracle Linux 9 (SELinux enforcing, firewalld: http, https, ssh) |
| Login | `ssh ssh.branchlab.tech` (user `peter`, key only, no root login) |
| Checkout | `~/branchlab` = this repository, always on `main` |

## Layout

```
~/branchlab/
├── docker-compose.yml        BranchLab app (image from GHCR, no host ports)
├── .env                      IMAGE_TAG=sha-xxxxxxx, written by infra/deploy.sh
└── infra/
    ├── deploy.sh             Pull + start an image tag, update Arcane/tinyauth, reload Caddy
    ├── host/
    │   └── setup-host.sh     OS-level setup: disk, fail2ban, auto-updates, Docker logs
    ├── caddy/
    │   ├── compose.yml       Edge proxy, the only container with public ports (80/443)
    │   └── conf/Caddyfile    All public hostnames
    ├── tinyauth/
    │   ├── compose.yml       Login page (password + TOTP) in front of Arcane
    │   ├── set-user.sh       Creates / replaces the login, shows the TOTP QR code
    │   └── .env              TINYAUTH_AUTH_USERS (server only, written by set-user.sh)
    └── arcane/
        ├── compose.yml       Docker management UI (behind tinyauth)
        └── .env              APP_URL / ENCRYPTION_KEY (server only)
```

All containers that Caddy serves join the external Docker network **`proxy`**
and are addressed by container name in the Caddyfile. No app publishes host ports.

| Hostname | Upstream | Defined in |
| :--- | :--- | :--- |
| branchlab.tech, www.branchlab.tech | `branchlab:8080` (non-root nginx) | `docker-compose.yml` |
| arcane.branchlab.tech | `arcane:3552` (behind tinyauth) | `infra/arcane/compose.yml` |
| auth.branchlab.tech | `tinyauth:3000` (login page) | `infra/tinyauth/compose.yml` |
| codeblue.branchlab.tech | `codeblue-backend:3001` | `~/codeblue` (separate project) |

## Adding a new site

1. Run the new project's container on the `proxy` network without `ports:`:
   ```yaml
   networks:
     proxy:
       name: proxy
       external: true
   ```
2. Add a block to `infra/caddy/conf/Caddyfile` and open a PR. After the merge, the
   deploy reloads Caddy and the certificate is issued automatically. Point the DNS
   A record to the server first.

## Fresh server setup (from zero)

```bash
git clone https://github.com/Petya122/branchlab.git ~/branchlab && cd ~/branchlab
docker network create proxy

# Secrets (never committed)
cp infra/arcane/.env.example infra/arcane/.env   # then fill in
bash infra/tinyauth/set-user.sh                  # see below (also starts tinyauth)

docker compose -f infra/arcane/compose.yml up -d
docker compose -f infra/caddy/compose.yml up -d
bash infra/deploy.sh latest   # needs `docker login ghcr.io` if the package is private
```

DNS: `branchlab.tech`, `www`, `arcane`, `auth` and `codeblue` are A records
pointing to the server.

### Arcane login (tinyauth)

Arcane controls the Docker socket, so it has two logins: **tinyauth** first
(password + 6-digit code from an authenticator app), then Arcane's own.

How it works: Caddy asks tinyauth about every Arcane request (`forward_auth`).
Without a valid session cookie, browsers are redirected to
`https://auth.branchlab.tech`. After login, the cookie (`Secure`, `HttpOnly`,
domain `.branchlab.tech`) is valid for **7 days**. 5 wrong passwords lock the
login for 15 minutes. If tinyauth is down, Arcane is unreachable (no bypass).

A cookie login replaced the earlier Caddy basic auth. Arcane answers its own
"session expired" checks with 401, which made the browser forget the basic-auth
password and ask for it again several times in a row.

Create or replace the login (also after losing the phone with the authenticator
app). It asks for a username and password, shows a QR code to scan, stores the
bcrypt hash and TOTP secret in `infra/tinyauth/.env` (mode 600) and restarts
tinyauth:

```bash
ssh -t ssh.branchlab.tech "bash ~/branchlab/infra/tinyauth/set-user.sh"
```

Log out everywhere: `docker compose -f infra/tinyauth/compose.yml down -v && bash infra/tinyauth/set-user.sh`
(removing the volume deletes all sessions).

## Everyday commands

```bash
cd ~/branchlab
docker compose ps                                   # app status (should be "healthy")
docker compose logs -f                              # app logs
docker logs -f caddy                                # proxy / certificate logs
docker exec caddy caddy reload --config /etc/caddy/Caddyfile   # reload proxy config
bash infra/deploy.sh sha-1a2b3c4                    # manual rollback (or use the Rollback workflow)
cat .env                                            # which image tag is deployed
docker system df && docker image prune -a           # disk usage / cleanup
```

## Host setup (`infra/host/setup-host.sh`)

Everything configured on the OS itself (outside Docker) is in one idempotent
script. Run it once on a new server, or again after changing it. Re-runs cause
no downtime: containers are only recreated when the Docker log settings change
(force it with `--recreate`).

```bash
ssh -t ssh.branchlab.tech "sudo bash ~/branchlab/infra/host/setup-host.sh"
```

| Area | Configuration |
| :--- | :--- |
| Disk | `oci-growfs` grows `/` into the whole 75 GB boot volume |
| SSH brute force | fail2ban `sshd` jail: 5 failures / 10 min → 1 h ban, increasing for repeat offenders (bans via firewalld) |
| Updates | `dnf-automatic`: security updates installed daily (~06:00–07:00). `reboot-if-needed.timer` reboots at 07:30 only if `needs-restarting -r` says so (dnf-automatic's own reboot check misses `kernel-uek`, the Oracle kernel) |
| Leftovers | Removes old systemd units from earlier setups (`arcane.service` restarted every 2 s after Arcane moved to `infra/arcane`) and old firewalld port rules |
| Docker logs | `json-file`, max 10 MB × 3 files per container; `live-restore` keeps containers running across Docker restarts |

Useful checks: `sudo fail2ban-client status sshd`, `systemctl list-timers 'dnf*'`,
`sudo dnf updateinfo list --security`, `needs-restarting -r`.

## OCI Security List (the outer firewall)

Docker-published ports bypass firewalld, so the OCI Security List is what
really decides what is reachable. Ingress rules (source `0.0.0.0/0`):

| Port | Why |
| :--- | :--- |
| 22/tcp | SSH: key-only login + fail2ban. Can't be limited to one IP because GitHub Actions deploys over SSH from changing addresses |
| 80/tcp | HTTP → redirected to HTTPS by Caddy, also used for certificate issuance |
| 443/tcp | HTTPS |
| 443/udp | HTTP/3 (QUIC), optional |

Nothing else. App ports such as 5000, 3001 or 3552 must not be opened.

## Base OS setup (already done, kept for reference)

```bash
# User with sudo, key-only SSH
adduser peter && passwd peter && usermod -aG wheel peter
# ~/.ssh/authorized_keys with chmod -R go= ~/.ssh
# /etc/ssh/sshd_config: PasswordAuthentication no, PermitRootLogin no

# 4 GB swap
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# /etc/sysctl.conf: vm.swappiness=10, vm.vfs_cache_pressure=50

# Docker CE + compose plugin
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker && sudo usermod -aG docker peter

# Firewall
sudo firewall-cmd --permanent --add-service=http --add-service=https && sudo firewall-cmd --reload
```

Note: Docker-published ports bypass firewalld, so the rule is that only Caddy
publishes ports. The OCI Security List is the outer firewall.
