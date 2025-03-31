import { readFile } from 'node:fs/promises';
import stream from 'node:stream';

import { type LogObject } from '@appsemble/types';
import { Log, type V1PodList } from '@kubernetes/client-node';

import { getContainerNamespace, getKubeConfig, handleKubernetesError } from './helpers.js';
import { logger } from '../logger.js';

function fetchLogs(namespace: string, podName: string, containerName: string): Promise<string> {
  const { kubeconfig } = getKubeConfig();
  const log = new Log(kubeconfig);
  const logStream = new stream.PassThrough();

  return new Promise((resolve, reject) => {
    log
      .log(namespace, podName, containerName || '', logStream)
      .then(() => {
        let logs = '';
        logStream.on('data', (chunk) => {
          logs += String(chunk);
        });
        logStream.on('end', () => {
          resolve(logs);
        });
        logStream.on('error', (err) => {
          reject(err);
        });
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function filterLogEntries(
  entries: string[],
  deploymentName: string,
  fromAppsemble: boolean,
): string[] {
  let res = entries;

  if (fromAppsemble) {
    res = entries.filter((e) => e.includes(deploymentName));
  }

  return res;
}

export async function getLogs(
  deploymentName: string,
  fromAppsemble?: boolean,
): Promise<LogObject[]> {
  const { coreApi } = getKubeConfig();

  let pods: V1PodList;
  const containerNamespace = getContainerNamespace();
  let appsembleNamespace = 'appsemble';

  const appsembleServiceName = process.env.SERVICE_NAME ?? 'appsemble';
  logger.silly(`Using service name ${appsembleServiceName}`);

  try {
    const NAMESPACE_FILE_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/namespace';

    const namespace = await readFile(NAMESPACE_FILE_PATH, 'utf8');
    appsembleNamespace = namespace.trim();
  } catch (error: unknown) {
    logger.error('Error fetching namespace name. Using `appsemble` as default');
    logger.error(error);
  }

  logger.silly(`Using namespace ${appsembleNamespace}`);

  try {
    pods = (
      await coreApi.listNamespacedPod(fromAppsemble ? appsembleNamespace : containerNamespace)
    ).body;
  } catch (error: unknown) {
    handleKubernetesError(error);
    return [];
  }

  if (pods.items.length === 0) {
    logger.warn(
      `No pods found for deployment ${deploymentName} in namespace ${containerNamespace}`,
    );
    return [];
  }

  const podLogs: LogObject[] = [];

  for (const pod of pods.items) {
    if (
      pod.metadata?.ownerReferences?.find((r) => r.kind === 'ReplicaSet') &&
      pod.status?.phase === 'Running'
    ) {
      if (fromAppsemble && !pod.metadata?.name?.includes(appsembleServiceName)) {
        continue;
      }

      if (!fromAppsemble && !pod.metadata?.name?.includes(deploymentName)) {
        continue;
      }

      logger.silly(
        `Pod: ${pod.metadata?.name}, status: ${pod.status}, deployment: ${deploymentName}`,
      );
      try {
        const res = await fetchLogs(
          fromAppsemble ? appsembleNamespace : containerNamespace,
          // @ts-expect-error 2345 argument of type is not assignable to parameter of type
          // (strictNullChecks)
          pod.metadata?.name,
          fromAppsemble ? 'appsemble' : deploymentName,
        );
        let entries = res.split('\n');
        logger.silly(`Number of entries found for pod ${pod.metadata?.name}: ${entries.length}`);

        entries = filterLogEntries([...entries], deploymentName, fromAppsemble ?? false);

        podLogs.push({ fromAppsemble: fromAppsemble ?? false, entries });
      } catch (error: unknown) {
        handleKubernetesError(error);
      }
    }
  }

  return podLogs;
}
