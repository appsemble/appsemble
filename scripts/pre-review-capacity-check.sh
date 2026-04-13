#!/usr/bin/env sh

set -eu

MIN_FREE_MI=${REVIEW_MIN_FREE_MEMORY_MI:-2048}
HARD_MAX_ACTIVE=${REVIEW_HARD_MAX_ACTIVE:-8}
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
  *) echo 0 ;;
  esac
}

active_releases=$(helm list -a -o json | jq '[.[] | select(.name | test("^review-[0-9][0-9]*$")) | {name, status}]')
active_count=$(printf '%s\n' "$active_releases" | jq 'length')
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
for memory in $(kubectl get pods -A -o json | jq -r '.items[] | select(.status.phase == "Pending" or .status.phase == "Running") | .spec.containers[]?.resources.requests.memory // empty'); do
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

echo '[review-capacity] Capacity check passed.'
