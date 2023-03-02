# Docker Compose

Appsemble is published as a Docker image. This makes it easy to deploy using
[Docker Compose](https://docs.docker.com/compose). The image is already setup in the repository. You
can find the files `.docker-compose.yaml` and `dockerfile` in the project root.

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
Appsemble git repository and continue to the
[Publishing blocks readme](https://gitlab.com/appsemble/appsemble/blob/main/README.md#publishing-blocks).

[appsemble tags page]: https://hub.docker.com/r/appsemble/appsemble/tags
