#!/usr/bin/env bash
# Forge full backup → Cloudflare R2 (forge-backups bucket)
# Covers: PostgreSQL DB, uploads volume, Uptime Kuma data, cloudflared credentials
# Retention: 7 daily, 4 weekly (Sundays)
# Restore runbook: docs/backup-restore.md in the Forge repo
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DOW=$(date +%u)   # 1=Mon … 7=Sun
BUCKET="r2:forge-backups"
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }

log "=== Forge backup $TIMESTAMP ==="

# 1. PostgreSQL
log "Dumping PostgreSQL..."
docker exec forge-postgres pg_dump -U forge forge -Fc | gzip > "$TMPDIR/db.dump.gz"
log "  DB: $(du -sh $TMPDIR/db.dump.gz | cut -f1)"

# 2. Uploads volume (user-uploaded files)
log "Archiving uploads volume..."
tar czf "$TMPDIR/uploads.tar.gz" -C /var/lib/docker/volumes/forge_forge_backend_uploads/_data .
log "  Uploads: $(du -sh $TMPDIR/uploads.tar.gz | cut -f1)"

# 3. Uptime Kuma data
log "Archiving Uptime Kuma data..."
tar czf "$TMPDIR/uptime-kuma.tar.gz" -C /var/lib/docker/volumes/uptime-kuma/_data .
log "  Kuma: $(du -sh $TMPDIR/uptime-kuma.tar.gz | cut -f1)"

# 4. Cloudflare Tunnel credentials (needed to restore without re-authenticating)
log "Archiving cloudflared credentials..."
tar czf "$TMPDIR/cloudflared.tar.gz" -C /etc/cloudflared .
log "  Cloudflared: $(du -sh $TMPDIR/cloudflared.tar.gz | cut -f1)"

# Bundle everything into one timestamped archive
ARCHIVE="$TMPDIR/forge-full-$TIMESTAMP.tar.gz"
tar czf "$ARCHIVE" -C "$TMPDIR" db.dump.gz uploads.tar.gz uptime-kuma.tar.gz cloudflared.tar.gz
TOTAL=$(du -sh "$ARCHIVE" | cut -f1)
log "Total archive: $TOTAL"

# Upload to R2
rclone copy "$ARCHIVE" "$BUCKET/daily/" --s3-no-check-bucket
log "Uploaded to $BUCKET/daily/"

# Weekly copy (Sundays)
if [ "$DOW" = "7" ]; then
  rclone copy "$ARCHIVE" "$BUCKET/weekly/" --s3-no-check-bucket
  log "Uploaded to $BUCKET/weekly/ (weekly)"
fi

# Prune old backups
rclone delete "$BUCKET/daily/"  --min-age 8d  --s3-no-check-bucket 2>/dev/null || true
rclone delete "$BUCKET/weekly/" --min-age 29d --s3-no-check-bucket 2>/dev/null || true

log "=== Backup complete ==="
