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
  --from-literal 'postgresql-postgres-password=my-password' \
  --from-literal 'postgresql-replication-password=my-postgresql-replication-password'
```

> **Caution**: Make sure not to lose the PostgreSQL passwords!

Next an SMTP secret is needed for sending emails.

```sh
kubectl create secret generic smtp \
  --from-literal 'host=my-smtp-host'
  --from-literal 'port=my-smtp-port'
  --from-literal 'secure=my-smtp-secure'
  --from-literal 'user=my-smtp-user'
  --from-literal 'pass=my-smtp-pass'
  --from-literal 'from=my-smtp-from'
```

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

Now the chart can be installed.

```sh
helm repo add appsemble https://charts.appsemble.com
helm repo update
helm install --name my-appsemble appsemble/appsemble --set 'global.postgresql.existingSecret=postgresql-secret'
```

### Upgrading

```sh
helm repo update
helm upgrade my-appsemble appsemble/appsemble --set 'global.postgresql.existingSecret=postgresql-secret'
```

## Variables

| Name                                   | Default                       | Description                                                                                                                               |
| -------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `replicaCount`                         | 1                             |                                                                                                                                           |
| `image.repository`                     | `appsemble/appsemble`         | Set this to `registry.gitlab.io/appsemble/appsemble` to support prerelease versions.                                                      |
| `image.tag`                            | `nil`                         | If specified, this Docker image tag will be used. Otherwise, it will use the chart’s `appVersion`.                                        |
| `image.pullPolicy`                     | `IfNotPresent`                | This can be used to override the default image pull policy.                                                                               |
| `nameOverride`                         | `''`                          | This can be used to override the name in the templates.                                                                                   |
| `fullnameOverride`                     | `''`                          | This can be used to override the full name in the templates.                                                                              |
| `service.type`                         | `ClusterIP`                   | The type of the Appsemble service.                                                                                                        |
| `service.port`                         | 80                            | The HTTP port on which the Appsemble service will be exposed to the cluster.                                                              |
| `ingress.enabled`                      | `true`                        | Whether or not the service should be exposed through an ingress.                                                                          |
| `ingress.className`                    | `nginx`                       | The ingress class name.                                                                                                                   |
| `ingress.annotations`                  |                               | Annotations for the Appsemble ingress.                                                                                                    |
| `ingress.host`                         | `''`                          | The host name on which the ingress will expose the service.                                                                               |
| `ingress.tls.secretName`               | `nil`                         | The secret name to use to configure TLS for the top level host.                                                                           |
| `ingress.tls.wildcardSecretName`       | `nil`                         | The secret name to use to configure TLS for the direct wildcard host.                                                                     |
| `resources`                            | `{}`                          |                                                                                                                                           |
| `nodeSelector`                         | `{}`                          |                                                                                                                                           |
| `tolerations`                          | `[]`                          |                                                                                                                                           |
| `affinity`                             | `{}`                          |                                                                                                                                           |
| `smtpSecret`                           | `smtp`                        | The secret to use for configuring SMTP. The secret should contain the following values: `host`, `port`, `secure`, `user`, `pass`, `from`. |
| `oauthSecret`                          | `nil`                         | The secret which holds client ids and client secrets for OAuth2 providers.                                                                |
| `sentryAllowedDomains`                 | `[]`                          | A list of domains on which Sentry integration will be enabled. Wildcards are supported.                                                   |
| `sentrySecret`                         | `nil`                         | The secret from which to read the [Sentry] DSN.                                                                                           |
| `sentryEnvironment`                    | `nil`                         | The environment to send with Sentry error reports.                                                                                        |
| `secretSecret`                         | `appsemble`                   | The Kubernetes secret which holds the `SECRET` environment variable.                                                                      |
| `aesSecret`                            | `appsemble`                   | The Kubernetes secret which holds the `AES-SECRET` environment variable.                                                                  |
| `cronjob.jobsHistoryLimit`             | 3                             | How long to keep logs for cronjobs in days.                                                                                               |
| `migrateTo`                            | `nil`                         | If specified, the database will be migrated to this specific version. To upgrade to the latest version, specify `next`.                   |
| `proxy`                                | `false`                       | If `true`, The proxy is trusted for logging purposes.                                                                                     |
| `global`                               |                               | Any `global` variables are shared between the Appsemble chart and its `postgresql` dependency chart.                                      |
| `global.postgresql.existingSecret`     | `appsemble-postgresql-secret` | The secret from which to read the PostgreSQL password.                                                                                    |
| `global.postgresql.postgresqlUsername` | `appsemble`                   | The name of the PostgreSQL user.                                                                                                          |
| `global.postgresql.postgresqlDatabase` | `appsemble`                   | The name of the PostgreSQL user.                                                                                                          |
| `postgresql`                           |                               | Any `postgresql` variables are passed into the `postgresql` dependency chart.                                                             |
| `postgresql.fullnameOverride`          | `appsemble-postgresql`        | The name used for the PostgreSQL database.                                                                                                |
| `postgresql.enabled`                   | `true`                        | Set this to false explicitly to not include a PostgreSQL installation. This is useful if the database is managed by another service.      |
| `postgresql.persistence.enabled`       | `false`                       | Enable to create a persistent volume for the data.                                                                                        |
| `remote`                               | `null`                        | A remote Appsemble server to connect to in order to synchronize blocks.                                                                   |
| `postgresSSL`                          | `false`                       | If `true`, connect establish the PostgreSQL connection over SSL.                                                                          |

[sentry]: https://sentry.io
