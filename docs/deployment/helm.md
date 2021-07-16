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

Once Appsemble is up and running, you probably to upload blocks. For this, clone the Appsemble git
repository and continue to the
[Blocks in the readme](https://gitlab.com/appsemble/appsemble/blob/main/README.md#publishing-blocks).
