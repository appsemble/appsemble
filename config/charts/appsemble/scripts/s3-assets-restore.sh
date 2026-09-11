#!/usr/bin/env sh

set -eu

# Restores app asset buckets from backups created by s3-assets-backup-incremental.sh.
#
# BACKUP_S3_* points at the object storage containing:
#   ${BACKUP_S3_BUCKET}/${BACKUP_PREFIX}/current/app-<id>/...
#   ${BACKUP_S3_BUCKET}/${BACKUP_PREFIX}/snapshots/<yyyy-mm-01>/app-<id>/...
#
# RESTORE_S3_* points at the MinIO/S3 account where app-<id> buckets should be restored.
#
# For convenience, the backup script's original variable names are also accepted:
#   DST_S3_* is used as the backup source fallback.
#   SRC_S3_* is used as the restore target fallback.

BACKUP_REMOTE_NAME="${BACKUP_REMOTE_NAME:-appsemble-assets-backup}"
RESTORE_REMOTE_NAME="${RESTORE_REMOTE_NAME:-appsemble-minio-restore}"

BACKUP_S3_ENDPOINT="${BACKUP_S3_ENDPOINT:-${DST_S3_ENDPOINT:-}}"
BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-${DST_S3_BUCKET:-}}"
BACKUP_S3_ACCESS_KEY="${BACKUP_S3_ACCESS_KEY:-${DST_S3_ACCESS_KEY:-}}"
BACKUP_S3_SECRET_KEY="${BACKUP_S3_SECRET_KEY:-${DST_S3_SECRET_KEY:-}}"
BACKUP_S3_REGION="${BACKUP_S3_REGION:-${DST_S3_REGION:-eu-central-1}}"

RESTORE_S3_ENDPOINT="${RESTORE_S3_ENDPOINT:-${SRC_S3_ENDPOINT:-}}"
RESTORE_S3_ACCESS_KEY="${RESTORE_S3_ACCESS_KEY:-${SRC_S3_ACCESS_KEY:-}}"
RESTORE_S3_SECRET_KEY="${RESTORE_S3_SECRET_KEY:-${SRC_S3_SECRET_KEY:-}}"
RESTORE_S3_REGION="${RESTORE_S3_REGION:-${SRC_S3_REGION:-us-east-1}}"

: "${BACKUP_S3_ENDPOINT:?Please set BACKUP_S3_ENDPOINT or DST_S3_ENDPOINT}"
: "${BACKUP_S3_BUCKET:?Please set BACKUP_S3_BUCKET or DST_S3_BUCKET}"
: "${BACKUP_S3_ACCESS_KEY:?Please set BACKUP_S3_ACCESS_KEY or DST_S3_ACCESS_KEY}"
: "${BACKUP_S3_SECRET_KEY:?Please set BACKUP_S3_SECRET_KEY or DST_S3_SECRET_KEY}"
: "${RESTORE_S3_ENDPOINT:?Please set RESTORE_S3_ENDPOINT or SRC_S3_ENDPOINT}"
: "${RESTORE_S3_ACCESS_KEY:?Please set RESTORE_S3_ACCESS_KEY or SRC_S3_ACCESS_KEY}"
: "${RESTORE_S3_SECRET_KEY:?Please set RESTORE_S3_SECRET_KEY or SRC_S3_SECRET_KEY}"

BACKUP_PREFIX="${BACKUP_PREFIX:-appsemble-assets-prod}"
RESTORE_SOURCE="${RESTORE_SOURCE:-current}"
SNAPSHOT_ID="${SNAPSHOT_ID:-}"
RESTORE_BUCKETS="${RESTORE_BUCKETS:-${BUCKETS:-}}"
CREATE_BUCKETS="${CREATE_BUCKETS:-true}"
DELETE_EXTRA="${DELETE_EXTRA:-false}"
MAX_DELETE="${MAX_DELETE:-2000}"
CHECKERS="${CHECKERS:-16}"
TRANSFERS="${TRANSFERS:-8}"
DRY_RUN="${DRY_RUN:-false}"
VERIFY_AFTER_RESTORE="${VERIFY_AFTER_RESTORE:-true}"

RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_DIR="${LOG_DIR:-/tmp/logs}"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/s3-assets-restore-$RUN_ID.log"
BUCKET_LIST_FILE="$LOG_DIR/s3-assets-restore-buckets-$RUN_ID.txt"

DRY_RUN_FLAG=""
if [ "$DRY_RUN" = "true" ]; then
  DRY_RUN_FLAG="--dry-run"
fi

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
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

case "$RESTORE_SOURCE" in
  current)
    BACKUP_SUBPATH="current"
    ;;
  snapshot)
    : "${SNAPSHOT_ID:?Please set SNAPSHOT_ID, e.g. 2026-05-01}"
    BACKUP_SUBPATH="snapshots/${SNAPSHOT_ID}"
    ;;
  snapshots/*)
    BACKUP_SUBPATH="$RESTORE_SOURCE"
    ;;
  *)
    log "Unsupported RESTORE_SOURCE: $RESTORE_SOURCE"
    log "Use RESTORE_SOURCE=current, RESTORE_SOURCE=snapshot with SNAPSHOT_ID,"
    log "or RESTORE_SOURCE=snapshots/<yyyy-mm-01>."
    exit 1
    ;;
esac

case "$CREATE_BUCKETS" in
  true | false) ;;
  *)
    log "CREATE_BUCKETS must be true or false"
    exit 1
    ;;
esac

case "$DELETE_EXTRA" in
  true | false) ;;
  *)
    log "DELETE_EXTRA must be true or false"
    exit 1
    ;;
esac

case "$DRY_RUN" in
  true | false) ;;
  *)
    log "DRY_RUN must be true or false"
    exit 1
    ;;
esac

case "$VERIFY_AFTER_RESTORE" in
  true | false) ;;
  *)
    log "VERIFY_AFTER_RESTORE must be true or false"
    exit 1
    ;;
esac

if ! printf '%s' "$MAX_DELETE" | grep -Eq '^[0-9]+$'; then
  log "MAX_DELETE must be a non-negative integer"
  exit 1
fi

log "Configuring rclone remotes"
configure_remote \
  "$BACKUP_REMOTE_NAME" \
  "$BACKUP_S3_ENDPOINT" \
  "$BACKUP_S3_ACCESS_KEY" \
  "$BACKUP_S3_SECRET_KEY" \
  "$BACKUP_S3_REGION"
configure_remote \
  "$RESTORE_REMOTE_NAME" \
  "$RESTORE_S3_ENDPOINT" \
  "$RESTORE_S3_ACCESS_KEY" \
  "$RESTORE_S3_SECRET_KEY" \
  "$RESTORE_S3_REGION"

backup_root="${BACKUP_REMOTE_NAME}:${BACKUP_S3_BUCKET}/${BACKUP_PREFIX}/${BACKUP_SUBPATH}"

log "Backup source: ${backup_root}"
log "Restore mode: $(if [ "$DELETE_EXTRA" = "true" ]; then printf 'sync'; else printf 'copy'; fi)"
log "Run id: $RUN_ID"
log "Log file: $LOG_FILE"

if [ -n "$RESTORE_BUCKETS" ]; then
  log "Using requested restore buckets"
  for bucket in $RESTORE_BUCKETS; do
    printf '%s\n' "$bucket"
  done |
    sed 's:/$::' |
    grep -E '^app-[0-9]+$' |
    sort -u >"$BUCKET_LIST_FILE"
else
  log "Discovering app asset buckets in backup source"
  rclone lsf "$backup_root" --dirs-only |
    sed 's:/$::' |
    grep -E '^app-[0-9]+$' |
    sort >"$BUCKET_LIST_FILE"
fi

if [ ! -s "$BUCKET_LIST_FILE" ]; then
  log "No app-* buckets found to restore. Aborting."
  exit 1
fi

BUCKET_COUNT="$(wc -l <"$BUCKET_LIST_FILE" | tr -d ' ')"
log "Restoring ${BUCKET_COUNT} asset buckets"

while IFS= read -r bucket; do
  [ -n "$bucket" ] || continue

  src="${backup_root}/${bucket}"
  dst="${RESTORE_REMOTE_NAME}:${bucket}"

  if [ "$CREATE_BUCKETS" = "true" ] && [ "$DRY_RUN" != "true" ]; then
    log "Ensuring restore bucket exists: ${bucket}"
    rclone mkdir "$dst" \
      --log-file "$LOG_FILE" \
      --log-level INFO
  fi

  log "Restoring bucket ${bucket}"
  if [ "$DELETE_EXTRA" = "true" ]; then
    rclone sync "$src" "$dst" \
      --log-file "$LOG_FILE" \
      --log-level INFO \
      --stats 30s \
      --stats-one-line-date \
      --fast-list \
      --checkers "$CHECKERS" \
      --transfers "$TRANSFERS" \
      --max-delete "$MAX_DELETE" \
      $DRY_RUN_FLAG
  else
    rclone copy "$src" "$dst" \
      --log-file "$LOG_FILE" \
      --log-level INFO \
      --stats 30s \
      --stats-one-line-date \
      --fast-list \
      --checkers "$CHECKERS" \
      --transfers "$TRANSFERS" \
      $DRY_RUN_FLAG
  fi

  if [ "$VERIFY_AFTER_RESTORE" = "true" ] && [ "$DRY_RUN" != "true" ]; then
    log "Verifying bucket ${bucket}"
    if [ "$DELETE_EXTRA" = "true" ]; then
      rclone check "$src" "$dst" \
        --log-file "$LOG_FILE" \
        --log-level INFO \
        --stats 30s \
        --stats-one-line-date \
        --fast-list \
        --size-only
    else
      rclone check "$src" "$dst" \
        --log-file "$LOG_FILE" \
        --log-level INFO \
        --stats 30s \
        --stats-one-line-date \
        --fast-list \
        --one-way \
        --size-only
    fi
  fi
done <"$BUCKET_LIST_FILE"

log "Restore run complete"
log "Bucket list: $BUCKET_LIST_FILE"
