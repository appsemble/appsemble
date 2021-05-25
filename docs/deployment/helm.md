# Helm

## Prerequisites

- A working Kubernetes cluster
- [Helm](https://helm.sh)

Clone the Appsemble Git repository.

```sh copy
git clone https://gitlab.com/appsemble/appsemble.git
cd appsemble
```

```sh copy
helm install --name appsemble config/charts/appsemble
```

Once Appsemble is up and running, you probably to upload blocks. For this, clone the Appsemble git
repository and continue to the
[Blocks in the readme](https://gitlab.com/appsemble/appsemble/blob/master/README.md#publishing-blocks).
