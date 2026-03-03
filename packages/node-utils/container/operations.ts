import { type CompanionContainerDefinition } from '@appsemble/lang-sdk';
import { logger } from '@appsemble/node-utils';
import { type V1Secret, type V1ServiceList } from '@kubernetes/client-node';

import {
  appIdLabel,
  deleteResource,
  formatEnv,
  formatSecretName,
  formatServiceName,
  getContainerNamespace,
  getKubeConfig,
  handleKubernetesError,
  isWhitelisted,
  validateContainerResources,
} from './helpers.js';
import { generateDeploymentAndServiceSpecs } from './specs.js';

/**
 * Creates or updates secret.
 * Secret resource is named after the app name + id, where whitespace
 * is replaced by '-'.
 *
 * @param secretName Key of the secret to be created
 * @param value The secret value
 * @param appName Name of the app
 * @param appId Id of the app.
 */
export async function updateNamespacedSecret(
  secretName: string,
  value: string,
  appName: string,
  appId: string,
): Promise<void> {
  // If testing, don't create Kubernetes resources
  if (process.env.TEST) {
    return;
  }

  const { coreApi } = getKubeConfig();
  const namespace = getContainerNamespace();

  const formattedName = formatSecretName(appName, appId);

  const secretSpec: V1Secret = {
    metadata: {
      name: formattedName,
      namespace,
    },
    data: { [secretName]: Buffer.from(value).toString('base64') },
  };

  let existing: V1Secret | undefined;
  try {
    existing = await coreApi.readNamespacedSecret({ name: formattedName, namespace });
  } catch (error: unknown) {
    handleKubernetesError(error);
  }

  if (existing) {
    logger.silly(`Secret ${formattedName} already exists`);
    if (!existing.data) {
      existing.data = {};
    }

    existing.data[secretName] = Buffer.from(value).toString('base64');

    try {
      const updatedSecret = await coreApi.replaceNamespacedSecret({
        name: formattedName,
        namespace,
        body: existing,
      });
      logger.info(`Secret ${updatedSecret.metadata?.name} updated successfully`);
    } catch (error: unknown) {
      handleKubernetesError(error);
    }
    return;
  }

  try {
    logger.verbose(`Creating secret ${secretSpec.metadata?.name} ...`);
    const secret = await coreApi.createNamespacedSecret({ namespace, body: secretSpec });

    logger.info(`Secret ${secret.metadata?.name} created successfully`);
  } catch (error: unknown) {
    handleKubernetesError(error);
  }
}

export async function deleteSecret(appName: string, appId: string, key?: string): Promise<void> {
  if (process.env.TEST) {
    return;
  }
  const { coreApi } = getKubeConfig();
  const namespace = getContainerNamespace();
  const secretName = formatSecretName(appName, appId);

  if (key) {
    try {
      const secret = await coreApi.readNamespacedSecret({ name: secretName, namespace });

      logger.verbose(
        `Deleteing key ${key} of secret ${secretName} from namespace ${namespace} ...`,
      );

      if (!(secret.data && key in secret.data)) {
        logger.warn(`Key ${key} does not exist on secret ${secret.metadata?.name}`);
        return;
      }
      delete secret.data[key];

      await coreApi.replaceNamespacedSecret({ name: secretName, namespace, body: secret });
      logger.verbose(`Deleted key ${key} of secret ${secretName} from namespace ${namespace}.`);
    } catch (error: unknown) {
      logger.error(`Error deleting ${key ? `key ${key} from` : ''} secret ${secretName}`);
      handleKubernetesError(error);
    }
  } else {
    await deleteResource('secret', namespace, secretName);
  }
}

export async function deleteCompanionContainers(serviceName: string): Promise<void> {
  if (process.env.TEST) {
    return;
  }
  const namespace = getContainerNamespace();

  await deleteResource('service', namespace, serviceName);

  await deleteResource('deployment', namespace, serviceName);
}

export async function updateCompanionContainers(
  definitions: CompanionContainerDefinition[],
  appName: string,
  appId: string,
  registry?: string,
): Promise<void> {
  // If testing, don't create Kubernetes resources
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const { appsApi, coreApi } = getKubeConfig();

  const namespace = getContainerNamespace();
  let services: V1ServiceList;

  logger.silly(`Listing services in namespace ${namespace} ...`);

  try {
    services = await coreApi.listNamespacedService({ namespace });
  } catch (error: unknown) {
    logger.error(`Error listing services in namespace ${namespace}`);
    handleKubernetesError(error);
    return;
  }

  // Update or create deployment and service
  for (const def of definitions) {
    const serviceName = formatServiceName(def.name, appName, appId);

    const existing = services?.items?.find((s) => s.metadata?.name === serviceName);

    // Update
    if (existing) {
      logger.verbose(`Updating resources for ${existing.metadata?.name} in namespace ${namespace}`);

      const existingServiceName = existing.metadata?.name;

      if (!existingServiceName) {
        logger.warn(`Service without metadata.name found in namespace ${namespace}, skipping ...`);
        continue;
      }

      const servicePatch = [
        {
          op: 'replace',
          path: '/metadata',
          value: { ...def.metadata, name: existingServiceName },
        },
        {
          op: 'replace',
          path: '/spec/ports/0/targetPort',
          value: def.port ?? 8080,
        },
        {
          op: 'add',
          path: '/metadata/labels',
          value: { appId },
        },
      ];

      // Update service
      try {
        const updatedService = await coreApi.patchNamespacedService({
          name: existingServiceName,
          namespace,
          body: servicePatch,
        });

        logger.info(`Service ${updatedService?.metadata?.name} updated`);
      } catch (error: unknown) {
        logger.error('Error updating service:');
        handleKubernetesError(error);
      }

      // Update deployment

      const resources = validateContainerResources(def.resources);

      const deploymentPatch = [
        {
          op: 'replace',
          path: '/metadata',
          value: { ...def.metadata, name: existingServiceName },
        },
        {
          op: 'replace',
          path: '/spec/template/spec/containers/0/ports/0/containerPort',
          value: def.port ?? 8080,
        },
        {
          op: 'replace',
          path: '/spec/template/spec/containers/0/env',
          value: [...formatEnv(def.env ?? [], appName, appId)],
        },
        {
          op: 'add',
          path: '/metadata/labels',
          value: { appId },
        },
        {
          op: 'replace',
          path: '/spec/template/spec/containers/0/resources',
          value: resources,
        },
      ];
      try {
        const updatedDeployment = await appsApi.patchNamespacedDeployment({
          name: existingServiceName,
          namespace,
          body: deploymentPatch,
        });

        logger.info(`Deployment ${updatedDeployment?.metadata?.name} updated`);
      } catch (error: unknown) {
        logger.error('Error updating deployment:');
        handleKubernetesError(error);
      }

      // Update pod
      try {
        const podList = await coreApi.listNamespacedPod({
          namespace,
          labelSelector: `appId=${appId}`,
        });
        if (podList.items.length === 0) {
          logger.silly(`Deployment ${serviceName} has 0 pods, skipping ...`);
          continue;
        }
        const pod = podList.items.find(
          (item) => item.metadata?.labels?.app === existingServiceName,
        );

        if (!pod?.metadata?.name) {
          logger.silly(
            `Deployment ${serviceName} has no matching pod with metadata.name, skipping`,
          );
          continue;
        }

        // Set base labels, such as selector, pod name, pod hash
        const props = {
          ...def.metadata,
          labels: {
            ...(def.metadata ? def.metadata.labels : null),
            app: pod?.metadata?.labels?.app,
            'pod-template-hash': pod?.metadata?.labels?.['pod-template-hash'],
            appId,
          },
          name: pod.metadata.name,
        };
        const podPatch = [
          {
            op: 'replace',
            path: '/metadata',
            value: props,
          },
        ];
        const updatedPod = await coreApi.patchNamespacedPod({
          name: pod.metadata.name,
          namespace,
          body: podPatch,
        });
        logger.verbose(`Pod updated: ${updatedPod?.metadata?.name}`);
      } catch (error: unknown) {
        handleKubernetesError(error);
      }
    }

    // Create
    else {
      const { deployment, service } = generateDeploymentAndServiceSpecs(
        def,
        serviceName,
        appName,
        appId,
        registry,
      );
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      if (isWhitelisted(deployment.spec?.template.spec?.containers[0].image)) {
        logger.verbose(`Creating resources in namespace ${namespace} ...`);

        try {
          const deploymentObj = await appsApi.createNamespacedDeployment({
            namespace,
            body: deployment,
          });
          logger.info(`Deployment created: ${deploymentObj.metadata?.name}`);
        } catch (error: unknown) {
          handleKubernetesError(error);
          return;
        }
        try {
          const serviceObj = await coreApi.createNamespacedService({ namespace, body: service });
          logger.info(`Service created: ${serviceObj.metadata?.name}`);
        } catch (error: unknown) {
          handleKubernetesError(error);
        }
      } else {
        logger.error(
          `Image ${deployment.spec?.template.spec?.containers[0].image} is not in the repository whitelist!`,
        );
      }
    }
  }

  // Delete companions removed from the definition
  for (const service of services.items) {
    if (service.spec?.type === 'ExternalName') {
      continue;
    }

    if (
      service.metadata?.labels &&
      appIdLabel in service.metadata.labels &&
      service.metadata.labels[appIdLabel] === appId
    ) {
      const existing = definitions.find(
        (d) => formatServiceName(d.name, appName, appId) === service.metadata?.name,
      );

      if (!existing) {
        if (!service.metadata?.name) {
          continue;
        }

        await deleteCompanionContainers(service.metadata.name);
      }
    }
  }
}
