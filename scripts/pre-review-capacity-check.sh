#!/usr/bin/env sh

set -eu

MIN_FREE_MI=${REVIEW_MIN_FREE_MEMORY_MI:-2048}
HARD_MAX_ACTIVE=${REVIEW_HARD_MAX_ACTIVE:-8}
# Hetzner Cloud attaches at most 16 volumes per server; each review needs two
# (postgresql + minio). Detached volumes do not count, so this guards the real
# per-node limit that memory checks miss.
MAX_VOLUMES_PER_NODE=${REVIEW_MAX_VOLUMES_PER_NODE:-16}
NEW_REVIEW_VOLUMES=${REVIEW_NEW_VOLUMES:-2}
CURRENT_IID=${CI_MERGE_REQUEST_IID:-}
CURRENT_RELEASE=''

if [ -n "$CURRENT_IID" ]; then
  CURRENT_RELEASE="review-$CURRENT_IID"
fi

fetch_open_mrs() {
  if [ -n "${CI_API_V4_URL:-}" ] && [ -n "${CI_PROJECT_ID:-}" ] && [ -n "${CI_JOB_TOKEN:-}${GITLAB_ACCESS_TOKEN:-}" ]; then
    if [ -n "${CI_JOB_TOKEN:-}" ]; then
      hdr='JOB-TOKEN'
      tok="$CI_JOB_TOKEN"
    else
      hdr='PRIVATE-TOKEN'
      tok="$GITLAB_ACCESS_TOKEN"
    fi

    curl -sS --header "$hdr: $tok" "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests?state=opened&per_page=100"
    return
  fi

  echo '[]'
}

print_open_mrs() {
  open_mrs=$(fetch_open_mrs)

  echo '[review-capacity] Open MRs to consider closing/stopping:'
  if [ "$open_mrs" = '[]' ]; then
    echo '  - unable to query MR list'
    return
  fi

  printf '%s\n' "$open_mrs" | jq -r '.[] | "  - !\(.iid): \(.title) -> \(.web_url)"' || true
}

print_running_releases() {
  count=$(printf '%s\n' "$active_releases" | jq 'length')

  echo '[review-capacity] Running review releases:'
  if [ "$count" -eq 0 ]; then
    echo '  - none'
    return
  fi

  printf '%s\n' "$active_releases" | jq -r '.[] | "  - \(.name) [\(.status)]"' || true
}

fail_capacity() {
  reason="$1"

  echo "$reason"
  print_running_releases
  print_open_mrs
  exit 1
}

to_mi() {
  v="$1"
  case "$v" in
  *Ki) echo $((${v%Ki} / 1024)) ;;
  *Mi) echo "${v%Mi}" ;;
  *Gi) echo $((${v%Gi} * 1024)) ;;
  *Ti) echo $((${v%Ti} * 1024 * 1024)) ;;
  *Pi) echo $((${v%Pi} * 1024 * 1024 * 1024)) ;;
  *k) echo $((${v%k} * 1000 / 1048576)) ;;
  *M) echo $((${v%M} * 1000000 / 1048576)) ;;
  *G) echo $((${v%G} * 1000000000 / 1048576)) ;;
  *T) echo $((${v%T} * 1000000000000 / 1048576)) ;;
  '' | *[!0-9]*) echo 0 ;;
  *) echo $((v / 1048576)) ;;
  esac
}

active_releases=$(helm list -a -o json | jq '[.[] | select(.name | test("^review-[0-9][0-9]*$")) | {name, status}]')
# Only live or in-progress releases occupy a review slot. Releases stuck in
# uninstalling/failed do not, and must not block new deploys against the cap.
active_count=$(printf '%s\n' "$active_releases" | jq '[.[] | select(.status == "deployed" or .status == "pending-install" or .status == "pending-upgrade")] | length')
current_release_exists='false'
if [ -n "$CURRENT_RELEASE" ] && printf '%s\n' "$active_releases" | jq -e --arg current "$CURRENT_RELEASE" 'any(.[]; .name == $current)' >/dev/null; then
  current_release_exists='true'
fi

echo "[review-capacity] active=$active_count hard-max=$HARD_MAX_ACTIVE current-release-exists=$current_release_exists"

if [ "$current_release_exists" != 'true' ] && [ "$active_count" -ge "$HARD_MAX_ACTIVE" ]; then
  fail_capacity "[review-capacity] Review deploy blocked. Active review releases ($active_count) reached the hard limit ($HARD_MAX_ACTIVE)."
fi

alloc=0
for memory in $(kubectl get nodes -o json | jq -r '.items[].status.allocatable.memory'); do
  alloc=$((alloc + $(to_mi "$memory")))
done

req=0
# Only pods bound to a node hold node memory. Unschedulable Pending pods (no
# nodeName) consume nothing, and counting them lets a stuck or mid-teardown pod
# inflate the total far past cluster capacity and falsely block deploys.
for memory in $(kubectl get pods -A -o json | jq -r '.items[] | select((.status.phase == "Pending" or .status.phase == "Running") and (.spec.nodeName // "") != "") | .spec.containers[]?.resources.requests.memory // empty'); do
  req=$((req + $(to_mi "$memory")))
done

free=$((alloc - req))
pressure=$(kubectl get nodes -o json | jq -r '.items[] | select(any(.status.conditions[]; .type=="MemoryPressure" and .status=="True")) | .metadata.name')

echo "[review-capacity] alloc=${alloc}Mi req=${req}Mi free=${free}Mi min=${MIN_FREE_MI}Mi"

if [ -n "$pressure" ] || [ "$free" -lt "$MIN_FREE_MI" ]; then
  reason='[review-capacity] Not enough memory for a new review deploy.'

  if [ -n "$pressure" ]; then
    reason="$reason MemoryPressure detected."
    echo '[review-capacity] MemoryPressure nodes:'
    printf '%s\n' "$pressure" | sed 's/^/  - /'
  fi

  fail_capacity "$reason"
fi

# Volume-attach capacity. A new review's postgresql and minio PVCs can only be
# created if the worker nodes still have free volume-attach slots; otherwise the
# pods hang in ContainerCreating and the deploy times out with no clear cause.
attachments=$(kubectl get volumeattachments -o json)
vol_free=0
for node in $(kubectl get nodes -o json | jq -r '.items[] | select(.metadata.labels["node-role.kubernetes.io/control-plane"] == null) | .metadata.name'); do
  attached=$(printf '%s' "$attachments" | jq --arg n "$node" '[.items[] | select(.spec.nodeName == $n and .status.attached == true)] | length')
  node_free=$((MAX_VOLUMES_PER_NODE - attached))
  [ "$node_free" -lt 0 ] && node_free=0
  vol_free=$((vol_free + node_free))
done

echo "[review-capacity] volume-attach free=${vol_free} need=${NEW_REVIEW_VOLUMES} max-per-node=${MAX_VOLUMES_PER_NODE}"

if [ "$current_release_exists" != 'true' ] && [ "$vol_free" -lt "$NEW_REVIEW_VOLUMES" ]; then
  fail_capacity "[review-capacity] Not enough Hetzner volume-attach slots for a new review deploy (free=${vol_free}, need=${NEW_REVIEW_VOLUMES})."
fi

echo '[review-capacity] Capacity check passed.'
