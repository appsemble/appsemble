#!/usr/bin/env sh
# Gives a review environment explicit DNS records: its host, its appsemble organization and the
# wildcards below both, as CNAMEs to the review ingress. Pass "delete" as the second argument to
# remove them. cert-manager's DNS-01 challenge records below a host make it an empty non-terminal,
# which the *.appsemble.review wildcard does not answer for, so without these records the review
# and app hosts stop resolving while their certificates are issued.

set -eu

ID="$1"
RECORDS='["appsemble.review."]'
if [ "${2:-}" = delete ]; then
  RECORDS='[]'
fi

# The review ClusterIssuer's deSEC webhook holds the token for the appsemble.review zone.
DESEC_TOKEN=$(kubectl get secret --namespace cert-manager cert-manager-desec-http-secret --output jsonpath='{.data.desec-token}' | base64 -d)

for name in "$ID" "appsemble.$ID"; do
  printf '{"subname":"%s","type":"CNAME","ttl":3600,"records":%s}\n' "$name" "$RECORDS" "*.$name" "$RECORDS"
done |
  jq --slurp . |
  curl -fsS --retry 5 --request PATCH \
    --header "Authorization: Token $DESEC_TOKEN" \
    --header 'Content-Type: application/json' \
    --data @- \
    https://desec.io/api/v1/domains/appsemble.review/rrsets/ >/dev/null
