# Companion containers

## Table of Contents

## Introduction

The companion container feature allows you to create a custom API from a specified Docker image and
make requests to it. This way, custom functionality can be introduced to your Appsemble app.

This section mentions several Docker and Kubernetes terms. It is not a must to be familiar with
those technologies, however it is recommended to check out the [glossary](#glossary) section.

This is also strongly recommended if you are running an Appsemble instance locally.

## Glossary

This section provides a short explanation of the terms used in this article. For more information,
please refer to the documentations of [Docker](https://docs.docker.com/) and
[Kuberentes](https://kubernetes.io/docs/home/).

- `image` - In the context of Docker, images are blueprints that contain all the necessary
  instructions and dependencies to create a containerized environment. Images are pulled from a
  container registry. Images should be specified from 3 elements:
  `<registry name>`/`<image name>`:`<tag name>`

  Example: `docker.io/library/hello-world:latest`

- `container` - A container is the actual instance of the program, based on the image.

- `secret` - Secrets are a way to safely store data in the form of text used for security purposes,
  such as authentication. The secret object or resource has a name, in this case derived from the
  app name, which holds a list of key value pairs of secret names and values.

## Getting started

Each app can have one or more containers. To define a container a `name`, `image`, and `port` need
to be specified.

```yaml
containers:
  - name: my-api
    image: httpd
    port: 80
```

After adding this container definition and publishing the app the container will be created in the
backend. After that, a request can be made to the api.

## Connecting

To make a request to the API, you can use the
[container remapper](../06-remappers/04-data.mdx#remapper) which would generate the request url.

The remapper provides a shorthand for the container DNS
`<container-name>-<app-name>-<app-id>.companion-containers.svc.cluster.local`. Of course, this can
be used as url instead of the remapper as well.

## Optional data

The container definition accepts optional parameters which configure the container further.

### Environment

Here you can define environment variables for your container, if they are needed in your custom
backend. They can also be infered from cluster [secrets](#setting-up-secrets).

To use secret you need to specify them as the first entry of the example below.

```yaml
env:
  - name: SECRET
    value: secret
    useValueFromSecret: true
  - name: REMOTE
    value: https://appsemble.app
  - name: APP_ID
    value: '13' # replace with your app id
```

Here, `name` is the name of the secret object. This should be the same as your app name (whitespaces
replaced by `-`) and the number is the id of the app.

Example: If the app name was "Hello World" and its id was 1, the secret name would be "hello-world1"

The 'key' is the name specified of the secret as provided by the user in the "Secrets" page of the
app.

Note: Currently, only appServiceSecrets can be used to create secrets for companion containers.

### Metadata

Under the metadata property, the you can attach `annotations`, `labels`, `selectors`, and other
metadata for the companion container.

Example:

```yaml
metadata:
  selector:
    matchLabels:
      app.kubernetes.io/name: my-api
  labels:
    app.kubernetes.io/instance: my-api
  annotations:
    deployment.kubernetes.io/revision: '4'
    meta.helm.sh/release-name: my-api
    meta.helm.sh/release-namespace: companion-containers
```

### Resource limitations

Some container require additional `CPU` and `memory` usage to start. This can be configured by using
the `resources.limit` property. The default values for `cpu` and `memory` usage are `500m` or `0.5`
CPU and `512Mi` memory. If incorrect values are supplied (e.g., too large numbers), the resources
values will return to default.

```yaml
resources:
  limits:
    cpu: '1' # more CPU
    memory: '512Mi'
```

## Default container registry

The default container registry option is handy to make the code cleaner. It allows you to omit the
registry name from the image name.

You can set the default registry like this:

```yaml
name: My App
description: App to test companion containers
defaultPage: Main
registry: docker.io/library

containers:
  - name: first-container
    image: hello-world:latest
  - name: second-container
    image: another-registry.com/hello-world:latest
```

In this example, the `first-container`'s image will resolve to
`docker.io/library/hello-world:latest`. When using official docker images, the registry part can be
omitted.

The `second-container`'s image, will remain unchanged and will resolve to
`another-registry.com/hello-world:latest`.

## Container registry whitelist

For security reasons, there are restrictions to what images can be used in production. Allowed
images are ones from the official docker registry (`docker.io/library` or
`registry.hub.docker.com/library`) and from Appsemble container registry
(`registry.gitlab.com/appsemble/`).

Note that images from custom registries in dockerhub are not permitted.

### Examples

Example of image notations that will be allowed:

- `docker.io/library/hello-world`
- `registry.hub.docker.com/library/hello-world`
- `hello-world`
- `library/hello-world`
- `registry.gitlab.com/appsemble/some-image`
- `registry.gitlab.com/appsemble/core`

Example of image notations that will not be allowed:

- `docker.io/library/my-registry/hello-world`
- `my-registry/hello-world`
- `registry.my-host.com/hello-world`

## Setting up secrets

Sometimes, a secret is needed for the companion container to work (e.g., the pdf generator api).
Fortunately, when creating an AppServiceSecret from the Secrets page of the app, a Kubernetes secret
is created automatically in the backend.

Make sure to check the [Service Secret](./service.md) documentation.

In the container definition, secrets can be accessed as described in the [environment](#environment)
section.
