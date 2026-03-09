#!/usr/bin/env sh

set -eu

log() {
  printf '[review-cleanup] %s\n' "$*"
}

is_numeric() {
  case "$1" in
  '' | *[!0-9]*)
    return 1
    ;;
  *)
    return 0
    ;;
  esac
}

contains_iid() {
  candidate="$1"
  for active in $ACTIVE_IIDS; do
    if [ "$active" = "$candidate" ]; then
      return 0
    fi
  done

  return 1
}

append_iids() {
  for iid in $1; do
    if is_numeric "$iid"; then
      ACTIVE_IIDS="$ACTIVE_IIDS $iid"
    fi
  done
}

fetch_open_merge_request_iids() {
  if [ -z "${CI_API_V4_URL:-}" ] || [ -z "${CI_PROJECT_ID:-}" ]; then
    log 'Skipping MR lookup: CI_API_V4_URL or CI_PROJECT_ID not set.'
    return 1
  fi

  auth_header=''
  auth_value=''
  if [ -n "${CI_JOB_TOKEN:-}" ]; then
    auth_header='JOB-TOKEN'
    auth_value="$CI_JOB_TOKEN"
  elif [ -n "${GITLAB_ACCESS_TOKEN:-}" ]; then
    auth_header='PRIVATE-TOKEN'
    auth_value="$GITLAB_ACCESS_TOKEN"
  else
    log 'Skipping MR lookup: no CI_JOB_TOKEN or GITLAB_ACCESS_TOKEN.'
    return 1
  fi

  page=1
  while :; do
    response=$(curl --silent --show-error --header "$auth_header: $auth_value" \
      "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests?state=opened&per_page=100&page=$page") || {
      log "Failed to query open merge requests on page $page."
      return 1
    }

    iids=$(printf '%s' "$response" | jq -r '.[].iid')
    if [ -z "$iids" ]; then
      break
    fi

    append_iids "$iids"

    count=$(printf '%s\n' "$iids" | wc -l | tr -d ' ')
    if [ "$count" -lt 100 ]; then
      break
    fi

    page=$((page + 1))
  done

  return 0
}

cleanup_review_iid() {
  iid="$1"
  release="review-$iid"

  log "Cleaning stale review resources for IID $iid"

  helm delete "$release" --no-hooks || true
  kubectl delete all,ingress,secret,pvc,configmap,serviceaccount,role,rolebinding,networkpolicy \
    --selector "app.kubernetes.io/instance=$release" --ignore-not-found=true || true
  kubectl delete namespace "companion-containers-review-$iid" --ignore-not-found=true || true
  kubectl delete ingress "$release" --ignore-not-found=true || true
  kubectl delete secret "$release-mailpit-tls" --ignore-not-found=true || true
  kubectl delete secret "stripe-webhook-secret-$iid" --ignore-not-found=true || true
}

cleanup_stripe_webhooks() {
  if [ -z "${STRIPE_API_SECRET_KEY:-}" ]; then
    log 'Skipping Stripe webhook cleanup: STRIPE_API_SECRET_KEY is not set.'
    return
  fi

  if ! command -v stripe >/dev/null 2>&1; then
    log 'Skipping Stripe webhook cleanup: stripe CLI is not installed.'
    return
  fi

  stripe webhook_endpoints list --limit 100 --api-key "$STRIPE_API_SECRET_KEY" \
    | jq -r '.data[] | [.id, .url] | @tsv' \
    | while IFS='\t' read -r endpoint_id endpoint_url; do
      iid=$(printf '%s\n' "$endpoint_url" | sed -n 's#^https://\([0-9][0-9]*\)\.appsemble\.review/.*#\1#p')
      if [ -z "$iid" ]; then
        continue
      fi

      if contains_iid "$iid"; then
        continue
      fi

      log "Deleting stale Stripe webhook endpoint $endpoint_id for IID $iid"
      stripe webhook_endpoints delete "$endpoint_id" --api-key "$STRIPE_API_SECRET_KEY" --confirm || true
    done
}

ACTIVE_IIDS=''

if [ -n "${KEEP_REVIEW_IIDS:-}" ]; then
  append_iids "$KEEP_REVIEW_IIDS"
fi

FETCH_OK=0
if fetch_open_merge_request_iids; then
  FETCH_OK=1
fi

if [ -n "${CI_MERGE_REQUEST_IID:-}" ] && is_numeric "$CI_MERGE_REQUEST_IID"; then
  ACTIVE_IIDS="$ACTIVE_IIDS $CI_MERGE_REQUEST_IID"
fi

if [ "$FETCH_OK" -ne 1 ] && [ -z "${KEEP_REVIEW_IIDS:-}" ] && [ -z "${CI_MERGE_REQUEST_IID:-}" ]; then
  log 'No reliable active MR list available; skipping cleanup to avoid accidental deletion.'
  exit 0
fi

ACTIVE_IIDS=$(printf '%s\n' $ACTIVE_IIDS 2>/dev/null | awk '/^[0-9]+$/' | sort -u | tr '\n' ' ')
log "Active review IIDs: ${ACTIVE_IIDS:-<none>}"

releases=$(helm list -a --short | grep '^review-' || true)
for release in $releases; do
  iid=${release#review-}
  if ! is_numeric "$iid"; then
    continue
  fi

  if contains_iid "$iid"; then
    continue
  fi

  cleanup_review_iid "$iid"
done

companion_namespaces=$(kubectl get namespaces --no-headers -o custom-columns=:metadata.name | grep '^companion-containers-review-' || true)
for namespace in $companion_namespaces; do
  iid=${namespace#companion-containers-review-}
  if ! is_numeric "$iid"; then
    continue
  fi

  if contains_iid "$iid"; then
    continue
  fi

  log "Deleting stale companion namespace $namespace"
  kubectl delete namespace "$namespace" --ignore-not-found=true || true
done

mailpit_secrets=$(kubectl get secrets --no-headers -o custom-columns=:metadata.name | grep '^review-[0-9][0-9]*-mailpit-tls$' || true)
for secret in $mailpit_secrets; do
  iid=$(printf '%s\n' "$secret" | sed -n 's/^review-\([0-9][0-9]*\)-mailpit-tls$/\1/p')
  if [ -z "$iid" ]; then
    continue
  fi

  if contains_iid "$iid"; then
    continue
  fi

  log "Deleting stale Mailpit TLS secret $secret"
  kubectl delete secret "$secret" --ignore-not-found=true || true
done

stripe_secrets=$(kubectl get secrets --no-headers -o custom-columns=:metadata.name | grep '^stripe-webhook-secret-' || true)
for secret in $stripe_secrets; do
  iid=${secret#stripe-webhook-secret-}
  if ! is_numeric "$iid"; then
    continue
  fi

  if contains_iid "$iid"; then
    continue
  fi

  log "Deleting stale Stripe secret $secret"
  kubectl delete secret "$secret" --ignore-not-found=true || true
done

cleanup_stripe_webhooks

log 'Cleanup completed.'
