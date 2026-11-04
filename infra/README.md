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
    ├── deploy.sh             Pull + start an image tag, reload Caddy
    ├── caddy/
    │   ├── compose.yml       Edge proxy, the only container with public ports (80/443)
    │   ├── conf/Caddyfile    All public hostnames
    │   └── .env              ARCANE_AUTH_USER / ARCANE_AUTH_HASH (server only)
    └── arcane/
        ├── compose.yml       Docker management UI (behind Caddy basic auth)
        └── .env              APP_URL / ENCRYPTION_KEY (server only)
```

All containers that Caddy serves join the external Docker network **`proxy`**
and are addressed by container name in the Caddyfile. No app publishes host ports.

| Hostname | Upstream | Defined in |
| :--- | :--- | :--- |
| branchlab.tech, www.branchlab.tech | `branchlab:80` | `docker-compose.yml` |
| arcane.branchlab.tech | `arcane:3552` (+ basic auth) | `infra/arcane/compose.yml` |
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
cp infra/caddy/.env.example infra/caddy/.env     # then fill in, see below
cp infra/arcane/.env.example infra/arcane/.env   # then fill in

docker compose -f infra/arcane/compose.yml up -d
docker compose -f infra/caddy/compose.yml up -d
bash infra/deploy.sh latest   # needs `docker login ghcr.io` if the package is private
```

### Arcane password (Caddy basic auth)

Run this on the server. It asks for the password and prints a bcrypt hash:

```bash
docker run --rm -it caddy:2-alpine caddy hash-password
```

Put the user and the hash in `infra/caddy/.env`, in **single quotes** (the hash contains `$`):

```
ARCANE_AUTH_USER='peter'
ARCANE_AUTH_HASH='$2a$14$....'
```

Then apply it: `docker compose -f infra/caddy/compose.yml up -d --force-recreate`.

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
