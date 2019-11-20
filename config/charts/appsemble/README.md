# Appsemble Helm Chart

## Installing

### New installation

It is recommended to create a PostgreSQL secret beforehand.

```sh
kubectl create secret generic postgresql-secret \
  --from-literal 'postgresql-password=my-password' \
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

Appsemble integrates with [Sentry] for error reporting. This requires to configure a Sentry DSN.
This is read from a secret.

```sh
kubectl create secret generic sentry \
  --from-literal 'dsn=my-dsn'
```

Now the chart can be installed.

```sh
helm dependency update config/charts/appsemble
helm install --name my-release config/charts/appsemble --set 'global.postgresql.existingSecret=postgresql-secret'
```

> **Note**: Appsemble isn’t published yet. Clone the repository and specify the path to the chart.

### Upgrading

```sh
helm dependency update config/charts/appsemble
helm upgrade my-release config/charts/appsemble --set 'global.postgresql.existingSecret=postgresql-secret'
```

## Variables

| Name                                   | Default                       | Description                                                                                                                                                 |
| -------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `replicaCount`                         | 1                             |                                                                                                                                                             |
| `image.repository`                     | `appsemble/appsemble`         | Set this to `registry.gitlab.io/appsemble/appsemble` to support prerelease versions.                                                                        |
| `image.tag`                            | `nil`                         | If specified, this Docker image tag will be used. Otherwise, it will use the chart’s `appVersion`.                                                          |
| `image.pullPolicy`                     | `IfNotPresent`                | This can be used to override the default image pull policy.                                                                                                 |
| `app`                                  | `appsemble`                   | The app annotation for Appsemble related resources.                                                                                                         |
| `nameOverride`                         | `''`                          | This can be used to override the name in the templates.                                                                                                     |
| `fullnameOverride`                     | `''`                          | This can be used to override the full name in the templates.                                                                                                |
| `service.type`                         | `ClusterIP`                   | The type of the Appsemble service.                                                                                                                          |
| `service.port`                         | 80                            | The HTTP port on which the Appsemble service will be exposed to the cluster.                                                                                |
| `ingress.enabled`                      | `true`                        | Whether or not the the service should be exposed through an ingress.                                                                                        |
| `ingress.annotations`                  |                               | Annotations for the Appsemble ingress.                                                                                                                      |
| `ingress.host`                         | `''`                          | The hosts name on which the ingress will expose the service.                                                                                                |
| `ingress.tls.secretName`               | `nil`                         | The secret name to use to configure TLS.                                                                                                                    |
| `resources`                            | `{}`                          |                                                                                                                                                             |
| `nodeSelector`                         | `{}`                          |                                                                                                                                                             |
| `tolerations`                          | `[]`                          |                                                                                                                                                             |
| `affinity`                             | `{}`                          |                                                                                                                                                             |
| `smtpSecret`                           | `smtp`                        | The secret to use for configuring SMTP. The secret should contain the following values: `host`, `port`, `secure`, `user`, `pass`, `from`.                   |
| `sentrySecret`                         | `nil`                         | The secret from which to read the [Sentry] DSN.                                                                                                             |
| `migrateTo`                            | `nil`                         | If specified, the database will be migrated to this specific version. To upgrade to the latest version, just specify a very high number. E.g. `999.999.999` |
| `global`                               |                               | Any `global` variables are shared between the Appsemble chart and its `postgresql` dependency chart.                                                        |
| `global.postgresql.existingSecret`     | `appsemble-postgresql-secret` | The secret from which to read the PostgreSQL password.                                                                                                      |
| `global.postgresql.postgresqlUsername` | `appsemble`                   | The name of the PostgreSQL user.                                                                                                                            |
| `global.postgresql.postgresqlDatabase` | `appsemble`                   | The name of the PostgreSQL user.                                                                                                                            |
| `postgresql`                           |                               | Any `postgresql` variables are passed into the `postgresql` dependency chart.                                                                               |
| `postgresql.fullnameOverride`          | `appsemble-postgresql`        | The name used for the PostgreSQL database.                                                                                                                  |
| `postgresql.enabled`                   | `true`                        | Set this to false explicitly to not include a PostgreSQL installation. This is useful if the database is managed by another service.                        |
| `postgresql.persistence.enabled`       | `false`                       | Enable to create a persistent volume for the data.                                                                                                          |
| `postgresSSL`                          | `false`                       | If `true`, connect establish the PosgreSQL connection over SSL.                                                                                             |

[sentry]: https://sentry.io
