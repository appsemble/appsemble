# Custom APIs and local Kubernetes

As a developer, you may want to write custom APIs for your Appsemble apps to do things not included
in Appsemble’s back end.

If you’re running Appsemble locally, you can run your API locally as well, and access it by sending
requests to `127.0.0.1`.

But if you’re running Appsemble deployed on a Kubernetes cluster, it’s probably a good idea to run
your API on the same cluster as well, and to restrict access to it from within the cluster.

This document will show you how to do that.

- [Custom APIs and local Kubernetes](#custom-apis-and-local-kubernetes)
  - [Prerequisites](#prerequisites)
  - [What this document is not](#what-this-document-is-not)
  - [Brief Kubernetes glossary](#brief-kubernetes-glossary)
  - [Crash course into using microk8s commands](#crash-course-into-using-microk8s-commands)
  - [Deploying Appsemble locally](#deploying-appsemble-locally)
    - [Appsemble and Helm](#appsemble-and-helm)
    - [DNS mapping](#dns-mapping)
    - [Publishing blocks/apps to the locally deployed server](#publishing-blocksapps-to-the-locally-deployed-server)
  - [Deploying a custom API locally](#deploying-a-custom-api-locally)
    - [Building docker images](#building-docker-images)
    - [Setting up the cluster](#setting-up-the-cluster)
    - [Installing the API](#installing-the-api)
  - [Using your custom API from Appsemble apps](#using-your-custom-api-from-appsemble-apps)
  - [Troubleshooting/FAQ](#troubleshootingfaq)
    - [Already installed a helm chart?](#already-installed-a-helm-chart)
    - [Messed something up/want to uninstall?](#messed-something-upwant-to-uninstall)
      - [Uninstall hanging?](#uninstall-hanging)
    - [Removing `PersistentVolumeClaim`s](#removing-persistentvolumeclaims)
    - [HTTP error `413 Request Entity Too Large`](#http-error-413-request-entity-too-large)
    - [Apps are served over SSL but Appsemble isn’t, various other SSL errors](#apps-are-served-over-ssl-but-appsemble-isnt-various-other-ssl-errors)

## Prerequisites

This document assumes you’re using Ubuntu 20.04 or later, with `snap` installed and `systemd` as the
init system. If you’re using a different Linux distribution, you might need to adapt some commands
to your distribution’s package manager and init system.

- [`microk8s`](https://microk8s.io/)
  - alternatives:
    - [`minikube`](https://minikube.sigs.k8s.io/docs/start/)
    - [`k3s`](https://k3s.io/)
    - [`k0s`](https://k0sproject.io/)
- [`helm`](https://helm.sh/)
  - comes with microk8s, but you can also install it separately
- [`kubectl`](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
  - comes with microk8s, but you can also install it separately
- [`docker`](https://docs.docker.com/get-docker/)
- [`dnsmasq`] or a [hosts file]
  - for accessing Appsemble at `http://appsemble` and apps at `http://app-name.appsemble.appsemble`
  - see more in [CONTRIBUTING.md]

## What this document is not

- A tutorial on writing HTTP APIs
- A tutorial on writing Kubernetes manifests
- A tutorial on writing helm charts

This document assumes you either know a bit about those things, or that you can look them up
yourself.

## Brief Kubernetes glossary

- `label`, `annotation` - key-value pairs that can be attached to Kubernetes objects
  - looks like this: `app.kubernetes.io/name: appsemble`
  - or this: `app.gitlab.com/env: review-1234-foobar`
- `selector` - a rule that matches labels and annotations
- `pod` - a group of containers that are deployed together on the same node - the smallest unit of
  deployment
- `service` - maps a name and ports to pods matching a `selector`, or to an `externalname`
  - `ClusterIP` - maps name/ports to IP address within the cluster
  - `NodePort` - exposes a service on each node in the cluster using the same port, accessible from
    outside the cluster
  - `LoadBalancer` - exposes a service using a cloud provider’s load balancer
  - `ExternalName` - maps a name to an external name, like a `CNAME` DNS record
- `ingress` - a way to expose a service to the internet - matches request hostnames to services
- `deployment` - a group of pods, ingress, services, etc that are deployed together
- `secret` - a way to store sensitive data (e.g. passwords, API keys, etc) - can be used as
  environment variables or mounted as files
- `namespace` - a way to group Kubernetes objects together - you can have multiple namespaces on the
  same cluster, and they won’t interfere with each other
- `helm chart` - a way of defining configurable Kubernetes objects using a special templating
  language
  - it lets you configure a Kubernetes project using a `values.yml` file, and then easily deploy it
    using `helm install` or `helm upgrade`
- DNS within the cluster:
  - `service-name.ns-name.svc.cluster.local` - resolves to a service within the cluster’s `ns-name`
    namespace, named `service-name`
  - unless you have an `ingress` or an `externalname` service, you can only access services from
    within the same namespace, within the cluster

## Crash course into using microk8s commands

- installing `microk8s`
  - `snap install microk8s --classic` on Linux
  - [See here for other platforms](https://microk8s.io/docs/install-alternatives)
- set up aliases
  - `snap alias microk8s.kubectl kubectl`
  - `snap alias microk8s.helm helm`
- `microk8s status --wait-ready` on first install
- `microk8s start` and `microk8s stop` to save your RAM from Kubernetes when you’re not using it
- `microk8s enable registry dashboard dns ingress` to enable some useful add-ons
  - `microk8s enable registry` is required for pushing images to the cluster
  - `microk8s enable dashboard` is required for accessing the Kubernetes dashboard
  - `microk8s enable dns` is required for accessing services by name
  - `microk8s enable ingress` is required for accessing services from outside the cluster
- run `source <(kubectl completion zsh)` (or `bash` or whichever shell you’re using) to get
  `TAB`-completions
- run `kubectl get all` to see what’s running, what’s yet to run and what’s broken
- run `kubectl describe pod/pod-name` (use tab-completions here) to see what’s going on with a
  pod/deployment/whatever
- run `kubectl logs deployments/appsemble` to check the logs for a pod/deployment/etc
  - `kubectl logs -f` to wait new logs instead of printing existing ones and quitting
- run `kubectl create namespace appsemble` to create a namespace
  - you can then pass the `--namespace` / `-n` flag to `kubectl` commands

## Deploying Appsemble locally

You can follow the [Appsemble chart README]. However, it’s recommended that you use the
`--namespace` flag as well when creating secrets _and_ installing with helm, to match more closely
the [production setup](https://gitlab.com/appsemble/infra/-/wikis/setup/production) in the infra
repository.

### Appsemble and Helm

First, create a Kubernetes namespace.

```sh
kubectl create namespace appsemble
```

Then, setup the required secrets as described in the README.

- when creating secrets, you can leave SMTP secrets empty like this: `host=`
  - **you still need to create the SMTP secret** - the Appsemble chart needs that secret defined to
    work
- you can skip the optional secrets

Finally we can install the chart.

```sh
# We want to set a few more values than currently described in the README
helm install \
    --namespace appsemble \
    appsemble `# name with which the deployment will be registered in helm` \
    appsemble/appsemble \
    --set 'global.postgresql.auth.existingSecret=postgresql-secret' \
    --set 'ingress.host=appsemble' `# absolutely necessary, this is the hostname you'll access the studio from` \
    `# if you don’t want to use SSL locally` \
    --set  'ingress.annotations.nginx\.ingress\.kubernetes\.io/ssl-redirect="false"' \
    --set 'ingress.annotations.nginx\.ingres\.kubernetes\.io/force-ssl-redirect="false"' \
    `# or: if you want to use SSL locally, but don’t have a certificate` \
    --set 'ingress.tls.secretName=""'
```

If you want to set more values, you can also create a `values.yml` file somewhere, and pass
`-f path/to/values.yml` instead of using many `--set` flags. Refer to the [Appsemble chart README]
for all the variables you can set.

If you already have Appsemble installed, you should use `helm upgrade` instead of `helm install`. If
you want to uninstall Appsemble, you can use `helm uninstall appsemble`.

### DNS mapping

In order to access a locally deployed Appsemble, you need to map the `appsemble` hostname to your
local machine. You can do that through either `/etc/hosts` or `dnsmasq`:

`/etc/hosts`:

```sh
# /etc/hosts
127.0.0.1 appsemble
127.0.0.1 app-name.orgname.appsemble
```

`/etc/dnsmasq.conf`:

```ini
address=/appsemble/127.0.0.1
address=/.appsemble.appsemble/127.0.0.1
address=/.orgname.appsemble/127.0.0.1
```

If `dnsmasq` is not working for you, try adding it to your DNS servers: `/etc/resolv.conf`:

```
nameserver 127.0.0.53
```

Don’t forget to start/restart `dnsmasq` after editing its configuration -
`systemctl restart dnsmasq`.

### Publishing blocks/apps to the locally deployed server

In order to make use of the locally deployed Appsemble, you need to publish your blocks/apps to it
(or at least the `empty` app, to use as a template for new apps).

You need to pass the appropriate `--remote` flag to the Appsemble CLI when doing that:

```sh
NODE_TLS_REJECT_UNAUTHORIZED='0' npm run appsemble -- block publish --remote https://appsemble blocks/*
NODE_TLS_REJECT_UNAUTHORIZED='0' npm run appsemble -- app publish --remote https://appsemble --context review apps/*
# you might need NODE_TLS_REJECT_UNAUTHORIZED=0 to get around certificate errors locally
```

We’re using `--context review` here because it usually doesn’t set `remote` or `appId` in the
`.appsemblerc`, but still sets `organization`. You can omit the `context` flag if you set `--remote`
and `--organization` in the command you’re using.

## Deploying a custom API locally

### Building docker images

Build the Appsemble docker image if you have local changes:

```sh
docker buildx build -t appsemble:custom-things .
```

Then, push it to the microk8s registry:

```sh
docker tag appsemble:custom-things localhost:32000/appsemble:custom-things
docker push localhost:32000/appsemble:custom-things
```

Next we need to build whichever docker images we need for our custom API.

```sh
docker build -t localhost:32000/my-custom-api:0.0.1 .
docker push localhost:32000/my-custom-api:0.0.1
```

As an example, we can use this simple API that returns a JSON response:

```sh
docker build -t localhost:32000/my-custom-api:0.0.1 - << EOF
FROM node:20.18-bookworm-slim

WORKDIR /app
RUN npm install express
RUN tee index.mjs <<EOT
  import express from 'express';
  const app = express();

  app.post('/api/endpoint', (req, res) =>
    Math.random() < 0.5 ?
      res.status(500).json({ error: 'Something went wrong' }) :
      res.json({ message: 'Hello World!' })
  );

  app.listen(8080, () => console.log('Listening on port 8080'));
EOT

CMD ["node", "index.mjs"]
EOF
```

And we can use the following helm chart to deploy it:

```yaml
# charts/my-custom-api/values.yml
image:
  repository: localhost:32000/my-custom-api
  pullPolicy: Always
  tag: 0.0.1
```

```yaml
# charts/my-custom-api/Chart.yaml
apiVersion: v2
name: my-custom-api
version: 0.0.1
```

```yaml
# charts/my-custom-api/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-custom-api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-custom-api
  template:
    metadata:
      labels:
        app: my-custom-api
    spec:
      containers:
        - name: my-custom-api
          image: '{{ .Values.image.repository }}:{{ .Values.image.tag }}'
          imagePullPolicy: { { .Values.image.pullPolicy } }
          ports:
            - name: http
              containerPort: 8080
```

```yaml
# charts/my-custom-api/templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-custom-api
spec:
  type: ClusterIP
  ports:
    - name: http
      port: 80
      targetPort: 8080
  selector:
    app: my-custom-api
```

### Setting up the cluster

Create a namespace for your custom API, for example, based on the organization it’s for:

```sh
kubectl create namespace orgname
```

If your custom API needs secrets, create them:

```sh
kubectl --namespace orgname create secret generic my-custom-api-secret --from-literal "secret=$(uuidgen)"
# you can then get the secret you generated with:
kubectl --namespace orgname get secret/my-custom-api-secret -o jsonpath="{.data.secret}" | base64 -d
```

If your API needs access back to Appsemble, you can create an `externalname` service for it:

```sh
# IMPORTANT: whatever you put as the external name here should match the `ingress.host` of the appsemble chart you installed
kubectl --namespace orgname create service externalname --external-name appsemble.appsemble.svc.cluster.local appsemble
# or
kubectl --namespace orgname create service externalname --external-name appsemble.appsemble.svc.cluster.local appsemble.app
```

(_You should only need this locally - in production, you can use Appsemble’s actual hostname
directly_)

### Installing the API

Create a `values.yml` file for your custom API:

```yaml
image:
  repository: localhost:32000/my-custom-api
  pullPolicy: Always
  tag: 0.0.1
# set any other values you might have
```

Then, install your helm chart:

```sh
helm install --namespace orgname my-custom-api charts/my-custom-api -f path/to/values.yml
```

Finally, you should get an URL like this from helm after installing:

```
http://my-custom-api.orgname.svc.cluster.local/
```

## Using your custom API from Appsemble apps

Check the [Appsemble service/secret docs](../guides/service.md) for more info on how to configure
your API’s authentication.

You can use your API from an app like this:

```yaml
name: Custom API test
description: ''
defaultPage: Test

# `security` and `roles` are both needed for service secrets to work
security:
  default:
    role: User
    policy: everyone
  roles:
    User: {}

roles: [User]

pages:
  - name: Test
    blocks:
      - type: button-list
        version: 0.34.1-test.3
        actions:
          handle:
            type: request
            url: http://my-custom-api.orgname.svc.cluster.local/api/endpoint
            proxy: true
            method: post
            body:
              object.from:
                key1: value1
                key2: value2
            onSuccess:
              type: message
              body: { prop: message }
              color: success
            onError:
              type: message
              body: { prop: message }
              color: danger
        parameters:
          buttons:
            - label: Click Me
              onClick: handle
```

This example app will send a POST request to your API that looks like this:

```http
HTTP/1.1 POST /api/endpoint
Host: my-custom-api.orgname.svc.cluster.local
Content-Type: application/json
Content-Length: 42

{
  "key1": "value1",
  "key2": "value2"
}
```

And will expect a response that looks like this:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 31

{
  "message": "Hello World!"
}
```

Or like this:

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
Content-Length: 37

{
  "error": "Something went wrong"
}
```

Good luck!

## Troubleshooting/FAQ

### Already installed a helm chart?

Use `helm upgrade` then

### Messed something up/want to uninstall?

```sh
helm uninstall <chart-name>
```

#### Uninstall hanging?

```sh
helm uninstall <chart-name> --debug --no-hooks
```

This might result in data loss/broken state, _don’t run anywhere except locally_

### Removing `PersistentVolumeClaim`s

If you want to clear data, or if you’re having problems with `bitnami/postgresql` (e.g.
`mkdir: cannot create directory ‘/bitnami/postgresql/data’: Permission denied`)

```sh
kubectl -n appsemble delete pvc data-appsemble-postgresql-0
```

### HTTP error `413 Request Entity Too Large`

This might happen when publishing large blocks/apps (e.g. `form` block) to Appsemble.

```sh
kubectl patch -n ingress configmap nginx-load-balancer-microk8s-conf -p '{"data": {"proxy-body-size": "0"}}'
```

[source](https://stackoverflow.com/a/67607158/5714186)

### Apps are served over SSL but Appsemble isn’t, various other SSL errors

Go back to [Deploying Appsemble locally](#deploying-appsemble-locally) and read the `--set` flags
again.

If that doesn’t resolve it, there’s two things you can do:

1. Try getting rid of cache/HSTS entries
   - in Chrome: `chrome://net-internals/#hsts` -> `Delete domain security policies` -> `appsemble`
     \-> `Delete`
   - in Firefox: `about:preferences#privacy` -> `Manage Data` -> search for `appsemble` ->
     `Remove Selected`
     - **NOTE**: this will remove all site data for `appsemble`, not just HSTS entries. Try clearing
       cache and restarting Firefox first.
   - finally, clear your browser cache
2. Edit the ingress(es) to remove TLS
   - Manually
     - `kubectl -n appsemble edit ingress/appsemble`
       - delete/comment out the `spec.tls` section
       - change the `nginx.ingress.kubernetes.io/ssl-redirect` and
         `nginx.ingress.kubernetes.io/force-ssl-redirect` annotations to `false`
       - do the same for `ingress/appsemble-appsemble`
   - With commands
   ```sh
   kubectl -n appsemble patch ingress/appsemble -p '{"spec": {"tls": []}}'`
   kubectl -n appsemble patch ingress/appsemble-appsemble -p '{"spec": {"tls": []}}'`
   kubectl -n appsemble patch ingress/appsemble -p '{"metadata": {"annotations": {"nginx.ingress.kubernetes.io/ssl-redirect": "false", "nginx.ingress.kubernetes.io/force-ssl-redirect": "false"}}}'`
   kubectl -n appsemble patch ingress/appsemble-appsemble -p '{"metadata": {"annotations": {"nginx.ingress.kubernetes.io/ssl-redirect": "false", "nginx.ingress.kubernetes.io/force-ssl-redirect": "false"}}}'`
   ```

[Appsemble chart README]: https://gitlab.com/appsemble/appsemble/tree/main/config/charts/appsemble
[CONTRIBUTING.md]: /docs/contributing
[`dnsmasq`]: https://wiki.archlinux.org/title/dnsmasq
[hosts file]: https://en.wikipedia.org/wiki/Hosts_(file)
