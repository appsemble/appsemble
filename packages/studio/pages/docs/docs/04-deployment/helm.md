# Helm

## Prerequisites

- A working Kubernetes cluster
- [Helm](https://helm.sh)

Appsemble can be installed using Helm by running the following commands.

```sh copy
helm repo add appsemble https://charts.appsemble.com
helm repo update
helm install --name my-appsemble appsemble/appsemble
```

For more detailed instructions, see Appsemble on
[Artifact Hub](https://artifacthub.io/packages/helm/appsemble/appsemble).
