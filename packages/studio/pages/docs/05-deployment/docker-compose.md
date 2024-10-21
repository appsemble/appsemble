# Docker Compose

Appsemble is published as a Docker image. This makes it easy to deploy using
[Docker Compose](https://docs.docker.com/compose). Copy the following contents in a file named
_.docker-compose.yml_.

```yaml copy filename="docker-compose.yml"
version: '3.5'

x-database-name: &database-name ${DATABASE_NAME:-appsemble_database_name}
x-database-user: &database-user ${DATABASE_USER:-appsemble_database_user}
x-database-password: &database-password ${DATABASE_PASSWORD:-appsemble_database_password}
x-secret: &secret ${SECRET:-appsemble_secret_LwP4gsYuuoFb3dRhEW_4iPVPLcfIvsDuBHDJHDbjQ}

networks:
  appsemble:
    name: appsemble

services:
  appsemble:
    image: appsemble/appsemble:latest
    depends_on:
      - postgresql
    networks:
      - appsemble
    restart: always
    environment:
      DATABASE_HOST: postgresql
      DATABASE_NAME: *database-name
      DATABASE_USER: *database-user
      DATABASE_PASSWORD: *database-password
      HOST: http://localhost:8000
      SECRET: *secret
    ports:
      # Expose Appsemble at port 8000.
      - '8000:9999'

  postgresql:
    image: postgres:15
    networks:
      - appsemble
    restart: always
    environment:
      POSTGRES_DB: *database-name
      POSTGRES_USER: *database-user
      POSTGRES_PASSWORD: *database-password
    volumes:
      - $HOME/.local/share/appsemble-postgresql:/var/lib/postgresql/data
    ports:
      - '5432:5432'
```

It is highly recommended to specify the version of the `appsemble/appsemble` image to use. Replace
`latest` with a specific version. All available versions can be found on
[Appsemble tags page](https://hub.docker.com/r/appsemble/appsemble/tags) on Docker Hub.

It is also recommended to modify the database name, user, password and the Appsemble secret.

A user can configure the SMTP connection settings in the `docker-compose.yml` file as well. The
following environment variables can be defined for configuring SMTP server.

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Similar to the example provided
[here](https://gitlab.com/appsemble/appsemble/-/tree/main/packages/server?ref_type=heads#smtp),
Mailpit can be used inside a docker container. Instructions for setting up the Mailpit server inside
a container can be found
[on this page](https://mailpit.axllent.org/docs/install/docker/#docker-compose-example).

---

**🛈NOTE**

> Users can also configure SMTP servers for individual apps in the studio. This is documented
> [here](../02-core-concepts/App.md#secrets). If no SMTP server is configured for an app, this
> server will be used as fallback.

---

A wide range of other services like [sentry](https://sentry.io), [GitHub](https://github.com),
[GitLab](https://gitlab.com) etc can be configured using various environment variables. For a
detailed list of available options, find the `defaults` constant in
[this file](https://gitlab.com/appsemble/appsemble/-/blob/main/packages/server/utils/argv.ts)

To start the service, run the following command.

```sh
$ docker compose up -d
```

The Appsemble studio should now be available on [localhost:8000](http://localhost:8000). The
database will be stored in `~/.local/share/appsemble-postgresql` in your own home folder.

The database needs to be migrated to the current version first. This can be done by running:

```sh
$ docker run --network=appsemble \
  -it appsemble/appsemble:latest migrate \
  --database-host postgresql \
  --database-name appsemble_database_name \
  --database-user appsemble_database_user \
  --database-password appsemble_database_password
```

To stop the service, run the following command.

```sh
$ docker compose down
```
