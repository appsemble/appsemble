#!/usr/bin/env sh

set -eu

delete_cert_manager_tls_secrets() {
  id="$1"
  domain="${APPSEMBLE_REVIEW_DOMAIN:-appsemble.review}"

  kubectl get secrets -o json | jq -r --arg suffix "$id.$domain" '
    def matches_review_domain:
      . == $suffix or endswith("." + $suffix);

    .items[]
    | select(.type == "kubernetes.io/tls")
    | .metadata as $metadata
    | ($metadata.annotations // {}) as $annotations
    | (($annotations["cert-manager.io/alt-names"] // "") | split(",")) as $altNames
    | ($annotations["cert-manager.io/common-name"] // "") as $commonName
    | select(([$commonName] + $altNames) | any(matches_review_domain))
    | $metadata.name
  ' | while read -r secret; do
    [ -n "$secret" ] || continue
    kubectl delete secret "$secret" --ignore-not-found=true || true
  done
}

purge_release() {
  rel="$1"
  id="$2"
  echo "[review-cleanup] deleting $rel ($3)"
  helm delete "$rel" --no-hooks --ignore-not-found || true
  kubectl delete all,cronjob,ingress,certificate,secret,pvc,configmap,serviceaccount,role,rolebinding,networkpolicy --selector "app.kubernetes.io/instance=$rel" --ignore-not-found=true || true
  kubectl delete ingress,certificate,secret --selector "app.kubernetes.io/managed-by=$rel" --ignore-not-found=true || true
  # Drops the helm release record, which is what clears releases wedged in
  # "uninstalling" so they stop counting against the capacity limit.
  kubectl delete secret -l "owner=helm,name=$rel" --ignore-not-found=true || true
  kubectl delete namespace "companion-containers-$rel" --ignore-not-found=true || true
  kubectl delete secret "$rel-mailpit-tls" "$rel-valkey" "$rel-pgbouncer-userlist" "stripe-webhook-secret-$id" --ignore-not-found=true || true
  delete_cert_manager_tls_secrets "$id"
}

if [ -n "${PURGE_REVIEW_IID:-}" ]; then
  purge_release "review-$PURGE_REVIEW_IID" "$PURGE_REVIEW_IID" requested
  exit 0
fi

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

  # Fetch every page. per_page only sets the page size; it does not disable
  # pagination, and this project has thousands of (mostly stopped) review
  # environments, so a single page misses almost all of them.
  gitlab_get_all() {
    page=1
    while [ "$page" -le 500 ]; do
      resp=$(curl -sS --header "$HEADER: $TOKEN" "$1&per_page=100&page=$page" || true)
      [ -z "$resp" ] && break
      n=$(printf '%s' "$resp" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo 0)
      [ "$n" -eq 0 ] && break
      printf '%s\n' "$resp"
      page=$((page + 1))
    done
  }

  if [ -n "$HEADER" ]; then
    ACTIVE="$ACTIVE $(gitlab_get_all "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests?state=opened" | jq -r '.[].iid')"
    KNOWN="$KNOWN $(gitlab_get_all "$CI_API_V4_URL/projects/$CI_PROJECT_ID/environments?search=review/" | jq -r '.[] | .name | capture("^review/(?<id>[0-9]+)$")?.id')"
  fi
fi

ACTIVE=$(printf '%s\n' "$ACTIVE" 2>/dev/null | tr -s '[:space:]' '\n' | awk '/^[0-9]+$/' | sort -u | tr '\n' ' ')
KNOWN=$(printf '%s\n' "$KNOWN" 2>/dev/null | tr -s '[:space:]' '\n' | awk '/^[0-9]+$/' | sort -u | tr '\n' ' ')
[ -z "$KNOWN" ] && echo '[review-cleanup] No known review environments for this project; skipping.' && exit 0
keep() { echo " $ACTIVE " | grep -q " $1 "; }
known() { echo " $KNOWN " | grep -q " $1 "; }

helm list -a -o json | jq -r '.[] | select(.name | test("^review-[0-9][0-9]*$")) | "\(.name) \(.status)"' | while read -r r status; do
  iid=${r#review-}
  keep "$iid" && continue
  case "$status" in
  uninstalling | failed)
    # Stuck mid-teardown or broken: never a live environment, and orphans like
    # these have no matching GitLab environment, so reap regardless of scoping.
    ;;
  *)
    known "$iid" || continue
    ;;
  esac
  purge_release "$r" "$iid" "$status"
done

for n in $(kubectl get namespaces --no-headers -o custom-columns=:metadata.name | grep '^companion-containers-review-[0-9][0-9]*$' || true); do
  iid=${n#companion-containers-review-}
  known "$iid" || continue
  keep "$iid" || kubectl delete namespace "$n" --ignore-not-found=true || true
done

for s in $(kubectl get secrets --no-headers -o custom-columns=:metadata.name | grep -E '^(review-[0-9]+-(mailpit-tls|valkey|pgbouncer-userlist)|stripe-webhook-secret-[0-9]+)$' || true); do
  iid=$(printf '%s\n' "$s" | sed -nE 's/^review-([0-9]+)-(mailpit-tls|valkey|pgbouncer-userlist)$/\1/p; s/^stripe-webhook-secret-([0-9]+)$/\1/p')
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
