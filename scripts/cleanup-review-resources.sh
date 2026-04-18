#!/usr/bin/env sh

set -eu

ACTIVE="${KEEP_REVIEW_IIDS:-} ${CI_MERGE_REQUEST_IID:-}"
KNOWN="$ACTIVE"

if [ -n "${CI_API_V4_URL:-}" ] && [ -n "${CI_PROJECT_ID:-}" ]; then
  if [ -n "${CI_JOB_TOKEN:-}" ]; then
    HEADER='JOB-TOKEN'
    TOKEN="$CI_JOB_TOKEN"
  elif [ -n "${GITLAB_ACCESS_TOKEN:-}" ]; then
    HEADER='PRIVATE-TOKEN'
    TOKEN="$GITLAB_ACCESS_TOKEN"
  else
    HEADER=''
    TOKEN=''
  fi

  if [ -n "$HEADER" ]; then
    ACTIVE="$ACTIVE $(curl -sS --header "$HEADER: $TOKEN" "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests?state=opened&per_page=100" | jq -r '.[].iid')"
    KNOWN="$KNOWN $(curl -sS --header "$HEADER: $TOKEN" "$CI_API_V4_URL/projects/$CI_PROJECT_ID/environments?search=review/&per_page=100" | jq -r '.[] | .name | capture("^review/(?<id>[0-9]+)$")?.id')"
  fi
fi

ACTIVE=$(printf '%s\n' "$ACTIVE" 2>/dev/null | tr -s '[:space:]' '\n' | awk '/^[0-9]+$/' | sort -u | tr '\n' ' ')
KNOWN=$(printf '%s\n' "$KNOWN" 2>/dev/null | tr -s '[:space:]' '\n' | awk '/^[0-9]+$/' | sort -u | tr '\n' ' ')
[ -z "$KNOWN" ] && echo '[review-cleanup] No known review environments for this project; skipping.' && exit 0
keep() { echo " $ACTIVE " | grep -q " $1 "; }
known() { echo " $KNOWN " | grep -q " $1 "; }

for r in $(helm list -a --short | grep '^review-[0-9][0-9]*$' || true); do
  iid=${r#review-}
  known "$iid" || continue
  keep "$iid" && continue
  echo "[review-cleanup] deleting $r"
  helm delete "$r" --no-hooks --ignore-not-found || true
  kubectl delete all,cronjob,ingress,certificate,secret,pvc,configmap,serviceaccount,role,rolebinding,networkpolicy --selector "app.kubernetes.io/instance=$r" --ignore-not-found=true || true
  kubectl delete ingress,certificate,secret --selector "app.kubernetes.io/managed-by=$r" --ignore-not-found=true || true
  kubectl delete secret -l "owner=helm,name=$r" --ignore-not-found=true || true
done

for n in $(kubectl get namespaces --no-headers -o custom-columns=:metadata.name | grep '^companion-containers-review-[0-9][0-9]*$' || true); do
  iid=${n#companion-containers-review-}
  known "$iid" || continue
  keep "$iid" || kubectl delete namespace "$n" --ignore-not-found=true || true
done

for s in $(kubectl get secrets --no-headers -o custom-columns=:metadata.name | grep -E '^(review-[0-9]+-mailpit-tls|stripe-webhook-secret-[0-9]+)$' || true); do
  iid=$(printf '%s\n' "$s" | sed -nE 's/^review-([0-9]+)-mailpit-tls$/\1/p; s/^stripe-webhook-secret-([0-9]+)$/\1/p')
  [ -n "$iid" ] || continue
  known "$iid" || continue
  keep "$iid" && continue
  kubectl delete secret "$s" --ignore-not-found=true || true
done

if [ -n "${STRIPE_API_SECRET_KEY:-}" ] && command -v stripe >/dev/null 2>&1; then
  TAB=$(printf '\t')
  stripe webhook_endpoints list --limit 100 --api-key "$STRIPE_API_SECRET_KEY" | jq -r '.data[] | [.id, .url] | @tsv' |
    while IFS="$TAB" read -r id url; do
      iid=$(printf '%s\n' "$url" | sed -n 's#^https://\([0-9][0-9]*\)\.appsemble\.review/.*#\1#p')
      [ -n "$iid" ] || continue
      known "$iid" || continue
      keep "$iid" || stripe webhook_endpoints delete "$id" --api-key "$STRIPE_API_SECRET_KEY" --confirm || true
    done
fi
