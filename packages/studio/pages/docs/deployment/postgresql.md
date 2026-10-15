# PostgreSQL

Appsemble stores its data in PostgreSQL 17 or 18: the `appsemble` database, plus one database per
app which the server creates on demand as `app-<id>`. The Helm chart does not bundle PostgreSQL. Run
it with [CloudNativePG](https://cloudnative-pg.io), the Kubernetes operator which takes care of
replication, failover, rolling updates and backups, and point the chart at the cluster it manages.
This page describes that setup. Any PostgreSQL 17 or 18 server works as well, as long as it meets
the requirements below.

## Table of contents

## What Appsemble needs

The chart reads the connection from the `postgresql` values:

| Value                            | Default                    | Meaning                                               |
| -------------------------------- | -------------------------- | ----------------------------------------------------- |
| `postgresql.host`                | `appsemble-postgresql-rw`  | The host, for CloudNativePG the `-rw` service         |
| `postgresql.port`                | `5432`                     | The port                                              |
| `postgresql.auth.database`       | `appsemble`                | The main database                                     |
| `postgresql.auth.username`       | `appsemble`                | The role Appsemble connects as                        |
| `postgresql.auth.existingSecret` | `appsemble-postgresql-app` | A secret holding the role's password under `password` |

The role owns the main database and needs the `CREATEDB` attribute, because the server creates the
per-app databases itself. It does not need to be a superuser. `postgresSSL` (default `true`) makes
Appsemble connect over TLS; CloudNativePG serves TLS out of the box.

## Installing CloudNativePG

Install the operator once per Kubernetes cluster. The
[Barman Cloud plugin](https://cloudnative-pg.io/plugin-barman-cloud/) adds backups to S3 compatible
object storage and needs [cert-manager](https://cert-manager.io):

```sh copy
helm repo add cnpg https://cloudnative-pg.github.io/charts
helm repo update
helm upgrade --install cnpg cnpg/cloudnative-pg \
  --namespace cnpg-system --create-namespace --version 0.29.0
helm upgrade --install plugin-barman-cloud cnpg/plugin-barman-cloud \
  --namespace cnpg-system --version 0.8.0
```

On OpenShift, the operator runs as a fixed non-root user, which the default `restricted-v2` security
context constraint rejects. Bind the operator's service accounts to `nonroot-v2` instead:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: cnpg-nonroot
  namespace: cnpg-system
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:openshift:scc:nonroot-v2
subjects:
  - kind: Group
    apiGroup: rbac.authorization.k8s.io
    name: system:serviceaccounts:cnpg-system
```

## A highly available cluster

A `Cluster` resource in the namespace of the Appsemble release describes the database. This one
matches the chart defaults and survives the loss of a node, a rolling update of PostgreSQL and a
node drain without downtime:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: appsemble-postgresql
spec:
  instances: 2
  # The standard image ships every locale; the minimal one only knows C.
  imageName: ghcr.io/cloudnative-pg/postgresql:18.6-standard-trixie
  # Voluntary disruptions such as a node drain never take the last instance down.
  enablePDB: true
  # A restart of the primary, for a new image or a changed setting, promotes the replica first.
  primaryUpdateStrategy: unsupervised
  primaryUpdateMethod: switchover
  bootstrap:
    initdb:
      database: appsemble
      owner: appsemble
      # The collation of the bundled chart of earlier releases, so sorting stays the same.
      localeCollate: en_US.UTF-8
      localeCType: en_US.UTF-8
  managed:
    roles:
      # The owner role which initdb created, extended with the right to create the app databases.
      - name: appsemble
        ensure: present
        login: true
        createdb: true
        inRoles:
          - pg_read_all_stats
  postgresql:
    parameters:
      # The operator preloads pg_stat_statements and creates the extension in every database.
      pg_stat_statements.max: '10000'
      pg_stat_statements.track: all
      # Sized for the 2Gi memory limit below.
      shared_buffers: 512MB
      effective_cache_size: 1536MB
      work_mem: 16MB
  resources:
    requests:
      cpu: 250m
      memory: 1Gi
    limits:
      cpu: '1'
      memory: 2Gi
  storage:
    # A storage class which retains the volume when the claim is deleted.
    storageClass: my-retained-storage-class
    size: 20Gi
```

The operator creates the `appsemble-postgresql-rw` service, which always points at the current
primary, and the `appsemble-postgresql-app` secret with the credentials of the `appsemble` role.
Both are the chart defaults, so the chart needs no PostgreSQL values at all:

```sh copy
kubectl apply -f cluster.yaml
kubectl wait --for=condition=Ready cluster.postgresql.cnpg.io/appsemble-postgresql --timeout=10m
helm install my-appsemble appsemble/appsemble --set 'ingress.host=my-appsemble.example.com'
```

Use another cluster name, database or owner by setting the matching `postgresql` values.

With two instances, the replica streams from the primary and takes over when the primary fails or is
stopped. A switchover stops the old primary and promotes the replica, so the `-rw` service has no
endpoint for a few seconds (about 8 seconds measured): requests which need the database fail with a
`500` in that window, after which the server reconnects. The server pods themselves keep running.
Enable PgBouncer with two replicas as well (`pgbouncer.enabled=true`, `pgbouncer.replicaCount=2`),
so the pooler is not the remaining single point of failure. A single instance with
`enablePDB: false` is enough for development.

## Backups

PostgreSQL backups consist of a continuous archive of the write-ahead log (WAL) and periodic base
backups, which together restore the cluster to any point in time. Store them in an S3 compatible
bucket through the Barman Cloud plugin. Create a secret with the credentials and an `ObjectStore`
which points at the bucket:

```yaml
apiVersion: barmancloud.cnpg.io/v1
kind: ObjectStore
metadata:
  name: appsemble-postgresql-backups
spec:
  configuration:
    destinationPath: s3://my-backups-bucket/postgresql
    endpointURL: https://s3.example.com
    s3Credentials:
      accessKeyId:
        name: postgresql-backups
        key: access-key
      secretAccessKey:
        name: postgresql-backups
        key: secret-key
    wal:
      compression: gzip
    data:
      compression: gzip
  retentionPolicy: 30d
```

Then let the cluster archive to it and schedule a base backup:

```yaml
# In the Cluster spec:
plugins:
  - name: barman-cloud.cloudnative-pg.io
    isWALArchiver: true
    parameters:
      barmanObjectName: appsemble-postgresql-backups
---
apiVersion: postgresql.cnpg.io/v1
kind: ScheduledBackup
metadata:
  name: appsemble-postgresql-daily
spec:
  schedule: '0 0 3 * * *'
  backupOwnerReference: self
  cluster:
    name: appsemble-postgresql
  method: plugin
  pluginConfiguration:
    name: barman-cloud.cloudnative-pg.io
```

Where the storage class supports volume snapshots, such as OpenShift Data Foundation, a
`ScheduledBackup` with `method: volumeSnapshot` and a `backup.volumeSnapshot.className` in the
cluster spec takes base backups as snapshots instead; the WAL archive still goes to the object
store. Check the backups with `kubectl get backup`, and restore by creating a new cluster with
`bootstrap.recovery` from the object store, as described in the
[CloudNativePG documentation](https://cloudnative-pg.io/documentation/current/recovery/).

The chart's `backup-production-data` CronJob keeps making logical dumps of every database, which
remain the easiest way to restore a single app.

## Operations

- A switchover moves the primary to the replica without data loss:
  `kubectl cnpg promote appsemble-postgresql <replica-pod>`, with the
  [`cnpg` plugin for kubectl](https://cloudnative-pg.io/documentation/current/kubectl-plugin/). Use
  it before draining the node of the primary.
- A new `imageName` rolls the instances one at a time, replica first, and ends with a switchover.
  Change the image and the `parameters` in separate steps, the operator rejects both at once.
- `kubectl cnpg status appsemble-postgresql` shows the primary, the replication lag and the state of
  the WAL archive.
- Every instance exports PostgreSQL metrics on its `metrics` port. A `PodMonitor` selecting
  `cnpg.io/cluster: appsemble-postgresql` lets a Prometheus operator scrape them, and the
  [CloudNativePG Grafana dashboard](https://github.com/cloudnative-pg/grafana-dashboards) shows
  them.
- The `pg_stat_statements` extension is managed by the operator: the `pg_stat_statements.*`
  parameters preload it and create it in every database, and removing them drops it again. The same
  goes for `pgaudit` and `auto_explain`.

## Moving from the bundled PostgreSQL chart

Earlier chart versions bundled a Bitnami PostgreSQL StatefulSet. CloudNativePG imports its databases
with a logical dump over the network, so the data moves with a short write freeze rather than a copy
of the volume. Give the new cluster a name other than the old `postgresql.fullnameOverride`
(`appsemble-postgresql` by default): the operator names its ServiceAccount after the cluster and
adopts an existing one, and the one of the old chart has token automount disabled, which leaves the
new instances without API access. The example below uses `appsemble-cnpg`. Keep the `standard` image
and the `en_US.UTF-8` locale of the manifest above: the import recreates every app database with the
collation it has on the old server, which is `en_US.UTF-8`, and fails on an image without that
locale. With the old release still running:

1. Install the operator and create the secrets the new cluster uses: a `kubernetes.io/basic-auth`
   secret for the `appsemble` role with its current password, so the passwords which apps store for
   their databases stay valid, next to the existing secret holding the `postgres` superuser password
   of the old StatefulSet, which the import connects with.

   ```sh
   kubectl create secret generic appsemble-cnpg-app --type kubernetes.io/basic-auth \
     --from-literal username=appsemble \
     --from-literal "password=$(kubectl get secret postgresql-secret -o jsonpath='{.data.password}' | base64 -d)"
   ```

2. Scale the Appsemble Deployment to zero, so nothing writes during the import.
3. Create the cluster with an import of every database from the old service. The bootstrap creates
   the `appsemble` role and database from the secret and the import fills the database and creates
   the app databases next to it:

   ```yaml
   spec:
     bootstrap:
       initdb:
         database: appsemble
         owner: appsemble
         secret:
           name: appsemble-cnpg-app
         import:
           type: monolith
           databases: ['*']
           roles: ['*']
           source:
             externalCluster: bitnami
     externalClusters:
       - name: bitnami
         connectionParameters:
           host: appsemble-postgresql
           user: postgres
           dbname: postgres
           sslmode: prefer
         password:
           name: postgresql-secret
           key: postgres-password
   ```

4. When the cluster is `Ready`, compare both sides: the number of databases in `pg_database` and the
   row counts of a few tables.
5. Point the apps at the new host. Every `App` row stores the host of its database, and the server
   only manages databases whose host equals its own `DATABASE_HOST`, so rows which still name the
   old service would keep using the old StatefulSet. In the `appsemble` database of the new cluster:

   ```sql
   UPDATE "App" SET "dbHost" = 'appsemble-cnpg-rw' WHERE "dbHost" = 'appsemble-postgresql';
   ```

   With PgBouncer enabled the rows name the PgBouncer service, which does not change; check with
   `SELECT "dbHost", count(*) FROM "App" GROUP BY 1`.

6. Keep the old StatefulSet as a rollback point while the chart moves away from it: annotate it, its
   services, ServiceAccount, ConfigMaps and TLS secret with `helm.sh/resource-policy: keep`, so the
   upgrade leaves them in place.
7. Upgrade the chart with `postgresql.host=appsemble-cnpg-rw` and
   `postgresql.auth.existingSecret=appsemble-cnpg-app`, then scale the Deployment back up. To roll
   back, upgrade to the previous chart version with its values again, which adopts the kept objects
   (`helm rollback` does not). Delete the old StatefulSet and its volume after the retention period.
