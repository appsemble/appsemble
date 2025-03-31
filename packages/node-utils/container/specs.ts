import {
  formatEnv,
  logger,
  resourceDefaults,
  validateContainerResources,
} from '@appsemble/node-utils';
import { type CompanionContainerDefinition } from '@appsemble/types';
import {
  type V1Deployment,
  type V1DeploymentSpec,
  type V1PodTemplateSpec,
  type V1Service,
  type V1ServiceSpec,
} from '@kubernetes/client-node';

/**
 * Create the spec objects for a service, deployment, and pod.
 * Use for a single companion container.
 *
 * @param definition Companion container properties.
 * @param name Name to be used for the service and deployment objects.
 * @param appName Name of the app.
 * @param appId Id of the app creating the containers.
 * @param registry The default container registry to be used.
 * @returns `V1Service` and `V1Deployment` spec objects.
 */
export function generateDeploymentAndServiceSpecs(
  definition: CompanionContainerDefinition,
  name: string,
  appName: string,
  appId: string,
  registry?: string,
): {
  service: V1Service;
  deployment: V1Deployment;
} {
  let { image, resources } = definition;
  logger.silly(`Using image ${image} ${registry ? `from registry ${registry}` : ''}`);

  if (registry && !image.includes('/')) {
    // If registry ends with a '/'
    image = `${registry.endsWith('/') ? registry.slice(0, -1) : registry}/${image}`;
  }

  const validatedResources = validateContainerResources(resources);

  const env = formatEnv(definition.env ?? [], appName, appId);

  // Env should have string keys!
  const podTemplateSpec: V1PodTemplateSpec = {
    metadata: {
      ...definition.metadata,
      labels: { app: name, ...definition.metadata?.labels, appId },
    },
    spec: {
      containers: [
        {
          name,
          image,
          ports: [{ containerPort: definition.port ?? 8080 }],
          env,
          resources: {
            limits: { ...validatedResources.limits },
            requests: { ...resourceDefaults },
          },
        },
      ],
    },
  };

  // Define the Deployment specification
  const deploymentSpec: V1DeploymentSpec = {
    replicas: 1,
    selector: {
      matchLabels: { app: name, appId },
      ...definition.metadata?.selector,
    },

    template: podTemplateSpec,
  };

  // Define the Deployment
  const deployment: V1Deployment = {
    metadata: {
      name,
      ...definition.metadata,
      labels: { ...definition.metadata?.labels, appId },
    },
    spec: deploymentSpec,
  };

  // Default service type is ClusterIP
  const serviceSpec: V1ServiceSpec = {
    selector: { app: name, ...definition.metadata?.selector?.matchLabels, appId },
    ports: [{ port: 80, targetPort: definition.port ?? 8080 }],
  };

  const service: V1Service = {
    metadata: {
      name,
      ...definition.metadata,
      labels: { ...definition.metadata?.labels, appId },
    },
    spec: serviceSpec,
  };

  return { service, deployment };
}
