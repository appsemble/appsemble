#!/usr/bin/env sh
# Gives the review host and its wildcard CNAME records pointing at the ingress. Appsemble manages
# organization address records. Explicit records keep hosts reachable while DNS-01 challenges create
# empty non-terminals. Pass "delete" to remove the address and CNAME records of the review environment.

set -eu

ID="$1"

# The review ClusterIssuer's deSEC webhook holds the token for the appsemble.review zone.
DESEC_TOKEN=$(kubectl get secret --namespace cert-manager cert-manager-desec-http-secret --output jsonpath='{.data.desec-token}' | base64 -d)

if [ "${2:-}" = delete ]; then
  RRSETS=$(curl -fsS --header "Authorization: Token $DESEC_TOKEN" \
    https://desec.io/api/v1/domains/appsemble.review/rrsets/ |
    jq -c --arg id "$ID" '[.[]
      | select(.subname == $id or (.subname | endswith("." + $id)))
      | select(.type == "CNAME" or .type == "A" or .type == "AAAA")
      | {subname, type, ttl, records: []}]')
  if [ "$RRSETS" = '[]' ]; then
    exit 0
  fi
else
  RRSETS=$(printf '{"subname":"%s","type":"CNAME","ttl":3600,"records":["appsemble.review."]}\n' "$ID" "*.$ID" | jq --slurp .)
fi

printf '%s' "$RRSETS" |
  curl -fsS --retry 5 --request PATCH \
    --header "Authorization: Token $DESEC_TOKEN" \
    --header 'Content-Type: application/json' \
    --data @- \
    https://desec.io/api/v1/domains/appsemble.review/rrsets/ >/dev/null
