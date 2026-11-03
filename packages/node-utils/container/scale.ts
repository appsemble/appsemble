import { logger } from '@appsemble/node-utils';
import { type V1DeploymentList } from '@kubernetes/client-node';

import { getContainerNamespace, getKubeConfig, handleKubernetesError } from './helpers.js';

export async function scaleDeployment(
  namespace: string,
  deploymentName: string,
  replicas = 0,
): Promise<void> {
  const { appsApi } = getKubeConfig();

  const patch = [];
  patch.push({
    op: 'replace',
    path: '/spec/replicas',
    value: replicas,
  });

  try {
    logger.verbose(`Scaling deployment ${deploymentName} to ${replicas} replicas ... `);
    await appsApi.patchNamespacedDeployment({
      name: deploymentName,
      namespace,
      body: patch,
    });

    logger.verbose(`Deployment ${deploymentName} scaled to ${replicas} replicas successfully `);
  } catch (error: unknown) {
    handleKubernetesError(error);
    throw error;
  }
}
export async function stopIdleContainers(interval = 10): Promise<void> {
  const { appsApi } = getKubeConfig();

  let deployments: V1DeploymentList;

  logger.verbose('Scaling containers');

  try {
    deployments = await appsApi.listDeploymentForAllNamespaces();
  } catch (error: unknown) {
    handleKubernetesError(error);
    return;
  }

  for (const deployment of deployments.items) {
    // @ts-expect-error 2339 Property does not exist on type undefined
    const { annotations, name, namespace } = deployment.metadata;

    if (
      deployment.metadata?.namespace !== getContainerNamespace() ||
      deployment.spec?.replicas === 0
    ) {
      continue;
    }

    const milliseconds = interval * 60 * 1000;
    const now = new Date();

    const lastCall = annotations.lastRequestTimestamp
      ? new Date(annotations.lastRequestTimestamp)
      : null;

    // Set timestamp metadata if missing, and continue
    if (!lastCall) {
      const patch = [
        {
          op: 'add',
          path: '/metadata/annotations',
          value: { lastRequestTimestamp: now.toISOString() },
        },
      ];
      try {
        logger.silly(`Updating metadata of deployment ${name}`);
        await appsApi.patchNamespacedDeployment({ name, namespace, body: patch });
        logger.verbose(`Updated metadata of deployment ${name} successfully `);
      } catch (error: unknown) {
        handleKubernetesError(error);
      }
      continue;
    }
    // If timestamp exists and is old enough, scale down
    const diff = now.getTime() - lastCall.getTime();

    if (Math.abs(diff) > milliseconds) {
      await scaleDeployment(namespace, name, 0);
    }
  }
}

const lastRequestAnnotationTimes = new Map<string, number>();

export async function setLastRequestAnnotation(
  namespace: string,
  deploymentName: string,
): Promise<void> {
  const now = new Date();

  // Refreshing at most once a minute keeps the annotation well within the idle interval of
  // `stopIdleContainers` without a Kubernetes API call for every proxied request.
  if (now.getTime() - (lastRequestAnnotationTimes.get(deploymentName) ?? 0) < 60_000) {
    return;
  }
  lastRequestAnnotationTimes.set(deploymentName, now.getTime());

  const { appsApi } = getKubeConfig();

  const patch = [
    {
      op: 'add',
      path: '/metadata/annotations',
      value: { lastRequestTimestamp: now.toISOString() },
    },
  ];
  try {
    logger.silly(
      `Setting 'lastRequestTimestamp' annotation of '${deploymentName}' to ${now.toISOString()}`,
    );
    await appsApi.patchNamespacedDeployment({
      name: deploymentName,
      namespace,
      body: patch,
    });
    logger.silly(`'LastRequestTimestamp' annotation of '${deploymentName}' updated successfully`);
  } catch (error: unknown) {
    logger.warn('Could not set last request annotation:');
    handleKubernetesError(error);
  }
}
