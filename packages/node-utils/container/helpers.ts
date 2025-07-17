import {
  type ContainerEnvVar,
  type ContainerResourceProps,
  type ContainerResources,
} from '@appsemble/lang-sdk';
import { logger } from '@appsemble/node-utils';
import {
  AppsV1Api,
  CoreV1Api,
  HttpError,
  KubeConfig,
  type V1EnvVar,
} from '@kubernetes/client-node';

export const maxCPU = (process.env.MAX_CONTAINER_CPU as unknown as number) ?? 3;

// In gigabytes
export const maxMemoryGi = (process.env.MAX_CONTAINER_MEMORY as unknown as number) ?? 3;

export const appIdLabel = 'appId';
export const resourceDefaults: ContainerResourceProps = { memory: '128Mi', cpu: '0.1' };

export function getKubeConfig(): {
  appsApi: AppsV1Api;
  coreApi: CoreV1Api;
  kubeconfig: KubeConfig;
} {
  const kubeconfig = new KubeConfig();
  kubeconfig.loadFromDefault();

  const appsApi = kubeconfig.makeApiClient(AppsV1Api);
  const coreApi = kubeconfig.makeApiClient(CoreV1Api);

  return { appsApi, coreApi, kubeconfig };
}

export function getContainerNamespace(): string {
  return `companion-containers-${process.env.SERVICE_NAME ?? 'appsemble'}`;
}

export function formatServiceName(containerName: string, appName: string, appId: string): string {
  const serviceName = `${containerName}-${appName}-${appId}`.replaceAll(' ', '-').toLowerCase();

  return serviceName;
}

export function formatSecretName(appName: string, appId: string): string {
  return `${appName}-${appId}`.toLocaleLowerCase().replaceAll(' ', '-');
}

export function handleKubernetesError(error: unknown): void {
  if (error instanceof HttpError) {
    const { statusCode } = error as HttpError;
    if (statusCode) {
      logger.warn(`Kubernetes error with status code ${statusCode}:`);
    }
    logger.warn(error.body);
    return;
  }

  logger.error(error);
}
export async function deleteResource(
  type: 'deployment' | 'secret' | 'service',
  namespace: string,
  name: string,
): Promise<void> {
  if (process.env.TEST) {
    return;
  }
  const { appsApi, coreApi } = getKubeConfig();

  try {
    logger.silly(`Deleting ${type} '${name}' from namespace ${namespace} ... `);
    switch (type) {
      case 'deployment':
        await appsApi.deleteNamespacedDeployment(
          name,
          namespace,
          undefined,
          undefined,
          undefined,
          undefined,
          'Background',
        );
        break;
      case 'service':
        await coreApi.deleteNamespacedService(name, namespace);
        break;
      default:
        await coreApi.deleteNamespacedSecret(name, namespace);
    }
    logger.verbose(`Deleted ${type} '${name}' from namespace ${namespace}`);
  } catch (error: unknown) {
    handleKubernetesError(error);
  }
}

/**
 * Accepts a url used to call a companion container.
 *
 * @param url Url for internal communication to a container.
 * @returns the metadata used to form the url.
 * @example input: `containername-appname-1.companion-containers.svc.cluster.local`
 * result: containername-appname-1, 1, appname, appsemble, appsemble-or-namespace
 */
export function parseServiceUrl(url: string): {
  deploymentName: string;
  appId: string;
  appName: string;
  namespace: string;
} {
  const elements = url.replace('http://', '').split('.');

  const deploymentName = elements[0];
  const namespace = elements[1];
  const appId = deploymentName.split('-').pop();
  const appName = deploymentName.replace(`-${appId}`, '');

  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return { deploymentName, appId, appName, namespace };
}

export function validateContainerResources(resources?: ContainerResources): ContainerResources {
  // Validate Memory
  if (!resources || !resources.limits) {
    return { limits: resourceDefaults };
  }
  const result = resources;

  if (resources.limits.memory) {
    const unit = result.limits.memory.slice(-2);
    const number = result.limits.memory.replace(unit, '');

    const parsedValue = Number.parseFloat(number);

    const conditionsMemory = [
      Number.isNaN(parsedValue),
      String(parsedValue) !== number,
      parsedValue < 0,
      unit !== 'Mi' && unit !== 'Gi',
      unit === 'Gi' && parsedValue > maxMemoryGi,
      unit === 'Mi' && parsedValue > maxMemoryGi * 1024,
    ];

    if (conditionsMemory.some(Boolean)) {
      result.limits.memory = resourceDefaults.memory;
    }
  } else {
    result.limits.memory = resourceDefaults.memory;
  }

  if (resources.limits.cpu) {
    const parsedValue = Number.parseFloat(resources.limits.cpu);
    let cpu = 0;

    const pattern = /\b([1-9]|[1-9]\d{1,2})m\b/;
    if (pattern.test(resources.limits.cpu)) {
      cpu = Number.parseFloat(resources.limits.cpu.slice(0, -1)) / 1000;
    } else if (!Number.isNaN(parsedValue)) {
      if (String(parsedValue) === String(resources.limits.cpu)) {
        cpu = parsedValue;
      } else {
        result.limits.cpu = resourceDefaults.cpu;
      }
    }
    if (cpu > maxCPU || cpu <= 0) {
      result.limits.cpu = resourceDefaults.cpu;
    }
  } else {
    result.limits.cpu = resourceDefaults.cpu;
  }
  return result;
}

export function isWhitelisted(fullImageName: string): Boolean {
  if (process.env.HOST !== 'https://appsemble.app') {
    return true;
  }

  // Allowed registries
  // Overwrite the default by setting the
  // `WHITELIST_REGISTRIES` env variable
  // As space separated list of domains
  const whitelistRegistries = process.env.WHITELIST_REGISTRIES
    ? process.env.WHITELIST_REGISTRIES.split(' ')
    : ['registry.hub.docker.com/library/', 'docker.io/library/', 'registry.gitlab.com/appsemble/'];

  let whitelisted = false;

  const parts = fullImageName.split('/');

  // If only image name is provided, it will be pulled from the official docker library
  if (parts.length === 1) {
    whitelisted = true;
  } else if (parts.length === 2) {
    const [namespace] = parts;

    // If namespace is 'library', it's an official image
    if (namespace === 'library') {
      whitelisted = true;
    }
  } else if (whitelistRegistries.some((domain) => fullImageName.startsWith(domain))) {
    whitelisted = true;
  }

  if (whitelisted) {
    logger.silly(`Image ${fullImageName} found in a whitelisted repository`);
  } else {
    logger.error(`Image ${fullImageName} is not in any whitelisted repository`);
  }

  return whitelisted;
}

export function formatEnv(input: ContainerEnvVar[], appName: string, appId: string): V1EnvVar[] {
  const env: V1EnvVar[] = [];

  if (input && input.length > 0) {
    for (const entry of input) {
      if (entry.useValueFromSecret) {
        env.push({
          name: entry.name,
          valueFrom: {
            secretKeyRef: { key: entry.value, name: formatSecretName(appName, appId) },
          },
        });
        continue;
      }
      env.push({ name: entry.name, value: entry.value });
    }
  }
  return env;
}
