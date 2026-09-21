#!/usr/bin/env sh
# Creates the CloudNativePG cluster of a review environment and waits until it accepts connections.
# The operator generates the "<cluster>-app" secret with the owner's credentials, which the chart and
# the PgBouncer userlist read. The instance label lets cleanup-review-resources.sh delete the cluster
# with the rest of the release.

set -eu

RELEASE="review-$CI_MERGE_REQUEST_IID"
CLUSTER="$RELEASE-postgresql"

kubectl apply -f - <<MANIFEST
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: $CLUSTER
  labels:
    app.kubernetes.io/instance: $RELEASE
spec:
  instances: 1
  enablePDB: false
  imageName: ghcr.io/cloudnative-pg/postgresql:17.11-minimal-trixie
  bootstrap:
    initdb:
      database: appsemble
      owner: appsemble
  managed:
    roles:
      - name: appsemble
        ensure: present
        login: true
        createdb: true
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      memory: 512Mi
  storage:
    storageClass: local-path
    size: 5Gi
MANIFEST

kubectl wait --for=condition=Ready "cluster.postgresql.cnpg.io/$CLUSTER" --timeout=10m
