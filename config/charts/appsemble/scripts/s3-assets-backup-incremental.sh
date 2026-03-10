#!/usr/bin/env sh

set -eu

SRC_REMOTE_NAME="${SRC_REMOTE_NAME:-appsemble-minio-src}"
DST_REMOTE_NAME="${DST_REMOTE_NAME:-appsemble-assets-dst}"

SRC_S3_ENDPOINT="${SRC_S3_ENDPOINT:?Please set SRC_S3_ENDPOINT, e.g. https://api.minio.appsemble.app}"
SRC_S3_ACCESS_KEY="${SRC_S3_ACCESS_KEY:?Please set SRC_S3_ACCESS_KEY}"
SRC_S3_SECRET_KEY="${SRC_S3_SECRET_KEY:?Please set SRC_S3_SECRET_KEY}"
SRC_S3_REGION="${SRC_S3_REGION:-us-east-1}"

DST_S3_ENDPOINT="${DST_S3_ENDPOINT:?Please set DST_S3_ENDPOINT}"
DST_S3_BUCKET="${DST_S3_BUCKET:?Please set DST_S3_BUCKET}"
DST_S3_ACCESS_KEY="${DST_S3_ACCESS_KEY:?Please set DST_S3_ACCESS_KEY}"
DST_S3_SECRET_KEY="${DST_S3_SECRET_KEY:?Please set DST_S3_SECRET_KEY}"
DST_S3_REGION="${DST_S3_REGION:-eu-central-1}"

BACKUP_PREFIX="${BACKUP_PREFIX:-appsemble-assets-prod}"
ARCHIVE_RETENTION_DAYS="${ARCHIVE_RETENTION_DAYS:-90}"
MAX_DELETE="${MAX_DELETE:-2000}"
CHECKERS="${CHECKERS:-16}"
TRANSFERS="${TRANSFERS:-8}"
DRY_RUN="${DRY_RUN:-false}"
VERIFY_AFTER_SYNC="${VERIFY_AFTER_SYNC:-true}"
ENABLE_MONTHLY_FULL_SNAPSHOT="${ENABLE_MONTHLY_FULL_SNAPSHOT:-true}"
FULL_SNAPSHOT_DAY="${FULL_SNAPSHOT_DAY:-1}"
FULL_SNAPSHOT_RETENTION_MONTHS="${FULL_SNAPSHOT_RETENTION_MONTHS:-12}"

RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
FULL_SNAPSHOT_ID="$(date -u +%Y-%m-01)"
CURRENT_DAY_NUMBER="$(date -u +%d | sed 's/^0*//')"
if [ -z "$CURRENT_DAY_NUMBER" ]; then
  CURRENT_DAY_NUMBER="0"
fi

LOG_DIR="${LOG_DIR:-/tmp/logs}"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/s3-assets-backup-$RUN_ID.log"
BUCKET_LIST_FILE="$LOG_DIR/s3-assets-buckets-$RUN_ID.txt"

DRY_RUN_FLAG=""
if [ "$DRY_RUN" = "true" ]; then
  DRY_RUN_FLAG="--dry-run"
fi

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

is_before() {
  left="$1"
  right="$2"

  [ "$left" != "$right" ] &&
    [ "$(printf '%s\n%s\n' "$left" "$right" | LC_ALL=C sort | head -n1)" = "$left" ]
}

configure_remote() {
  name="$1"
  endpoint="$2"
  access_key="$3"
  secret_key="$4"
  region="$5"

  rclone config delete "$name" >/dev/null 2>&1 || true
  rclone config create "$name" s3 \
    provider Other \
    env_auth false \
    endpoint "$endpoint" \
    access_key_id "$access_key" \
    secret_access_key "$secret_key" \
    region "$region" \
    --non-interactive \
    >/dev/null
}

log "Configuring rclone remotes"
configure_remote "$SRC_REMOTE_NAME" "$SRC_S3_ENDPOINT" "$SRC_S3_ACCESS_KEY" "$SRC_S3_SECRET_KEY" "$SRC_S3_REGION"
configure_remote "$DST_REMOTE_NAME" "$DST_S3_ENDPOINT" "$DST_S3_ACCESS_KEY" "$DST_S3_SECRET_KEY" "$DST_S3_REGION"

log "Discovering source buckets"
rclone lsf "${SRC_REMOTE_NAME}:" --dirs-only |
  sed 's:/$::' |
  grep -E '^app-[0-9]+$' |
  sort >"$BUCKET_LIST_FILE"

if [ ! -s "$BUCKET_LIST_FILE" ]; then
  log "No app-* buckets found. Aborting."
  exit 1
fi

BUCKET_COUNT="$(wc -l < "$BUCKET_LIST_FILE" | tr -d ' ')"
log "Found ${BUCKET_COUNT} asset buckets"
log "Run id: $RUN_ID"
log "Log file: $LOG_FILE"

while IFS= read -r bucket; do
  [ -n "$bucket" ] || continue

  src="${SRC_REMOTE_NAME}:${bucket}"
  dst_current="${DST_REMOTE_NAME}:${DST_S3_BUCKET}/${BACKUP_PREFIX}/current/${bucket}"
  dst_archive="${DST_REMOTE_NAME}:${DST_S3_BUCKET}/${BACKUP_PREFIX}/archive/${RUN_ID}/${bucket}"

  log "Syncing bucket ${bucket}"
  rclone sync "$src" "$dst_current" \
    --log-file "$LOG_FILE" \
    --log-level INFO \
    --stats 30s \
    --stats-one-line-date \
    --fast-list \
    --backup-dir "$dst_archive" \
    --checkers "$CHECKERS" \
    --transfers "$TRANSFERS" \
    --max-delete "$MAX_DELETE" \
    $DRY_RUN_FLAG

  if [ "$VERIFY_AFTER_SYNC" = "true" ] && [ "$DRY_RUN" != "true" ]; then
    log "Verifying bucket ${bucket}"
    rclone check "$src" "$dst_current" \
      --log-file "$LOG_FILE" \
      --log-level INFO \
      --stats 30s \
      --stats-one-line-date \
      --fast-list \
      --one-way \
      --size-only
  fi
done <"$BUCKET_LIST_FILE"

if [ "$DRY_RUN" != "true" ] && [ "$ENABLE_MONTHLY_FULL_SNAPSHOT" = "true" ] && [ "$CURRENT_DAY_NUMBER" -eq "$FULL_SNAPSHOT_DAY" ]; then
  snapshot_src="${DST_REMOTE_NAME}:${DST_S3_BUCKET}/${BACKUP_PREFIX}/current"
  snapshot_dst="${DST_REMOTE_NAME}:${DST_S3_BUCKET}/${BACKUP_PREFIX}/snapshots/${FULL_SNAPSHOT_ID}"

  log "Creating monthly full snapshot: ${FULL_SNAPSHOT_ID}"
  rclone copy "$snapshot_src" "$snapshot_dst" \
    --log-file "$LOG_FILE" \
    --log-level INFO \
    --stats 30s \
    --stats-one-line-date \
    --fast-list \
    --checkers "$CHECKERS" \
    --transfers "$TRANSFERS" \
    --ignore-existing
fi

if [ "$DRY_RUN" != "true" ] && printf '%s' "$ARCHIVE_RETENTION_DAYS" | grep -Eq '^[0-9]+$' && [ "$ARCHIVE_RETENTION_DAYS" -gt 0 ]; then
  cutoff_archive="$(date -u -d "${ARCHIVE_RETENTION_DAYS} days ago" +%Y%m%dT%H%M%SZ)"
  archive_root="${DST_REMOTE_NAME}:${DST_S3_BUCKET}/${BACKUP_PREFIX}/archive"

  log "Pruning archive directories older than $ARCHIVE_RETENTION_DAYS days (cutoff: $cutoff_archive)"
  rclone lsf "$archive_root" --dirs-only 2>/dev/null |
    sed 's:/$::' |
    while IFS= read -r run_dir; do
      [ -n "$run_dir" ] || continue
      if printf '%s' "$run_dir" | grep -Eq '^[0-9]{8}T[0-9]{6}Z$' && is_before "$run_dir" "$cutoff_archive"; then
        log "Pruning archive run ${run_dir}"
        rclone purge "${archive_root}/${run_dir}" \
          --log-file "$LOG_FILE" \
          --log-level INFO \
          --stats 30s \
          --stats-one-line-date \
          --fast-list \
          $DRY_RUN_FLAG
      fi
    done
fi

if [ "$DRY_RUN" != "true" ] && printf '%s' "$FULL_SNAPSHOT_RETENTION_MONTHS" | grep -Eq '^[0-9]+$' && [ "$FULL_SNAPSHOT_RETENTION_MONTHS" -gt 0 ]; then
  cutoff_snapshot="$(date -u -d "${FULL_SNAPSHOT_RETENTION_MONTHS} months ago" +%Y-%m-01)"
  snapshot_root="${DST_REMOTE_NAME}:${DST_S3_BUCKET}/${BACKUP_PREFIX}/snapshots"

  log "Pruning monthly snapshots older than $FULL_SNAPSHOT_RETENTION_MONTHS months (cutoff: $cutoff_snapshot)"
  rclone lsf "$snapshot_root" --dirs-only 2>/dev/null |
    sed 's:/$::' |
    while IFS= read -r snapshot_dir; do
      [ -n "$snapshot_dir" ] || continue
      if printf '%s' "$snapshot_dir" | grep -Eq '^[0-9]{4}-[0-9]{2}-01$' && is_before "$snapshot_dir" "$cutoff_snapshot"; then
        log "Pruning monthly snapshot ${snapshot_dir}"
        rclone purge "${snapshot_root}/${snapshot_dir}" \
          --log-file "$LOG_FILE" \
          --log-level INFO \
          --stats 30s \
          --stats-one-line-date \
          --fast-list \
          $DRY_RUN_FLAG
      fi
    done
fi

log "Backup run complete"
log "Bucket list: $BUCKET_LIST_FILE"
