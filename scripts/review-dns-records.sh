#!/usr/bin/env sh
# Gives the review host and its wildcard A records pointing at the ingress. Appsemble manages
# organization address records. Explicit records keep hosts reachable while DNS-01 challenges create
# empty non-terminals. Pass "delete" to remove the address records of the review environment.

set -eu

ID="$1"

# The token may write only A and AAAA records in the appsemble.review zone.
DESEC_TOKEN=$(kubectl get secret --namespace default appsemble-review-dns --output jsonpath='{.data.dns-token}' | base64 -d)

if [ "${2:-}" = delete ]; then
  RRSETS=$(curl -fsS --header "Authorization: Token $DESEC_TOKEN" \
    https://desec.io/api/v1/domains/appsemble.review/rrsets/ |
    jq -c --arg id "$ID" '[.[]
      | select(.subname == $id or (.subname | endswith("." + $id)))
      | select(.type == "A" or .type == "AAAA")
      | {subname, type, ttl, records: []}]')
  if [ "$RRSETS" = '[]' ]; then
    exit 0
  fi
else
  # IPv4 only, like the zone apex, which has no AAAA record.
  IP=$(kubectl get service --namespace ingress-nginx ingress-nginx-controller --output json |
    jq -er '.status.loadBalancer.ingress[].ip | select(contains(":") | not)')
  RRSETS=$(printf '{"subname":"%s","type":"A","ttl":3600,"records":["%s"]}\n' "$ID" "$IP" "*.$ID" "$IP" | jq --slurp .)
fi

# deSEC counts every request against a daily limit, so retry at most once, and only if Retry-After
# fits in a minute. curl --fail exits 0 when Retry-After is too long to retry, so check the status.
RESPONSE=$(mktemp)
STATUS=$(printf '%s' "$RRSETS" |
  curl -sS --retry 1 --retry-max-time 60 --request PATCH \
    --header "Authorization: Token $DESEC_TOKEN" \
    --header 'Content-Type: application/json' \
    --data @- \
    --output "$RESPONSE" \
    --write-out '%{http_code}' \
    https://desec.io/api/v1/domains/appsemble.review/rrsets/)
if [ "$STATUS" != 200 ]; then
  echo "deSEC returned HTTP $STATUS: $(cat "$RESPONSE")" >&2
  if grep -q CNAME "$RESPONSE"; then
    echo "A CNAME record blocks the A records of $ID.appsemble.review. The review DNS token cannot delete CNAME records, so a deSEC account administrator has to remove it." >&2
  fi
  exit 1
fi
