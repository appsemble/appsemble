import { logger } from '@appsemble/node-utils';
import * as k8s from '@kubernetes/client-node';

import appsembleDeployment from '../kubernetes/appsembleDeployment';
import appsembleService from '../kubernetes/appsembleService';
import ingress from '../kubernetes/ingress';
import mysqlDeployment from '../kubernetes/mysqlDeployment';
import mysqlService from '../kubernetes/mysqlService';

const { KUBE_NAMESPACE } = process.env;

/**
 * Stop the Kubernetes deployment for the current branch in GitLab.
 */
async function main() {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const apps = kc.makeApiClient(k8s.Apps_v1Api);
  const beta = kc.makeApiClient(k8s.Extensions_v1beta1Api);
  const core = kc.makeApiClient(k8s.Core_v1Api);

  logger.info(`Stopping ingress: ${ingress.metadata.name}`);
  await beta.deleteNamespacedIngress(ingress.metadata.name, KUBE_NAMESPACE, {});
  logger.info(`Stopped ingress: ${ingress.metadata.name}`);
  logger.info(`Stopping service: ${appsembleService.metadata.name}`);
  await core.deleteNamespacedService(appsembleService.metadata.name, KUBE_NAMESPACE, {});
  logger.info(`Stopped service: ${appsembleService.metadata.name}`);
  logger.info(`Stopping service: ${mysqlService.metadata.name}`);
  await core.deleteNamespacedService(mysqlService.metadata.name, KUBE_NAMESPACE, {});
  logger.info(`Stopped service: ${mysqlService.metadata.name}`);
  logger.info(`Stopping deployment: ${appsembleDeployment.metadata.name}`);
  await apps.deleteNamespacedDeployment(appsembleDeployment.metadata.name, KUBE_NAMESPACE, {});
  logger.info(`Stopped deployment: ${appsembleDeployment.metadata.name}`);
  logger.info(`Stopping deployment: ${mysqlDeployment.metadata.name}`);
  await apps.deleteNamespacedDeployment(mysqlDeployment.metadata.name, KUBE_NAMESPACE, {});
  logger.info(`Stopped deployment: ${mysqlDeployment.metadata.name}`);
}

main().catch(err => {
  logger.error(err);
  process.exit(1);
});
