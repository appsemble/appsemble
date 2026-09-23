# Appsemble Helm Chart

## Installing

### New installation

Appsemble needs an app secret for various internal settings.

```sh
kubectl create secret generic appsemble \
  --from-literal "secret=$(openssl rand -base64 30)" \
  --from-literal "aes-secret=$(openssl rand -base64 32)"
```

Appsemble needs a PostgreSQL 17 or 18 server, which the chart does not bundle. Run it with
[CloudNativePG](https://cloudnative-pg.io) as described in the
[PostgreSQL documentation](https://appsemble.app/docs/deployment/postgresql). A `Cluster` named
`appsemble-postgresql` with an application database and owner named `appsemble` matches the chart
defaults: Appsemble connects to its `appsemble-postgresql-rw` service and reads the password from
the `appsemble-postgresql-app` secret the operator creates. Any other PostgreSQL server works with
the `postgresql.host`, `postgresql.port` and `postgresql.auth` values, given a secret holding the
password of a role which owns the `appsemble` database and may create databases:

```sh
kubectl create secret generic appsemble-postgresql-app \
  --from-literal 'password=my-password'
```

The chart uses Valkey for runtime caching and rate limiting. For the bundled Valkey, create a
password secret:

```sh
kubectl create secret generic valkey \
  --from-literal "password=$(openssl rand -base64 30)"
```

Next, an SMTP and IMAP secret are needed for sending emails.

```sh
kubectl create secret generic smtp \
  --from-literal 'host=my-smtp-host'
  --from-literal 'port=my-smtp-port'
  --from-literal 'secure=my-smtp-secure'
  --from-literal 'user=my-smtp-user'
  --from-literal 'pass=my-smtp-pass'
  --from-literal 'from=my-smtp-from'
```

```sh
kubectl create secret generic imap \
  --from-literal 'imap-host=my-imap-host' \
  --from-literal 'imap-port=my-imap-port' \
  --from-literal 'imap-secure=my-imap-secure' \
  --from-literal 'imap-user=my-imap-user' \
  --from-literal 'imap-pass=my-imap-pass' \
  --from-literal 'imap-copy-to-sent-folder=my-imap-copy-to-sent-folder'
```

You can leave those empty by writing e.g. `--from-literal 'smtp-host='`, but you won’t be able to
send any mail, and Appsemble will output mails in the logs instead.

**Optional**

Appsemble supports login with various OAuth2 providers. If desired, create an OAuth2 secret
containing the client ids and client secrets for each provider.

```sh
kubectl create secret generic oauth2 \
  --from-literal "github-client-id=my-github-client-id" \
  --from-literal "github-client-secret=my-github-client-secret" \
  --from-literal "gitlab-client-id=my-gitlab-client-id" \
  --from-literal "gitlab-client-secret=my-gitlab-client-secret"
```

Appsemble integrates with [Sentry] for error reporting. This requires to configure a Sentry DSN.
This is read from a secret.

```sh
kubectl create secret generic sentry \
  --from-literal 'dsn=my-dsn'
```

Certain endpoints in Appsemble require administrator privileges. These endpoints are protected with
a secret:

```sh
kubectl create secret generic admin-api-secret \
  --from-literal 'admin-api-secret=my-admin-api-secret'
```

Now the chart can be installed.

```sh
helm repo add appsemble https://charts.appsemble.com
helm repo update
helm install my-appsemble appsemble/appsemble --set 'ingress.host=my-appsemble.example.com'
```

### Upgrading

```sh
helm repo update
helm upgrade my-appsemble appsemble/appsemble --set 'ingress.host=my-appsemble.example.com'
```

Make sure `ingress.host` resolves to the ingress controller with both `A` and `AAAA` records. Point
`*.ingress.host` to the same place, preferably with a wildcard `CNAME` to the apex host.

Appsemble creates an ingress per organization which serves `<organization>.ingress.host` and
`*.<organization>.ingress.host`. Both host names need a DNS record of their own. The certificate of
that ingress covers a wildcard host, so cert-manager validates it with a DNS01 challenge, and the
challenge record makes `<organization>.ingress.host` exist in the zone, after which the wildcard
record on `ingress.host` no longer resolves anything below it. Set the `dns` values to let Appsemble
create an `A` and `AAAA` record for both host names of every organization:

```sh
helm install my-appsemble appsemble/appsemble \
--set "dns.provider=desec" \
--set "dns.zone=example.com" \
--set "dns.secret=appsemble-dns" \
--set "dns.targets={203.0.113.10,2001:db8::10}"
# ...
```

`dns.zone` is the zone which contains `ingress.host`, `dns.targets` are the addresses of the ingress
controller, and `dns.secret` names a secret which holds the API token of the provider under the key
`dns-token`. Appsemble writes the records when an organization is created, removes them when it is
deleted, and writes the records of all organizations in the `reconcile-dns` job.

Restrict the token to the records Appsemble manages. For deSEC, give it token policies which allow
writing `A` and `AAAA` record sets in `dns.zone` and nothing else, so it cannot touch the
`_acme-challenge` records of cert-manager or the records of custom domains in the same zone.

## Migrations

The chart runs database migrations in the `migrate` Job after each install and upgrade. Once that
Job completes, the `synchronize-trainings` Job syncs training documents with the database. Server
replicas do not run either task at startup.

If the migration Job fails, the Appsemble pod can still start, but requests may fail with database
errors. If the training synchronization Job fails, training content may be unavailable.

Check Job status and logs after install/upgrade:

```sh
kubectl get jobs
kubectl logs job/my-appsemble-migrate
kubectl logs job/my-appsemble-synchronize-trainings
```

If you use another namespace, add `-n <namespace>`.

Optionally wait for the migration job to complete before validating the deployment:

```sh
kubectl wait --for=condition=complete job/my-appsemble-migrate --timeout=10m
```

To force migration to the latest known version during upgrade:

```sh
helm upgrade my-appsemble appsemble/appsemble \
  --set 'ingress.host=my-appsemble.example.com' \
  --set 'migrateTo=next'
```

### Updating Secrets

If you make changes to one or more secrets, the Appsemble kubernetes pod needs to be restarted for
these changes to be applied.

You can run the following command to restart the deployment:

```sh
kubectl rollout restart deployment appsemble
```

This will cause Kubernetes to create new pods with the updated configuration until all the pods are
new. New pods will be created one at a time, to avoid downtime.

> **Note**: This will incur some downtime.

## PgBouncer (connection pooling)

Set `pgbouncer.enabled=true` to route database traffic through PgBouncer. This requires a userlist
secret (default name `pgbouncer-userlist`) containing a `userlist.txt` key with the database
credentials in PgBouncer's auth file format:

```sh
printf '"%s" "%s"\n' "appsemble" "$POSTGRES_PASSWORD" > userlist.txt
kubectl create secret generic pgbouncer-userlist --from-file=userlist.txt
```

The secret must exist before enabling PgBouncer, otherwise the PgBouncer pod cannot start and the
database becomes unreachable.

Transaction pooling is the default when PgBouncer is enabled. `pgbouncer.maxUserConnections` limits
server connections per database user across all database pools. The default of `80` is sized for
PostgreSQL's default `max_connections=100`. Override it below the non-reserved connection budget
remaining after direct and other clients when PostgreSQL uses a different limit or is shared with
other services.

`pgbouncer.replicaCount` runs more than one pooler, spread across nodes and guarded by a
PodDisruptionBudget of `minAvailable: 1`, so a node drain or a PgBouncer rollout does not interrupt
database access. The replicas share `pgbouncer.maxUserConnections` in equal parts, since they all
authenticate as the same user, so the total number of PostgreSQL backends stays within the budget
whatever the replica count. The per-database pool sizes (`pgbouncer.mainPoolSize`,
`pgbouncer.defaultPoolSize`, `pgbouncer.maxDbConnections`) apply per replica.

Enabling PgBouncer repoints the stored hosts of server-managed app databases (`App.dbHost`) at the
pooler through a one-time migration. Disabling PgBouncer afterwards does not repoint them back:
those apps keep connecting to the removed PgBouncer service and their databases are treated as
external. Before disabling, restore the direct endpoint, for example with
`UPDATE "App" SET "dbHost" = '<postgres-host>', "dbPort" = <postgres-port> WHERE "dbHost" = '<release>-pgbouncer';`.

## PostgreSQL and PgBouncer TLS (encrypted transport)

`postgresSSL: true` (the default) makes Appsemble connect over TLS. CloudNativePG serves TLS with an
operator-managed certificate out of the box, so nothing needs to be configured on the PostgreSQL
side. When PgBouncer is enabled, Appsemble connects to PgBouncer over TLS and PgBouncer connects to
PostgreSQL over TLS:

```yaml
postgresSSL: true
pgbouncer:
  tls:
    autoGenerated: true
    client:
      sslmode: require
      protocols: secure
    server:
      sslmode: require
      protocols: secure
```

The `secure` protocol shortcut allows TLS 1.2 and TLS 1.3. Set `postgresSSL: false` for a PostgreSQL
server without TLS, otherwise startup fails with a TLS-not-supported error.

## Health checks

The server serves three operational endpoints on every hostname, following the
[MicroProfile Health](https://microprofile.io/specifications/health/) response format:

| Endpoint        | Answers                                                    | Read by                                          |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `/health/live`  | A constant `UP`, without touching any dependency           | The startup and liveness probes                  |
| `/health/ready` | Whether PostgreSQL answers and whether the pod is draining | The readiness probe; point uptime monitors here  |
| `/version`      | The Appsemble version, commit SHA and build time           | A person verifying which build a hostname serves |

Valkey is a soft dependency: the server keeps serving apps without it, so it is not part of
readiness. `/api/health` is a deprecated alias of `/health/ready`.

## Valkey

The chart deploys one Valkey pod by default. Valkey holds only the app-serving cache (with a default
`appServingCacheTtl` of 300 seconds) and the sliding-window counters for e-mail registration rate
limits. It holds no sessions or queues. If Valkey restarts, the cache and counters reset; the server
keeps serving requests and reconnects when Valkey returns. Cache operations fail fast during the
outage, and registration requests proceed without the rate limit.

The bundled Valkey has no persistent volume because its data is disposable. It has no replicas: the
dependency chart does not promote a replica when the primary fails, so replicas would not keep the
server's single-writer endpoint available. The bundled setup uses the `valkey` secret created above.
`valkey.auth.usersExistingSecret` names that secret, and `valkey.auth.aclUsers.default.passwordKey`
selects its `password` key.

To use a platform-managed Valkey or Redis service, create a password secret and set
`valkey.enabled=false` with `externalValkey` connection settings:

```sh
kubectl create secret generic external-valkey \
  --from-literal 'password=my-password'
```

```yaml
valkey:
  enabled: false
externalValkey:
  host: valkey.example.com
  port: 6379
  username: default
  tls: true
  existingSecret: external-valkey
  passwordKey: password
```

The chart reads `externalValkey.passwordKey` from `externalValkey.existingSecret` in the release
namespace. Set `host`, `port`, `username` and `tls` to match the external service. The chart does
not deploy a bundled Valkey pod when `valkey.enabled=false`.

## Object storage

Appsemble stores app assets and block assets in S3 compatible object storage. The chart bundles
[SeaweedFS](https://artifacthub.io/packages/helm/seaweedfs/seaweedfs) (`seaweedfs.*` values) and
reads the connection from the `s3` secret (`seaweedfs.s3.credentials.admin.existingSecret`), which
the bundled SeaweedFS also uses for its admin credentials:

```sh
kubectl create secret generic s3 \
  --from-literal 'host=my-s3-host' \
  --from-literal 'port=443' \
  --from-literal 'secure=true' \
  --from-literal 'access-key=my-access-key' \
  --from-literal 'secret-key=my-secret-key'
```

With `seaweedfs.enabled=true` (the default) Appsemble connects to the bundled S3 gateway inside the
cluster and ignores `host`, `port` and `secure` of the secret. To bring your own object storage, set
`seaweedfs.enabled=false`; the secret then provides the endpoint. `s3.region` is sent with every
request and `s3.pathStyle=true` addresses buckets in the URL path, which SeaweedFS, MinIO and ODF
need and Hetzner and AWS accept.

The bundled SeaweedFS runs one pod that serves the master, volume, filer and S3 roles together
(`seaweedfs.allInOne`), backed by one PersistentVolumeClaim (`seaweedfs.allInOne.data`). It suits
development and small installations; point the chart at the platform's own object storage for
production.

### Layouts

`s3.bucket` selects how objects are laid out:

|                          | `s3.bucket` empty (default)                                                                     | `s3.bucket` set                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| App asset                | bucket `app-<appId>`, key `<assetId>`                                                           | bucket `s3.bucket`, key `apps/<appId>/<assetId>`                                     |
| Block asset              | bucket `appsemble-block-assets`, key `<org>/<block>/<version>/<blockVersionId>/<filename>`      | bucket `s3.bucket`, key `blocks/<org>/<block>/<version>/<blockVersionId>/<filename>` |
| Bucket creation          | at runtime by the server                                                                        | never; the bucket is pre-provisioned                                                 |
| Block assets public read | the server sets a bucket policy on `appsemble-block-assets` when `blockAssets.publicUrl` is set | granted on `blocks/*` when provisioning the bucket; the server sets no policy        |
| Credentials need         | create buckets, put bucket policies, object CRUD                                                | get, put, delete and list objects in the one bucket                                  |

The single bucket suits providers that limit the number of buckets, credentials that cannot create
buckets, and buckets claimed through Kubernetes. `blockAssets.publicUrl` serves block assets from
`<publicUrl>/<bucket>/<key>` in both layouts.

### Provisioning the bucket

Create the bucket before installing the chart and, when `blockAssets.publicUrl` is set, allow
anonymous reads on the `blocks/` prefix:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::my-bucket/blocks/*"]
    }
  ]
}
```

- **OpenShift Data Foundation**: create an `ObjectBucketClaim` in the release namespace. ODF
  generates the bucket, a `ConfigMap` with `BUCKET_HOST`, `BUCKET_PORT` and `BUCKET_NAME`, and a
  `Secret` with `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`; create the `s3` secret from them
  and set `s3.bucket` to `BUCKET_NAME`. Apply the policy above with
  `aws s3api put-bucket-policy --bucket <name> --policy file://policy.json`.
- **Hetzner Object Storage**: create the bucket in the Cloud Console and S3 credentials for the
  project. Use `host=<location>.your-objectstorage.com`, `port=443`, `secure=true` and
  `s3.region=<location>` (for example `fsn1`). Apply the policy above with
  `aws s3api put-bucket-policy` against that endpoint.
- **SeaweedFS**: the bundled chart creates buckets on install. Anonymous read cannot be scoped to a
  prefix through an identity, so apply the policy above with `aws s3api put-bucket-policy` when
  `blockAssets.publicUrl` is set:

  ```yaml
  s3:
    bucket: appsemble
  seaweedfs:
    allInOne:
      s3:
        createBuckets:
          - name: appsemble
  ```

### Switching an existing installation to a single bucket

Objects are not migrated automatically. Copy them once with [rclone](https://rclone.org) while the
installation is stopped, then upgrade with `s3.bucket` set:

```sh
rclone lsf src: --dirs-only | sed 's:/$::' | grep -E '^app-[0-9]+$' | while read -r bucket; do
  rclone copy "src:${bucket}" "dst:my-bucket/apps/${bucket#app-}"
done
rclone copy src:appsemble-block-assets dst:my-bucket/blocks
```

`src` and `dst` are rclone remotes for the current and the new object storage; they can point at the
same server.

### Moving from the bundled MinIO to SeaweedFS

SeaweedFS starts with an empty volume and the upgrade removes the MinIO Deployment, so objects have
to be copied across by hand. The MinIO PersistentVolumeClaim survives when it carries
`helm.sh/resource-policy: keep`, but nothing serves it once the Deployment is gone: copy the objects
out **before** upgrading.

1. Scale the Appsemble Deployment to zero so nothing writes while the copy runs.
2. With the old MinIO still running, copy every bucket to a holding location:

   ```sh
   rclone sync minio: holding:
   ```

3. Upgrade the chart with `--set replicaCount=0`. The upgrade re-applies `replicaCount`, so without
   it the server is serving again before its objects are, and `rclone sync` deletes whatever it
   writes in the meantime. SeaweedFS comes up with an empty volume.
4. Copy the objects into SeaweedFS:

   ```sh
   rclone sync holding: seaweedfs:
   ```

5. Compare `rclone size seaweedfs:` with the same command on the holding remote, then scale the
   Appsemble Deployment back up.

`minio`, `holding` and `seaweedfs` are rclone remotes; `holding` can be a local directory. With
`assetsBackups.enabled=true` the backup bucket already holds a copy of the app assets, so step 2 can
be replaced by a final run of the backup CronJob and step 4 by `sh scripts/s3-assets-restore.sh`.
Block assets are not part of those backups and always need the rclone copy.

## Zero-downtime rollouts

The Deployment rolls with `maxSurge: 1` and `maxUnavailable: 0`, so a replacement pod passes its
readiness probe before an old one is stopped. A single-replica install therefore also rolls over
without a gap.

Stopping a pod is staged, because removal from the Service endpoints is asynchronous and would
otherwise drop requests still being routed to it:

1. The pod keeps answering normally for `preStopSleepSeconds`, while the removal propagates.
2. It is sent `SIGTERM`. `/health/ready` reports `DOWN` from that moment, the server stops accepting
   connections, finishes the requests in flight and closes its database connections.
3. `terminationGracePeriodSeconds` later, anything left is killed. Raise it above the default when
   the deployment serves requests longer than 30 seconds.

With `replicaCount` above 1, a PodDisruptionBudget of `minAvailable: 1` is rendered as well, so a
node drain or other voluntary disruption cannot evict every replica at once.

## Variables

| Name                                        | Default                        | Description                                                                                                                               |
| ------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `replicaCount`                              | 1                              |                                                                                                                                           |
| `preStopSleepSeconds`                       | 10                             | How long a stopping pod keeps answering before it is sent `SIGTERM`, so its removal from the Service endpoints has propagated by then.    |
| `terminationGracePeriodSeconds`             | 40                             | How long a pod may take to stop before it is killed. Must cover `preStopSleepSeconds` plus the longest request.                           |
| `image.repository`                          | `appsemble/appsemble`          | Set this to `registry.gitlab.io/appsemble/appsemble` to support prerelease versions.                                                      |
| `image.tag`                                 | `nil`                          | If specified, this Docker image tag will be used. Otherwise, it will use the chart’s `appVersion`.                                        |
| `image.pullPolicy`                          | `IfNotPresent`                 | This can be used to override the default image pull policy.                                                                               |
| `nameOverride`                              | `''`                           | This can be used to override the name in the templates.                                                                                   |
| `fullnameOverride`                          | `''`                           | This can be used to override the full name in the templates.                                                                              |
| `service.type`                              | `ClusterIP`                    | The type of the Appsemble service.                                                                                                        |
| `service.port`                              | 80                             | The HTTP port on which the Appsemble service will be exposed to the cluster.                                                              |
| `ingress.enabled`                           | `true`                         | Whether or not the service should be exposed through an ingress.                                                                          |
| `ingress.className`                         | `nginx`                        | The ingress class name.                                                                                                                   |
| `ingress.annotations`                       |                                | Annotations for the Appsemble ingress.                                                                                                    |
| `ingress.host`                              | `''`                           | The host name on which the ingress will expose the service.                                                                               |
| `ingress.tls`                               | `false`                        | Whether TLS should be configured for the top-level and wildcard hosts.                                                                    |
| `ingress.tlsSecretName`                     | `''`                           | The secret name to use to configure TLS for the top level host.                                                                           |
| `ingress.tlsWildcardSecretName`             | `''`                           | The secret name to use to configure TLS for the direct wildcard host.                                                                     |
| `dns.provider`                              | `''`                           | The provider which serves the DNS zone of the organization host names. The only supported value is `desec`.                               |
| `dns.zone`                                  | `''`                           | The name of the DNS zone which contains the organization host names.                                                                      |
| `dns.secret`                                | `''`                           | The name of the secret which holds the API token of the DNS provider under the key `dns-token`.                                           |
| `dns.targets`                               | `[]`                           | The IP addresses the organization host names resolve to.                                                                                  |
| `route.enabled`                             | `false`                        | Whether or not the service should be exposed through an OpenShift Route.                                                                  |
| `route.host`                                | `''`                           | The host name on which the route will expose the service.                                                                                 |
| `route.annotations`                         | `{}`                           | Annotations for the OpenShift Route.                                                                                                      |
| `route.tls.termination`                     | `edge`                         | TLS termination type: edge, passthrough, or reencrypt.                                                                                    |
| `route.tls.insecureEdgeTerminationPolicy`   | `Redirect`                     | Policy for handling insecure traffic: Allow, Redirect, or None.                                                                           |
| `resources.deployment.limits.memory`        | `4Gi`                          | Memory limit for the main deployment container.                                                                                           |
| `resources.deployment.limits.cpu`           | `1`                            | CPU limit for the main deployment container.                                                                                              |
| `resources.deployment.requests.memory`      | `2Gi`                          | Memory request for the main deployment container.                                                                                         |
| `resources.deployment.requests.cpu`         | `100m`                         | CPU request for the main deployment container.                                                                                            |
| `resources.jobs.limits.memory`              | `1Gi`                          | Memory limit for Job containers (migrate, provision, etc.).                                                                               |
| `resources.jobs.limits.cpu`                 | `1`                            | CPU limit for Job containers.                                                                                                             |
| `resources.jobs.requests.memory`            | `256Mi`                        | Memory request for Job containers.                                                                                                        |
| `resources.jobs.requests.cpu`               | `100m`                         | CPU request for Job containers.                                                                                                           |
| `resources.cronjobs.limits.memory`          | `256Mi`                        | Memory limit for CronJob containers.                                                                                                      |
| `resources.cronjobs.limits.cpu`             | `500m`                         | CPU limit for CronJob containers.                                                                                                         |
| `resources.cronjobs.requests.memory`        | `64Mi`                         | Memory request for CronJob containers.                                                                                                    |
| `resources.cronjobs.requests.cpu`           | `50m`                          | CPU request for CronJob containers.                                                                                                       |
| `resources.backupCronjob.limits.memory`     | `3Gi`                          | Memory limit for the backup CronJob container.                                                                                            |
| `resources.backupCronjob.limits.cpu`        | `1`                            | CPU limit for the backup CronJob container.                                                                                               |
| `resources.backupCronjob.requests.memory`   | `1Gi`                          | Memory request for the backup CronJob container.                                                                                          |
| `resources.backupCronjob.requests.cpu`      | `100m`                         | CPU request for the backup CronJob container.                                                                                             |
| `nodeSelector`                              | `{}`                           |                                                                                                                                           |
| `tolerations`                               | `[]`                           |                                                                                                                                           |
| `affinity`                                  | `{}`                           |                                                                                                                                           |
| `smtpSecret`                                | `smtp`                         | The secret to use for configuring SMTP. The secret should contain the following values: `host`, `port`, `secure`, `user`, `pass`, `from`. |
| `oauthSecret`                               | `nil`                          | The secret which holds client ids and client secrets for OAuth2 providers.                                                                |
| `sentry.allowedDomains`                     | `[]`                           | A list of domains on which Sentry integration will be enabled. Wildcards are supported.                                                   |
| `sentry.secret`                             | `nil`                          | The secret from which to read the [Sentry] DSN.                                                                                           |
| `sentry.environment`                        | `nil`                          | The environment to send with Sentry error reports.                                                                                        |
| `secretSecret`                              | `appsemble`                    | The Kubernetes secret which holds the `SECRET` environment variable.                                                                      |
| `cronjob.jobsHistoryLimit`                  | 3                              | How long to keep logs for cronjobs in days.                                                                                               |
| `cronjob.ttlSecondsAfterFinished`           | 86400                          | Seconds after a CronJob's Job finishes before Kubernetes automatically deletes it.                                                        |
| `cronjob.enabled`                           | true                           | Deploy the app cron runner and generic maintenance CronJobs (independent of ingress/route).                                               |
| `cronjob.platform.enabled`                  | true                           | Deploy the SaaS-only CronJobs: subscription billing, production backup, container scaling.                                                |
| `migrateTo`                                 | `nil`                          | If specified, the database will be migrated to this specific version. To upgrade to the latest version, specify `next`.                   |
| `proxy`                                     | `false`                        | If `true`, The proxy is trusted for logging purposes.                                                                                     |
| `postgresql.host`                           | `appsemble-postgresql-rw`      | The PostgreSQL host, such as the `-rw` service of a CloudNativePG `Cluster`.                                                              |
| `postgresql.port`                           | `5432`                         | The PostgreSQL port.                                                                                                                      |
| `postgresql.auth.existingSecret`            | `appsemble-postgresql-app`     | The secret from which to read the PostgreSQL password, under the key `postgresql.auth.secretKeys.userPasswordKey` (`password`).           |
| `postgresql.auth.username`                  | `appsemble`                    | The name of the PostgreSQL user.                                                                                                          |
| `postgresql.auth.database`                  | `appsemble`                    | The name of the PostgreSQL database.                                                                                                      |
| `pgbouncer.enabled`                         | `false`                        | Whether to deploy PgBouncer between Appsemble and PostgreSQL. Requires the `pgbouncer.auth.existingSecret` userlist secret to exist.      |
| `pgbouncer.replicaCount`                    | `1`                            | The number of PgBouncer replicas. Above 1, a PodDisruptionBudget keeps one available.                                                     |
| `pgbouncer.image.tag`                       | `v1.25.2-p0`                   | PgBouncer image tag.                                                                                                                      |
| `pgbouncer.auth.existingSecret`             | `pgbouncer-userlist`           | The secret from which to read the PgBouncer userlist file.                                                                                |
| `pgbouncer.auth.type`                       | `scram-sha-256`                | The PgBouncer client authentication method.                                                                                               |
| `pgbouncer.tls.autoGenerated`               | `true`                         | Generate a self-signed PgBouncer service certificate when no existing TLS secret is configured.                                           |
| `pgbouncer.tls.existingSecret`              | `''`                           | The Kubernetes TLS secret PgBouncer uses for client-facing TLS. Required if auto-generation is disabled and `postgresSSL=true`.           |
| `pgbouncer.tls.client.sslmode`              | `require`                      | PgBouncer TLS mode for Appsemble-to-PgBouncer connections.                                                                                |
| `pgbouncer.tls.client.protocols`            | `secure`                       | PgBouncer TLS protocols for Appsemble-to-PgBouncer connections. `secure` allows TLS 1.2 and TLS 1.3.                                      |
| `pgbouncer.tls.server.sslmode`              | `require`                      | PgBouncer TLS mode for PgBouncer-to-PostgreSQL connections.                                                                               |
| `pgbouncer.tls.server.protocols`            | `secure`                       | PgBouncer TLS protocols for PgBouncer-to-PostgreSQL connections. `secure` allows TLS 1.2 and TLS 1.3.                                     |
| `pgbouncer.poolMode`                        | `transaction`                  | PgBouncer pooling mode.                                                                                                                   |
| `pgbouncer.maxClientConn`                   | 500                            | Maximum number of client connections PgBouncer accepts.                                                                                   |
| `pgbouncer.mainPoolSize`                    | 10                             | Number of server connections for the main Appsemble database pool.                                                                        |
| `pgbouncer.defaultPoolSize`                 | 3                              | Number of server connections per app database pool.                                                                                       |
| `pgbouncer.maxDbConnections`                | 10                             | Maximum number of server connections PgBouncer opens per database.                                                                        |
| `pgbouncer.maxUserConnections`              | 80                             | Maximum number of server connections PgBouncer opens per database user across all pools, shared by the replicas.                          |
| `valkey`                                    |                                | Values passed into the bundled Valkey dependency chart.                                                                                   |
| `valkey.enabled`                            | `true`                         | Set this to false explicitly to use `externalValkey` instead of bundled Valkey.                                                           |
| `valkey.fullnameOverride`                   | `appsemble-valkey`             | The name used for the bundled Valkey service.                                                                                             |
| `valkey.auth.usersExistingSecret`           | `valkey`                       | The secret from which to read the bundled Valkey password.                                                                                |
| `appServingCacheTtl`                        | `300`                          | The TTL in seconds for cached app-serving metadata. Set this to `0` to disable the app-serving cache.                                     |
| `externalValkey.host`                       | `null`                         | The external Valkey host. Required when `valkey.enabled=false`.                                                                           |
| `externalValkey.port`                       | `6379`                         | The external Valkey port.                                                                                                                 |
| `externalValkey.username`                   | `default`                      | The external Valkey ACL username.                                                                                                         |
| `externalValkey.tls`                        | `false`                        | Whether to use TLS for the external Valkey connection.                                                                                    |
| `externalValkey.existingSecret`             | `null`                         | The secret from which to read the external Valkey password. Required when `valkey.enabled=false`.                                         |
| `externalValkey.passwordKey`                | `password`                     | The key in `externalValkey.existingSecret` containing the Valkey password.                                                                |
| `remote`                                    | `null`                         | A remote Appsemble server to connect to in order to synchronize blocks.                                                                   |
| `securityEmail`                             | `security@appsemble.com`       | The default security contact email for reporting security vulnerabilities.                                                                |
| `postgresSSL`                               | `true`                         | If `true`, establish the database connection over TLS. When PgBouncer is enabled, both DB hops use TLS.                                   |
| `quotas.appEmail.enabled`                   | `false`                        | If `true`, enable app email quotas.                                                                                                       |
| `quotas.appEmail.dailyLimit`                | `10`                           | The maximum number of emails an app can send per day.                                                                                     |
| `quotas.appEmail.alertOrganizationOwner`    | `false`                        | If `true`, send an email to the organization owner when the daily limit is reached.                                                       |
| `prometheusRule.enabled`                    | `false`                        | If `true`, deploy a PrometheusRule with alerts for server container restarts and high memory usage. Needs the prometheus-operator CRDs.   |
| `prometheusRule.labels`                     | `{ release: prometheus }`      | Extra labels for the PrometheusRule, so it matches the ruleSelector of the Prometheus instance.                                           |
| `s3.bucket`                                 | `''`                           | The single, pre-provisioned bucket for all app and block assets. When empty, buckets are created per app and for block assets.            |
| `s3.region`                                 | `us-east-1`                    | The region to sign object storage requests for.                                                                                           |
| `s3.pathStyle`                              | `true`                         | Whether to address buckets in the URL path instead of as a subdomain of the endpoint.                                                     |
| `blockAssets.publicUrl`                     | `''`                           | The public base URL of the object storage. When set, block assets are served from `<publicUrl>/<bucket>/<key>` instead of the API.        |
| `blockAssets.migration.enabled`             | `true`                         | Run the job that moves database-stored block assets to object storage after each install and upgrade.                                     |
| `blockAssets.migration.batch`               | `100`                          | The number of block assets that job migrates per database batch.                                                                          |
| `seaweedfs`                                 |                                | Values passed into the bundled SeaweedFS dependency chart.                                                                                |
| `seaweedfs.enabled`                         | `true`                         | Set this to false explicitly to bring your own S3 compatible object storage.                                                              |
| `seaweedfs.fullnameOverride`                | `appsemble-seaweedfs`          | The name used for the bundled SeaweedFS service.                                                                                          |
| `seaweedfs.s3.credentials.admin`            |                                | The `existingSecret`, `accessKeyKey` and `secretKeyKey` of the S3 credentials secret. SeaweedFS uses them as its admin credentials.       |
| `seaweedfs.allInOne.data.type`              | `persistentVolumeClaim`        | How the SeaweedFS data volume is provisioned. Use `emptyDir` for throwaway installations.                                                 |
| `seaweedfs.allInOne.data.size`              | `8Gi`                          | The size of the SeaweedFS data volume.                                                                                                    |
| `seaweedfs.allInOne.data.storageClass`      | `nil`                          | The storage class of the SeaweedFS data volume. Defaults to the cluster default.                                                          |
| `seaweedfs.allInOne.s3.createBuckets`       | `[]`                           | Buckets to create on install. Needed for the single bucket layout, where the server never creates one.                                    |
| `seaweedfs.s3.ingress.enabled`              | `false`                        | Expose the SeaweedFS S3 API through an ingress. Needed to serve block assets from `blockAssets.publicUrl`.                                |
| `seaweedfs.s3.ingress.host`                 | `nil`                          | The host name of the SeaweedFS S3 ingress.                                                                                                |
| `backups.enabled`                           | `true`                         | Deploy the CronJob that backs up the main and app databases to object storage.                                                            |
| `backups.bucket`                            | `appsemble-backups-exampleenv` | The pre-provisioned bucket to store database backups in.                                                                                  |
| `backups.filename`                          | `appsemble_backup`             | The prefix of the backup files before their timestamp.                                                                                    |
| `backups.host`                              | `nil`                          | The host of the backups object storage.                                                                                                   |
| `backups.port`                              | `443`                          | The port of the backups object storage.                                                                                                   |
| `backups.secure`                            | `true`                         | Whether to connect to the backups object storage over TLS.                                                                                |
| `backups.region`                            | `us-east-1`                    | The region to sign backup object storage requests for.                                                                                    |
| `backups.pathStyle`                         | `true`                         | Whether to address the backups bucket in the URL path instead of as a subdomain of the endpoint.                                          |
| `backups.existingSecret`                    | `backups-secret`               | The secret that holds the `access-key` and `secret-key` of the backups object storage.                                                    |
| `backups.tmpSizeLimit`                      | `8Gi`                          | The scratch space each database is dumped to before it is uploaded. Must exceed the gzipped dump of the largest database.                 |
| `assetsBackups.enabled`                     | `false`                        | Deploy the CronJob that syncs app assets to the backups object storage with rclone.                                                       |
| `assetsBackups.schedule`                    | `20 2 * * *`                   | The cron schedule of the asset backup job.                                                                                                |
| `assetsBackups.sourceEndpoint`              | `null`                         | The endpoint of the object storage to back up. Derived from the SeaweedFS values when unset.                                              |
| `assetsBackups.sourceRegion`                | `fsn1`                         | The region of the object storage to back up.                                                                                              |
| `assetsBackups.destinationRegion`           | `fsn1`                         | The region of the backups object storage.                                                                                                 |
| `assetsBackups.prefix`                      | `assets/app-buckets`           | The key prefix under `backups.bucket` to store asset backups in.                                                                          |
| `assetsBackups.verifyAfterSync`             | `true`                         | Verify each synced app against the backup after syncing.                                                                                  |
| `assetsBackups.maxDelete`                   | `2000`                         | The maximum number of objects a sync may delete from the backup of one app.                                                               |
| `assetsBackups.checkers`                    | `16`                           | The number of rclone checkers.                                                                                                            |
| `assetsBackups.transfers`                   | `8`                            | The number of parallel rclone transfers.                                                                                                  |
| `assetsBackups.archiveRetentionDays`        | `90`                           | How many days to keep objects that a sync replaced or deleted.                                                                            |
| `assetsBackups.enableMonthlyFullSnapshot`   | `true`                         | Copy the current backup into a monthly snapshot.                                                                                          |
| `assetsBackups.fullSnapshotDay`             | `1`                            | The day of the month to take the monthly snapshot on.                                                                                     |
| `assetsBackups.fullSnapshotRetentionMonths` | `12`                           | How many monthly snapshots to keep.                                                                                                       |

[sentry]: https://sentry.io

## Production durability recommendations

For production environments with significant asset storage in the bundled object store:

- set `seaweedfs.allInOne.data.size` to at least `50Gi`. SeaweedFS reclaims the space of deleted
  objects by vacuuming its volumes, so leave headroom above the live object size.
- set `seaweedfs.allInOne.data.storageClass` to a retained storage class (for Hetzner:
  `hetzner-volumes-retain`).
- set the SeaweedFS PVC annotation `helm.sh/resource-policy: keep`.
- set `seaweedfs.allInOne.resources.limits.memory` to at least `3Gi`. Idle usage stays near 110 MB,
  but a bulk ingest such as `s3-assets-restore.sh` runs eight parallel `rclone` transfers and holds
  around 1.5 GB of anonymous memory, which a `1Gi` limit ends in `OOMKilled`.
- raise `seaweedfs.volume.dataDirs[0].maxVolumes` above the number of apps. SeaweedFS keeps a
  separate set of volumes per bucket and the bucket per app layout gives every app its own bucket,
  one volume per bucket under the chart's `master.volume_growth` setting. Volumes are created on
  demand and stay sparse, so the ceiling costs nothing until it is used, but reaching it fails
  writes for new apps.
- give the CloudNativePG `Cluster` two or more instances on the same retained class, with a WAL
  archive and scheduled base backups, as described in the
  [PostgreSQL documentation](https://appsemble.app/docs/deployment/postgresql).
- keep `backup-production-data` enabled for logical database backups.
- enable `assetsBackups.enabled=true` for app-asset backups (incremental daily + monthly full
  snapshots).

Example:

```yaml
seaweedfs:
  allInOne:
    data:
      size: 50Gi
      storageClass: hetzner-volumes-retain
      annotations:
        helm.sh/resource-policy: keep
    resources:
      limits:
        memory: 3Gi
assetsBackups:
  enabled: true
  prefix: assets/app-buckets
  archiveRetentionDays: 90
  enableMonthlyFullSnapshot: true
  fullSnapshotDay: 1
  fullSnapshotRetentionMonths: 12
```

Recommended backup object layout within each environment backup bucket:

- SQL backups:
  - `sql/main/<filename>_<timestamp>.sql.gz`
  - `sql/apps/<app-id>/<filename>_<timestamp>.sql.gz`
- App asset backups:
  - `assets/app-buckets/current/app-<id>/...`
  - `assets/app-buckets/archive/<run-id>/app-<id>/...`
  - `assets/app-buckets/snapshots/<yyyy-mm-01>/app-<id>/...`

The backup jobs upload large objects in parts and abort an upload that fails. While the object
storage is unreachable the abort fails too, and the parts stay behind as an incomplete multipart
upload: invisible to listings, billed as storage. Set a lifecycle rule on the backups bucket with
`AbortIncompleteMultipartUpload` and `DaysAfterInitiation: 1`, which Hetzner Object Storage accepts,
so such parts are removed without manual action. The SQL dumps are never deleted by the job either:
add an `Expiration` rule on the `sql/` prefix with the number of days to keep them (appsemble.app
keeps 30).

To restore app asset backups, run `sh scripts/s3-assets-restore.sh` with `BACKUP_S3_*` pointing at
the backup object storage and `RESTORE_S3_*` pointing at the object storage to restore into. The
script restores `current` by default. Set `RESTORE_SOURCE=snapshot` and `SNAPSHOT_ID=<yyyy-mm-01>`
to restore a monthly full snapshot. By default it copies objects without deleting extra objects in
the target; set `DELETE_EXTRA=true` to make the target exactly match the backup source. On a
single-bucket installation, set `S3_BUCKET` to the same value as `s3.bucket` so each backup is
restored into its `apps/<id>/` prefix.

> Note: `helm.sh/resource-policy=keep` reduces Helm-driven deletion risk but does not replace
> backups.
