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
    image: postgres:11
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
`latest` with a specific version. All available versions can be found on [Appsemble tags
page][https://hub.docker.com/r/appsemble/appsemble/tags] on Docker Hub.

It is also recommended to modify the database name, user, and password, and the Appsemble secret.

To start the service, run the following command.

```
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

```
$ docker compose down
```
