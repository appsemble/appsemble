# Docker Compose

Appsemble is published as a Docker image. This makes it easy to deploy using
[Docker Compose](https://docs.docker.com/compose). You will find the following contents in a file
named _.docker-compose.yaml_.

```yaml copy filename="docker-compose.yml"
version: '3.3'

services:
  # A persistent database for local development.
  postgres-dev:
    image: postgres:14
    restart: always
    environment:
      POSTGRES_DB: appsemble
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'

  # A database using tmpfs for faster test runs.
  postgres-test:
    image: postgres:14
    restart: always
    environment:
      POSTGRES_DB: appsemble
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - '54321:5432'
    tmpfs:
      - /var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4
    restart: always
    environment:
      PGADMIN_DEFAULT_EMAIL: info@appsemble.com
      PGADMIN_DEFAULT_PASSWORD: password
    ports:
      - '2345:80'
```

It is highly recommended to specify the version of the `appsemble/appsemble` image to use. Replace
`latest` with a specific version. All available versions can be found on [Appsemble tags page][] on
Docker Hub.

It is also recommended to modify the database name, user, and password, and the Appsemble secret.

To start the service, run the following command.

```
$ docker compose up -d
```

If this

The Appsemble studio should now be available on [localhost:9999](http://localhost:9999). The
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

```
$ docker compose down
```

Once Appsemble is up and running, you probably want to upload blocks. In order to do this, clone the
Appsemble git repository and continue to the section on publishing blocks in the
[readme](https://gitlab.com/appsemble/appsemble/blob/main/README.md#publishing-blocks).

[appsemble tags page]: https://hub.docker.com/r/appsemble/appsemble/tags
