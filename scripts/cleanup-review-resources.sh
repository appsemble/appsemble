#!/usr/bin/env sh

set -eu

ACTIVE_IIDS="${KEEP_REVIEW_IIDS:-} ${CI_MERGE_REQUEST_IID:-}"

if [ -n "${CI_API_V4_URL:-}" ] && [ -n "${CI_PROJECT_ID:-}" ]; then
  if [ -n "${CI_JOB_TOKEN:-}" ]; then
    OPEN_IIDS=$(curl -sS --header "JOB-TOKEN: $CI_JOB_TOKEN" "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests?state=opened&per_page=100" | jq -r '.[].iid')
    ACTIVE_IIDS="$ACTIVE_IIDS $OPEN_IIDS"
  elif [ -n "${GITLAB_ACCESS_TOKEN:-}" ]; then
    OPEN_IIDS=$(curl -sS --header "PRIVATE-TOKEN: $GITLAB_ACCESS_TOKEN" "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests?state=opened&per_page=100" | jq -r '.[].iid')
    ACTIVE_IIDS="$ACTIVE_IIDS $OPEN_IIDS"
  fi
fi

ACTIVE_IIDS=$(printf '%s\n' $ACTIVE_IIDS 2>/dev/null | awk '/^[0-9]+$/' | sort -u | tr '\n' ' ')

if [ -z "$ACTIVE_IIDS" ]; then
  echo '[review-cleanup] No active review IIDs detected; skipping cleanup.'
  exit 0
fi

is_active() {
  echo " $ACTIVE_IIDS " | grep -q " $1 "
}

for release in $(helm list -a --short | grep '^review-[0-9][0-9]*$' || true); do
  iid=${release#review-}
  is_active "$iid" && continue
  echo "[review-cleanup] Deleting stale release $release"
  helm delete "$release" --no-hooks || true
  kubectl delete all,ingress,secret,pvc,configmap,serviceaccount,role,rolebinding,networkpolicy --selector "app.kubernetes.io/instance=$release" --ignore-not-found=true || true
done

for namespace in $(kubectl get namespaces --no-headers -o custom-columns=:metadata.name | grep '^companion-containers-review-[0-9][0-9]*$' || true); do
  iid=${namespace#companion-containers-review-}
  is_active "$iid" && continue
  kubectl delete namespace "$namespace" --ignore-not-found=true || true
done

for secret in $(kubectl get secrets --no-headers -o custom-columns=:metadata.name | grep '^review-[0-9][0-9]*-mailpit-tls$' || true); do
  iid=$(printf '%s\n' "$secret" | sed -n 's/^review-\([0-9][0-9]*\)-mailpit-tls$/\1/p')
  is_active "$iid" && continue
  kubectl delete secret "$secret" --ignore-not-found=true || true
done

for secret in $(kubectl get secrets --no-headers -o custom-columns=:metadata.name | grep '^stripe-webhook-secret-[0-9][0-9]*$' || true); do
  iid=${secret#stripe-webhook-secret-}
  is_active "$iid" && continue
  kubectl delete secret "$secret" --ignore-not-found=true || true
done

if [ -n "${STRIPE_API_SECRET_KEY:-}" ] && command -v stripe >/dev/null 2>&1; then
  stripe webhook_endpoints list --limit 100 --api-key "$STRIPE_API_SECRET_KEY" \
    | jq -r '.data[] | [.id, .url] | @tsv' \
    | while IFS='\t' read -r endpoint_id endpoint_url; do
      iid=$(printf '%s\n' "$endpoint_url" | sed -n 's#^https://\([0-9][0-9]*\)\.appsemble\.review/.*#\1#p')
      [ -z "$iid" ] && continue
      is_active "$iid" && continue
      stripe webhook_endpoints delete "$endpoint_id" --api-key "$STRIPE_API_SECRET_KEY" --confirm || true
    done
fi
