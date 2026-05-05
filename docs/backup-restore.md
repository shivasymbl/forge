# Forge Backup & Restore Runbook

## What is backed up

Every backup archive (`forge-full-YYYYMMDD_HHMMSS.tar.gz`) contains four components:

| File | Contents | Size (approx) |
|---|---|---|
| `db.dump.gz` | PostgreSQL `forge` database (pg_dump -Fc) | ~150 KB |
| `uploads.tar.gz` | User-uploaded files (`forge_forge_backend_uploads` Docker volume) | ~2 MB |
| `uptime-kuma.tar.gz` | Uptime Kuma monitor config + history | ~40 KB |
| `cloudflared.tar.gz` | Cloudflare Tunnel credentials (`/etc/cloudflared/`) | ~4 KB |

**Note:** The old `forge-db-*.dump.gz` files in R2 are DB-only backups from before 2026-05-05. Use `forge-full-*` archives for complete restores.

## Schedule & retention

- **Daily** at 2am UTC → `r2:forge-backups/daily/` — kept 7 days
- **Weekly** (Sunday) → `r2:forge-backups/weekly/` — kept 4 weeks
- **Script:** `/root/forge-backup.sh` on droplet 209.38.78.178
- **Logs:** `/var/log/forge-backup.log`
- **Credentials:** Doppler `forge/prd` → `R2_ACCESS_KEY_ID`, `R2_SECRET_KEY`, `R2_ENDPOINT`, `R2_ACCOUNT_API_TOKEN`

## Trigger a manual backup

```bash
ssh root@209.38.78.178 "bash /root/forge-backup.sh"
```

## List available backups

```bash
# From local machine (requires rclone configured with R2 credentials)
rclone ls r2:forge-backups/daily/
rclone ls r2:forge-backups/weekly/

# From droplet directly
ssh root@209.38.78.178 "rclone ls r2:forge-backups/daily/"
```

---

## Restore to a fresh droplet

> **Time estimate:** ~20 minutes for a full restore.
> **Prerequisites:** Doppler access, Cloudflare account access, DigitalOcean account.

### Step 1 — Provision the droplet

```bash
doctl compute droplet create forge \
  --size s-2vcpu-4gb \
  --image ubuntu-24-04-x64 \
  --region sfo3 \
  --ssh-keys <your-ssh-key-id>
```

Note the new droplet IP. Update the Cloudflare Tunnel to point to it (Step 5).

### Step 2 — Install dependencies

```bash
ssh root@<NEW_IP>

# Docker
curl -fsSL https://get.docker.com | bash
systemctl enable --now docker

# Doppler
curl -sLf --retry 3 --tlsv1.2 --proto "=https" \
  'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' \
  | gpg --dearmor --output /usr/share/keyrings/doppler-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] \
  https://packages.doppler.com/public/cli/deb/debian any-version main" \
  | tee /etc/apt/sources.list.d/doppler-cli.list
apt-get update && apt-get install -y doppler

# rclone (for restore + future backups)
curl -fsSL https://rclone.org/install.sh | bash
```

### Step 3 — Configure rclone (R2 access)

```bash
mkdir -p /root/.config/rclone
cat > /root/.config/rclone/rclone.conf << 'EOF'
[r2]
type = s3
provider = Cloudflare
access_key_id = <R2_ACCESS_KEY_ID from Doppler>
secret_access_key = <R2_SECRET_KEY from Doppler>
endpoint = https://c215135070693a6447ab37d6d782e18c.r2.cloudflarestorage.com
acl = private
EOF
```

Verify: `rclone lsd r2:forge-backups`

### Step 4 — Download and unpack the backup

```bash
# List available backups and pick the most recent
rclone ls r2:forge-backups/daily/ | sort | tail -5

# Download (replace YYYYMMDD_HHMMSS with the archive you want)
ARCHIVE="forge-full-YYYYMMDD_HHMMSS.tar.gz"
rclone copy "r2:forge-backups/daily/$ARCHIVE" /tmp/
cd /tmp && tar xzf "$ARCHIVE"
# You now have: db.dump.gz  uploads.tar.gz  uptime-kuma.tar.gz  cloudflared.tar.gz
```

### Step 5 — Restore Cloudflare Tunnel credentials

```bash
mkdir -p /etc/cloudflared
tar xzf /tmp/cloudflared.tar.gz -C /etc/cloudflared/

# Install cloudflared
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared focal main' \
  | tee /etc/apt/sources.list.d/cloudflared.list
apt-get update && apt-get install -y cloudflared

# Register as systemd service
cloudflared service install
systemctl enable --now cloudflared
```

**Then update Cloudflare dashboard:** Tunnels → forge-droplet → Edit → update the connector to point to the new droplet. The tunnel UUID and credentials are restored from the backup so no re-authentication is needed.

### Step 6 — Deploy the application stack

```bash
# Get the compose file from git
curl -fsSL https://raw.githubusercontent.com/shivasymbl/forge/main/docker-compose.selfhost.yml \
  -o /root/docker-compose.selfhost.yml

# Authenticate Doppler and generate .env
doppler login
doppler secrets download \
  --project forge --config prd \
  --no-file --format docker > /root/.env

# Set image tag to latest
sed -i "s|MULTICA_IMAGE_TAG=.*|MULTICA_IMAGE_TAG=latest|" /root/.env

# Pull and start (DB starts first, then backend runs migrations, then frontend)
docker compose -f /root/docker-compose.selfhost.yml --env-file /root/.env pull
docker compose -f /root/docker-compose.selfhost.yml --env-file /root/.env up -d postgres
sleep 10
```

### Step 7 — Restore the database

```bash
# Restore into the running postgres container
gunzip -c /tmp/db.dump.gz | docker exec -i forge-postgres \
  pg_restore -U forge -d forge --clean --if-exists
echo "DB restore complete"
```

### Step 8 — Restore uploads volume

```bash
# Start backend to create the volume
docker compose -f /root/docker-compose.selfhost.yml --env-file /root/.env up -d backend
sleep 5

# Copy files into the uploads volume
tar xzf /tmp/uploads.tar.gz -C /var/lib/docker/volumes/forge_forge_backend_uploads/_data/
echo "Uploads restored"
```

### Step 9 — Start remaining services

```bash
docker compose -f /root/docker-compose.selfhost.yml --env-file /root/.env up -d

# Verify all containers are running
docker ps
```

### Step 10 — Restore Uptime Kuma

```bash
# Stop Kuma before restore
docker stop uptime-kuma

# Restore data
tar xzf /tmp/uptime-kuma.tar.gz -C /var/lib/docker/volumes/uptime-kuma/_data/

# Start Kuma
docker run -d \
  --name uptime-kuma \
  --restart always \
  -v uptime-kuma:/app/data \
  -p 3001:3001 \
  louislam/uptime-kuma:1
echo "Uptime Kuma restored"
```

### Step 11 — Reinstall the backup cron

```bash
# Copy backup script
curl -fsSL https://raw.githubusercontent.com/shivasymbl/forge/main/scripts/forge-backup.sh \
  -o /root/forge-backup.sh
# OR: manually recreate from docs/backup-restore.md

chmod +x /root/forge-backup.sh

# Add cron
(crontab -l 2>/dev/null; echo "0 2 * * * /root/forge-backup.sh >> /var/log/forge-backup.log 2>&1") | crontab -
```

### Step 12 — Smoke test

```bash
curl -s -o /dev/null -w "%{http_code}" https://forge.asymbl.app
# Expect: 200
```

---

## What is NOT in the backup

| Item | Location | Recovery |
|---|---|---|
| Doppler secrets | Doppler cloud | Access via `doppler secrets` — always available |
| Docker images | GHCR (`ghcr.io/shivasymbl/forge-*`) | Re-pulled automatically on `docker compose pull` |
| Git repo | `github.com/shivasymbl/forge` | Clone fresh |
| Depot CI config | `.depot/workflows/` | In git repo |

---

## Backup script reference

The backup script lives at `/root/forge-backup.sh` on the droplet.
A copy of the script is also maintained at `scripts/forge-backup.sh` in this repo.

To update the script on the droplet after changing `scripts/forge-backup.sh`:
```bash
scp scripts/forge-backup.sh root@209.38.78.178:/root/forge-backup.sh
```
