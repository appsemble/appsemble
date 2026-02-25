# Appsemble Helm Chart

## Installing

### New installation

Appsemble needs an app secret for various internal settings.

```sh
kubectl create secret generic appsemble \
  --from-literal "secret=$(openssl rand -base64 30)" \
  --from-literal "aes-secret=$(openssl rand -base64 32)"
```

It is recommended to create a PostgreSQL secret beforehand.

```sh
kubectl create secret generic postgresql-secret \
  --from-literal 'password=my-password' \
  --from-literal 'postgres-password=my-admin-password' \
  --from-literal 'replication-password=my-replication-password'
```

> **Caution**: Make sure not to lose the PostgreSQL passwords!

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
helm install my-appsemble appsemble/appsemble --set 'global.postgresql.auth.existingSecret=postgresql-secret' --set 'ingress.host=my-appsemble.example.com'
```

### Upgrading

```sh
helm repo update
helm upgrade my-appsemble appsemble/appsemble --set 'global.postgresql.auth.existingSecret=postgresql-secret' --set 'ingress.host=my-appsemble.example.com'
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

## Variables

| Name                                      | Default                       | Description                                                                                                                               |
| ----------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `replicaCount`                            | 1                             |                                                                                                                                           |
| `image.repository`                        | `appsemble/appsemble`         | Set this to `registry.gitlab.io/appsemble/appsemble` to support prerelease versions.                                                      |
| `image.tag`                               | `nil`                         | If specified, this Docker image tag will be used. Otherwise, it will use the chart’s `appVersion`.                                        |
| `image.pullPolicy`                        | `IfNotPresent`                | This can be used to override the default image pull policy.                                                                               |
| `nameOverride`                            | `''`                          | This can be used to override the name in the templates.                                                                                   |
| `fullnameOverride`                        | `''`                          | This can be used to override the full name in the templates.                                                                              |
| `service.type`                            | `ClusterIP`                   | The type of the Appsemble service.                                                                                                        |
| `service.port`                            | 80                            | The HTTP port on which the Appsemble service will be exposed to the cluster.                                                              |
| `ingress.enabled`                         | `true`                        | Whether or not the service should be exposed through an ingress.                                                                          |
| `ingress.className`                       | `nginx`                       | The ingress class name.                                                                                                                   |
| `ingress.annotations`                     |                               | Annotations for the Appsemble ingress.                                                                                                    |
| `ingress.host`                            | `''`                          | The host name on which the ingress will expose the service.                                                                               |
| `ingress.tls.secretName`                  | `nil`                         | The secret name to use to configure TLS for the top level host.                                                                           |
| `ingress.tls.wildcardSecretName`          | `nil`                         | The secret name to use to configure TLS for the direct wildcard host.                                                                     |
| `route.enabled`                           | `false`                       | Whether or not the service should be exposed through an OpenShift Route.                                                                  |
| `route.host`                              | `''`                          | The host name on which the route will expose the service.                                                                                 |
| `route.annotations`                       | `{}`                          | Annotations for the OpenShift Route.                                                                                                      |
| `route.tls.termination`                   | `edge`                        | TLS termination type: edge, passthrough, or reencrypt.                                                                                    |
| `route.tls.insecureEdgeTerminationPolicy` | `Redirect`                    | Policy for handling insecure traffic: Allow, Redirect, or None.                                                                           |
| `resources.deployment.limits.memory`      | `4Gi`                         | Memory limit for the main deployment container.                                                                                           |
| `resources.deployment.limits.cpu`         | `1`                           | CPU limit for the main deployment container.                                                                                              |
| `resources.deployment.requests.memory`    | `2Gi`                         | Memory request for the main deployment container.                                                                                         |
| `resources.deployment.requests.cpu`       | `100m`                        | CPU request for the main deployment container.                                                                                            |
| `resources.jobs.limits.memory`            | `1Gi`                         | Memory limit for Job containers (migrate, provision, etc.).                                                                               |
| `resources.jobs.limits.cpu`               | `1`                           | CPU limit for Job containers.                                                                                                             |
| `resources.jobs.requests.memory`          | `256Mi`                       | Memory request for Job containers.                                                                                                        |
| `resources.jobs.requests.cpu`             | `100m`                        | CPU request for Job containers.                                                                                                           |
| `resources.cronjobs.limits.memory`        | `256Mi`                       | Memory limit for CronJob containers.                                                                                                      |
| `resources.cronjobs.limits.cpu`           | `500m`                        | CPU limit for CronJob containers.                                                                                                         |
| `resources.cronjobs.requests.memory`      | `64Mi`                        | Memory request for CronJob containers.                                                                                                    |
| `resources.cronjobs.requests.cpu`         | `50m`                         | CPU request for CronJob containers.                                                                                                       |
| `resources.backupCronjob.limits.memory`   | `3Gi`                         | Memory limit for the backup CronJob container.                                                                                            |
| `resources.backupCronjob.limits.cpu`      | `1`                           | CPU limit for the backup CronJob container.                                                                                               |
| `resources.backupCronjob.requests.memory` | `1Gi`                         | Memory request for the backup CronJob container.                                                                                          |
| `resources.backupCronjob.requests.cpu`    | `100m`                        | CPU request for the backup CronJob container.                                                                                             |
| `nodeSelector`                            | `{}`                          |                                                                                                                                           |
| `tolerations`                             | `[]`                          |                                                                                                                                           |
| `affinity`                                | `{}`                          |                                                                                                                                           |
| `smtpSecret`                              | `smtp`                        | The secret to use for configuring SMTP. The secret should contain the following values: `host`, `port`, `secure`, `user`, `pass`, `from`. |
| `oauthSecret`                             | `nil`                         | The secret which holds client ids and client secrets for OAuth2 providers.                                                                |
| `sentry.allowedDomains`                   | `[]`                          | A list of domains on which Sentry integration will be enabled. Wildcards are supported.                                                   |
| `sentry.secret`                           | `nil`                         | The secret from which to read the [Sentry] DSN.                                                                                           |
| `sentry.environment`                      | `nil`                         | The environment to send with Sentry error reports.                                                                                        |
| `secretSecret`                            | `appsemble`                   | The Kubernetes secret which holds the `SECRET` environment variable.                                                                      |
| `cronjob.jobsHistoryLimit`                | 3                             | How long to keep logs for cronjobs in days.                                                                                               |
| `migrateTo`                               | `nil`                         | If specified, the database will be migrated to this specific version. To upgrade to the latest version, specify `next`.                   |
| `proxy`                                   | `false`                       | If `true`, The proxy is trusted for logging purposes.                                                                                     |
| `global`                                  |                               | Any `global` variables are shared between the Appsemble chart and its `postgresql` dependency chart.                                      |
| `global.postgresql.auth.existingSecret`   | `appsemble-postgresql-secret` | The secret from which to read the PostgreSQL password.                                                                                    |
| `global.postgresql.auth.username`         | `appsemble`                   | The name of the PostgreSQL user.                                                                                                          |
| `global.postgresql.auth.database`         | `appsemble`                   | The name of the PostgreSQL user.                                                                                                          |
| `postgresql`                              |                               | Any `postgresql` variables are passed into the `postgresql` dependency chart.                                                             |
| `postgresql.fullnameOverride`             | `appsemble-postgresql`        | The name used for the PostgreSQL database.                                                                                                |
| `postgresql.enabled`                      | `true`                        | Set this to false explicitly to not include a PostgreSQL installation. This is useful if the database is managed by another service.      |
| `postgresql.persistence.enabled`          | `false`                       | Enable to create a persistent volume for the data.                                                                                        |
| `remote`                                  | `null`                        | A remote Appsemble server to connect to in order to synchronize blocks.                                                                   |
| `securityEmail`                           | `security@appsemble.com`      | The default security contact email for reporting security vulnerabilities.                                                                |
| `postgresSSL`                             | `false`                       | If `true`, connect establish the PostgreSQL connection over SSL.                                                                          |
| `quotas.appEmail.enabled`                 | `false`                       | If `true`, enable app email quotas.                                                                                                       |
| `quotas.appEmail.dailyLimit`              | `10`                          | The maximum number of emails an app can send per day.                                                                                     |
| `quotas.appEmail.alertOrganizationOwner`  | `false`                       | If `true`, send an email to the organization owner when the daily limit is reached.                                                       |

[sentry]: https://sentry.io
