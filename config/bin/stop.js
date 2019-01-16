#!/usr/bin/env node
const k8s = require('@kubernetes/client-node');

const appsembleDeployment = require('../kubernetes/appsembleDeployment');
const appsembleService = require('../kubernetes/appsembleService');
const ingress = require('../kubernetes/ingress');
const mysqlDeployment = require('../kubernetes/mysqlDeployment');
const mysqlService = require('../kubernetes/mysqlService');

const { KUBE_NAMESPACE } = process.env;

/**
 * Stop the Kubernetes deployment for the current branch in GitLab.
 */
async function main() {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const apps = kc.makeApiClient(k8s.Extensions_v1beta1Api);
  const core = kc.makeApiClient(k8s.Core_v1Api);
  await apps.deleteNamespacedIngress(ingress.metadata.name, KUBE_NAMESPACE, ingress);
  await core.deleteNamespacedService(
    appsembleService.metadata.name,
    KUBE_NAMESPACE,
    appsembleService,
  );
  await core.deleteNamespacedService(mysqlService.metadata.name, KUBE_NAMESPACE, mysqlService);
  await apps.deleteNamespacedDeployment(
    appsembleDeployment.metadata.name,
    KUBE_NAMESPACE,
    appsembleDeployment,
  );
  await apps.deleteNamespacedDeployment(
    mysqlDeployment.metadata.name,
    KUBE_NAMESPACE,
    mysqlService,
  );
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
