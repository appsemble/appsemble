#!/usr/bin/env sh

set -eu

MIN_FREE_MI=${REVIEW_MIN_FREE_MEMORY_MI:-2048}

to_mi() {
  v="$1"
  case "$v" in
  *Ki) echo $(( ${v%Ki} / 1024 )) ;;
  *Mi) echo "${v%Mi}" ;;
  *Gi) echo $(( ${v%Gi} * 1024 )) ;;
  *Ti) echo $(( ${v%Ti} * 1024 * 1024 )) ;;
  *) echo 0 ;;
  esac
}

alloc=0
for m in $(kubectl get nodes -o json | jq -r '.items[].status.allocatable.memory'); do alloc=$((alloc + $(to_mi "$m"))); done
req=0
for m in $(kubectl get pods -A -o json | jq -r '.items[] | .spec.containers[]?.resources.requests.memory // empty'); do req=$((req + $(to_mi "$m"))); done
free=$((alloc - req))
pressure=$(kubectl get nodes -o json | jq -r '.items[] | select(any(.status.conditions[]; .type=="MemoryPressure" and .status=="True")) | .metadata.name')

echo "[review-capacity] alloc=${alloc}Mi req=${req}Mi free=${free}Mi min=${MIN_FREE_MI}Mi"

if [ -n "$pressure" ] || [ "$free" -lt "$MIN_FREE_MI" ]; then
  echo '[review-capacity] Not enough memory for a new review deploy.'
  [ -n "$pressure" ] && { echo '[review-capacity] MemoryPressure nodes:'; printf '%s\n' "$pressure" | sed 's/^/  - /'; }
  echo '[review-capacity] Running review releases:'
  (helm list -a --short | grep '^review-[0-9][0-9]*$' | sed 's/^/  - /') || echo '  - none'
  echo '[review-capacity] Open MRs to consider closing/stopping:'
  if [ -n "${CI_API_V4_URL:-}" ] && [ -n "${CI_PROJECT_ID:-}" ] && [ -n "${CI_JOB_TOKEN:-}${GITLAB_ACCESS_TOKEN:-}" ]; then
    hdr=''; tok=''
    [ -n "${CI_JOB_TOKEN:-}" ] && { hdr='JOB-TOKEN'; tok="$CI_JOB_TOKEN"; } || { hdr='PRIVATE-TOKEN'; tok="$GITLAB_ACCESS_TOKEN"; }
    curl -sS --header "$hdr: $tok" "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests?state=opened&per_page=100" | jq -r '.[] | "  - !\(.iid): \(.title) -> \(.web_url)"' || true
  else
    echo '  - unable to query MR list'
  fi
  exit 1
fi

echo '[review-capacity] Capacity check passed.'
