import { logger } from '@appsemble/node-utils';
import { type CompanionContainerDefinition } from '@appsemble/types';
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

  let existing: V1Secret;
  try {
    existing = (await coreApi.readNamespacedSecret(formattedName, namespace)).body;
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
      const { body: updatedSecret } = await coreApi.replaceNamespacedSecret(
        formattedName,
        namespace,
        existing,
      );
      logger.info(`Secret ${updatedSecret.metadata.name} updated successfully`);
    } catch (error: unknown) {
      handleKubernetesError(error);
    }
    return;
  }

  try {
    logger.verbose(`Creating secret ${secretSpec.metadata?.name} ...`);
    const { body: secret } = await coreApi.createNamespacedSecret(namespace, secretSpec);

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
      const { body: secret } = await coreApi.readNamespacedSecret(secretName, namespace);

      logger.verbose(
        `Deleteing key ${key} of secret ${secretName} from namespace ${namespace} ...`,
      );

      if (!(key in secret.data)) {
        logger.warn(`Key ${key} does not exist on secret ${secret.metadata?.name}`);
        return;
      }
      delete secret.data[key];

      await coreApi.replaceNamespacedSecret(secretName, namespace, secret);
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
  if (process.env.TEST) {
    return;
  }

  const { appsApi, coreApi } = getKubeConfig();

  const namespace = getContainerNamespace();
  let services: V1ServiceList;

  logger.silly(`Listing services in namespace ${namespace} ...`);

  try {
    services = (await coreApi.listNamespacedService(namespace)).body;
  } catch (error: unknown) {
    logger.error(`Error listing services in namespace ${namespace}`);
    handleKubernetesError(error);
    return;
  }

  // Update or create deployment and service
  for (const def of definitions) {
    const serviceName = formatServiceName(def.name, appName, appId);

    const existing = services?.items?.find((s) => s.metadata.name === serviceName);

    // Update
    if (existing) {
      logger.verbose(`Updating resources for ${existing.metadata.name} in namespace ${namespace}`);

      const patchOptions: [
        string,
        string,
        object,
        string?,
        string?,
        string?,
        string?,
        boolean?,
        { headers: Record<string, string> }?,
      ] = [
        existing.metadata?.name,
        namespace,
        [
          {
            op: 'replace',
            path: '/metadata',
            // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
            value: { ...def.metadata, name: existing.metadata.name },
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
        ],
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-Type': 'application/json-patch+json' } },
      ];

      // Update service
      try {
        const updatedService = await coreApi.patchNamespacedService(...patchOptions);

        logger.info(`Service ${updatedService?.body?.metadata?.name} updated`);
      } catch (error: unknown) {
        logger.error('Error updating service:');
        handleKubernetesError(error);
      }

      // Update deployment

      const resources = validateContainerResources(def.resources);

      patchOptions[2] = [
        {
          op: 'replace',
          path: '/metadata',
          // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
          value: { ...def.metadata, name: existing.metadata.name },
        },
        {
          op: 'replace',
          path: '/spec/template/spec/containers/0/ports/0/containerPort',
          value: def.port ?? 8080,
        },
        {
          op: 'replace',
          path: '/spec/template/spec/containers/0/env',
          value: [...formatEnv(def.env, appName, appId)],
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
        const updatedDeployment = await appsApi.patchNamespacedDeployment(...patchOptions);

        logger.info(`Deployment ${updatedDeployment?.body?.metadata?.name} updated`);
      } catch (error: unknown) {
        logger.error('Error updating deployment:');
        handleKubernetesError(error);
      }

      // Update pod
      try {
        const { body } = await coreApi.listNamespacedPod(
          namespace,
          undefined,
          undefined,
          undefined,
          undefined,
          `appId=${appId}`,
        );
        if (body?.items?.length === 0) {
          logger.silly(`Deployment ${serviceName} has 0 pods, skipping ...`);
          continue;
        }
        const pod = body?.items?.find((i) => i.metadata.labels.app === existing.metadata.name);

        // Set base labels, such as selector, pod name, pod hash
        const props = {
          ...def.metadata,
          labels: {
            ...(def.metadata ? def.metadata.labels : null),
            app: pod.metadata.labels.app,
            'pod-template-hash': pod.metadata.labels['pod-template-hash'],
            appId,
          },
          name: pod.metadata.name,
        };
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        patchOptions[0] = pod?.metadata?.name;
        patchOptions[2] = [
          {
            op: 'replace',
            path: '/metadata',
            value: props,
          },
        ];
        const updatedPod = await coreApi.patchNamespacedPod(...patchOptions);
        logger.verbose(`Pod updated: ${updatedPod?.body?.metadata?.name}`);
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
      if (isWhitelisted(deployment.spec.template.spec.containers[0].image)) {
        logger.verbose(`Creating resources in namespace ${namespace} ...`);

        try {
          const deploymentObj = await appsApi.createNamespacedDeployment(namespace, deployment);
          logger.info(`Deployment created: ${deploymentObj.body?.metadata?.name}`);
        } catch (error: unknown) {
          handleKubernetesError(error);
          return;
        }
        try {
          const serviceObj = await coreApi.createNamespacedService(namespace, service);
          logger.info(`Service created: ${serviceObj.body.metadata?.name}`);
        } catch (error: unknown) {
          handleKubernetesError(error);
        }
      } else {
        logger.error(
          `Image ${deployment.spec.template.spec.containers[0].image} is not in the repository whitelist!`,
        );
      }
    }
  }

  // Delete companions removed from the definition
  for (const service of services.items) {
    if (service.spec.type === 'ExternalName') {
      continue;
    }

    if (
      service.metadata?.labels &&
      appIdLabel in service.metadata.labels &&
      service.metadata.labels[appIdLabel] === appId
    ) {
      const existing = definitions.find(
        (d) => formatServiceName(d.name, appName, appId) === service.metadata.name,
      );

      if (!existing) {
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        await deleteCompanionContainers(service.metadata?.name);
      }
    }
  }
}
