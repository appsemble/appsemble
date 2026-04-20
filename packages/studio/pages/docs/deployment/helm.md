# Helm

## Prerequisites

- A working Kubernetes cluster
- [Helm](https://helm.sh)
- (Optional) [Cert-manager](https://cert-manager.io) for automatic TLS certificate management

For installation, upgrades, values, and chart-specific caveats, use the
[Appsemble chart README](https://gitlab.com/appsemble/appsemble/-/tree/main/config/charts/appsemble).

The published chart is also available on
[Artifact Hub](https://artifacthub.io/packages/helm/appsemble/appsemble).

This page focuses on TLS setup patterns for Helm deployments.

## Database migrations

The Helm chart runs database migrations automatically after each `helm install` and `helm upgrade`.

For operational migration checks and troubleshooting commands, use the chart documentation on
[Artifact Hub](https://artifacthub.io/packages/helm/appsemble/appsemble) (see section `Migrations`).

## Cert-manager

Cert-manager is manages TLS certificates in Kubernetes. It can be used to automatically provision
and renew certificates for your Appsemble installation.

To install cert-manager, run the following commands
[from the official instructions](https://cert-manager.io/docs/installation/helm/#option-2-install-crds-as-part-of-the-helm-release)

```sh copy
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --create-namespace \
  --namespace cert-manager \
  --version v1.8.0 \
  --set 'installCRDs=true'
```

With cert-manager installed, you can configure it to use, for example, Let’s Encrypt via
[ACME](https://cert-manager.io/docs/configuration/acme/) and
[Issuer resources](https://cert-manager.io/docs/concepts/issuer/) to automatically provision and
renew certificates for your Appsemble installation.

Example `ClusterIssuer` for Let’s Encrypt:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email-here@example.com
    privateKeySecretRef:
      name: letsencrypt-prod # you don't need to create this secret, cert-manager will create it
    solvers:
      - http01:
          ingress:
            class: nginx
        selector:
          dnsZones: # certificates for example.com and *.example.com
            - example.com
      - http01:
          ingress:
            class: nginx
        selector:
          dnsNames:
            - example.com # a certificate for example.com
            - subdomain.example.com
            - '*.example.com' # you can also use wildcards here
```

If you have DNS managed by a supported provider, you can use the DNS01 challenge type instead of
HTTP01. See the [DNS01 challenge](https://cert-manager.io/docs/configuration/acme/dns01/)
documentation for more information.

After cert-manager is installed, it will generate secrets with the TLS certificates. Those follow
the naming convention `<ingress-name>-tls` and `<ingress-name>-tls-wildcard`. In the helm chart,
ingresses are usually named after the release name, so if you installed Appsemble with
`--name my-appsemble`, the secrets will be named `my-appsemble-tls` and `my-appsemble-tls-wildcard`.

```sh
helm install --name my-appsemble appsemble/appsemble \
--set "ingress.clusterIssuer=letsencrypt-prod" \
--set "ingress.enabled=true" \
--set "ingress.host=example.com" \
--set "ingress.tls=true" \
--set "ingress.tlsSecretName=my-appsemble-tls" \
--set "ingress.tlsWildcardSecretName=my-appsemble-tls-wildcard"
# ...
```

Make sure `ingress.host` resolves to the ingress controller with both `A` and `AAAA` records. Point `*.ingress.host` to the same place, preferably with a wildcard `CNAME` to the apex host.

## Use HTTPS configured elsewhere

If you’re not using `cert-manager` and can’t add the `ingress.tls`, `ingress.tlsSecretName`, and
`ingress.tlsWildcardSecretName` values (e.g. your TLS is configured at the ingress controller level,
or you’re using a service like Cloudflare), you can force Appsemble to use HTTPS as the protocol for
URLs by setting the `forceProtocolHttps` value to `true`.

```sh
helm install --name my-appsemble appsemble/appsemble \
--set "forceProtocolHttps=true"
# ...
```
