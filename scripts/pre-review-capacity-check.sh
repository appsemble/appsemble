#!/usr/bin/env sh

set -eu

MIN_FREE_MEMORY_MI=${REVIEW_MIN_FREE_MEMORY_MI:-2048}

mem_to_mi() {
  value="$1"
  number=$(printf '%s' "$value" | sed -E 's/^([0-9]+).*/\1/')
  unit=$(printf '%s' "$value" | sed -E 's/^[0-9]+(.*)$/\1/')

  case "$unit" in
  Ki)
    awk -v n="$number" 'BEGIN { printf "%.0f", n / 1024 }'
    ;;
  Mi)
    printf '%s\n' "$number"
    ;;
  Gi)
    awk -v n="$number" 'BEGIN { printf "%.0f", n * 1024 }'
    ;;
  Ti)
    awk -v n="$number" 'BEGIN { printf "%.0f", n * 1024 * 1024 }'
    ;;
  '')
    awk -v n="$number" 'BEGIN { printf "%.0f", n / (1024 * 1024) }'
    ;;
  *)
    printf '0\n'
    ;;
  esac
}

ALLOCATABLE_MI=0
for qty in $(kubectl get nodes -o json | jq -r '.items[].status.allocatable.memory'); do
  ALLOCATABLE_MI=$((ALLOCATABLE_MI + $(mem_to_mi "$qty")))
done

REQUESTED_MI=0
for qty in $(kubectl get pods -A -o json | jq -r '.items[] | .spec.containers[]?.resources.requests.memory // empty'); do
  REQUESTED_MI=$((REQUESTED_MI + $(mem_to_mi "$qty")))
done

FREE_MI=$((ALLOCATABLE_MI - REQUESTED_MI))

echo "[review-capacity] Allocatable memory: ${ALLOCATABLE_MI}Mi"
echo "[review-capacity] Requested memory:   ${REQUESTED_MI}Mi"
echo "[review-capacity] Estimated free:     ${FREE_MI}Mi"
echo "[review-capacity] Required minimum:   ${MIN_FREE_MEMORY_MI}Mi"

MEMORY_PRESSURE_NODES=$(kubectl get nodes -o json | jq -r '.items[] | select(any(.status.conditions[]; .type == "MemoryPressure" and .status == "True")) | .metadata.name')

if [ -n "$MEMORY_PRESSURE_NODES" ] || [ "$FREE_MI" -lt "$MIN_FREE_MEMORY_MI" ]; then
  echo '[review-capacity] Not enough cluster memory to safely deploy a new review environment.'

  if [ -n "$MEMORY_PRESSURE_NODES" ]; then
    echo '[review-capacity] Nodes with MemoryPressure=True:'
    printf '%s\n' "$MEMORY_PRESSURE_NODES" | sed 's/^/  - /'
  fi

  echo '[review-capacity] Running review releases:'
  (helm list -a --short | grep '^review-[0-9][0-9]*$' | sed 's/^/  - /') || echo '  - none'

  echo '[review-capacity] Open merge requests to consider closing/stopping:'
  if [ -n "${CI_API_V4_URL:-}" ] && [ -n "${CI_PROJECT_ID:-}" ]; then
    if [ -n "${CI_JOB_TOKEN:-}" ]; then
      curl -sS --header "JOB-TOKEN: $CI_JOB_TOKEN" "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests?state=opened&per_page=100" \
        | jq -r '.[] | "  - !\(.iid): \(.title) -> \(.web_url)"' || true
    elif [ -n "${GITLAB_ACCESS_TOKEN:-}" ]; then
      curl -sS --header "PRIVATE-TOKEN: $GITLAB_ACCESS_TOKEN" "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests?state=opened&per_page=100" \
        | jq -r '.[] | "  - !\(.iid): \(.title) -> \(.web_url)"' || true
    else
      echo '  - unable to query MRs (no API token available in job)'
    fi
  else
    echo '  - unable to query MRs (CI API context missing)'
  fi

  echo '[review-capacity] Action: stop one or more review environments (or close MRs), then retry.'
  exit 1
fi

echo '[review-capacity] Capacity check passed.'
