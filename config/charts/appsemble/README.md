# Appsemble Helm Chart

## Installing

New installation:

```sh
helm dependency update config/charts/appsemble
helm install --name my-release config/charts/appsemble
```

```sh
helm dependency update config/charts/appsemble
helm upgrade my-release config/charts/appsemble --set 'mysql.existingSecret=my-secret'
```

> **Note**: Appsemble isn’t published yet. Clone the repository and specify the path to the chart.

## Variables

| Name                     | Default               | Description                                                                                                                                                 |
| ------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `replicaCount`           | 1                     |                                                                                                                                                             |
| `image.repository`       | `appsemble/appsemble` | Set this to `registry.gitlab.io/appsemble/appsemble` to support prerelease versions.                                                                        |
| `image.tag`              | `nil`                 | If specified, this Docker image tag will be used. Otherwise, it will use the chart’s `appVersion`.                                                          |
| `image.pullPolicy`       | `IfNotPresent`        | This can be used to override the default image pull policy.                                                                                                 |
| `app`                    | `appsemble`           | The app annotation for Appsemble related resources.                                                                                                         |
| `nameOverride`           | `''`                  | This can be used to override the name in the templates.                                                                                                     |
| `fullnameOverride`       | `''`                  | This can be used to override the full name in the templates.                                                                                                |
| `service.type`           | `ClusterIP`           | The type of the Appsemble service.                                                                                                                          |
| `service.port`           | 80                    | The HTTP port on which the Appsemble service will be exposed to the cluster.                                                                                |
| `ingress.enabled`        | `true`                | Whether or not the the service should be exposed through an ingress.                                                                                        |
| `ingress.annotations`    |                       | Annotations for the Appsemble ingress.                                                                                                                      |
| `ingress.hosts`          | `[]`                  | The hosts names on which the ingress will expose the service.                                                                                               |
| `ingress.tls.secretName` | `nil`                 | The secret name to use to configure TLS.                                                                                                                    |
| `resources`              | `{}`                  |                                                                                                                                                             |
| `nodeSelector`           | `{}`                  |                                                                                                                                                             |
| `tolerations`            | `[]`                  |                                                                                                                                                             |
| `affinity`               | `{}`                  |                                                                                                                                                             |
| `smtpSecret`             | `smtp`                | The secret to use for configuring SMTP. The secret should contain the following values: `host`, `port`, `secure`, `user`, `pass`, `from`.                   |
| `migrateTo`              | `nil`                 | If specified, the database will be migrated to this specific version. To upgrade to the latest version, just specify a very high number. E.g. `999.999.999` |
| `mysql`                  |                       | Any `mysql` variables are passed into the `mysql` dependency chart.                                                                                         |
| `mysql.existingSecret`   | `mysql-password`      | The name of the MySQL secret to use. Appsemble requires this.                                                                                               |
| `mysql.mysqlUser`        | `appsemble`           |                                                                                                                                                             |
| `mysql.mysqlDatabase`    | `appsemble`           |                                                                                                                                                             |
| `mysql.fullnameOverride` | `mysql-appsemble`     | The Appsemble chart passes this to the `mysql` chart, but it also uses this variable itself.                                                                |

## Secrets

### MySQL

Appsemble uses the [MySQL subchart][]. If `mysql.existingSecret` is set, Appsemble will use this
secret to connect to the MySQL database. Otherwise, the MySQL subchart will create this secret for
you and Appsemble will use that one.

### SMTP

Appsemble requires SMTP variables to send emails. These should be stored in a predefined SMTP
secret.

[mysql subchart]: https://hub.helm.sh/charts/stable/mysql
