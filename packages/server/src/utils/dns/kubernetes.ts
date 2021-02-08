import { promises as fs } from 'fs';
import { Agent } from 'https';
import { join } from 'path';
import { URL } from 'url';

import { logger } from '@appsemble/node-utils';
import { normalize } from '@appsemble/utils';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Op } from 'sequelize';

import { App, Organization } from '../../models';
import { argv } from '../argv';
import { iterTable } from '../database';
import { readPackageJson } from '../readPackageJson';

function readK8sSecret(filename: string): Promise<string> {
  return fs.readFile(join('/var/run/secrets/kubernetes.io/serviceaccount', filename), 'utf-8');
}

/**
 * Get common Axios request configuration based on the command line arguments.
 *
 * @returns A partial Axios request configuration for making ingress related requests.
 */
async function getAxiosConfig(): Promise<AxiosRequestConfig> {
  const K8S_HOST = `https://${argv.kubernetesServiceHost}:${argv.kubernetesServicePort}`;
  const ca = await readK8sSecret('ca.crt');
  const namespace = await readK8sSecret('namespace');
  const token = await readK8sSecret('token');
  return {
    headers: { authorization: `Bearer ${token}` },
    httpsAgent: new Agent({ ca }),
    url: `${K8S_HOST}/apis/networking.k8s.io/v1beta1/namespaces/${namespace}/ingresses`,
  };
}

/**
 * Create a function for creating ingresses.
 *
 * @returns A function for creating an ingress.
 *
 * The ingress function takes a domain name to create an ingress for. The rest is determined from
 * the command line arguments and the environment.
 */
async function createIngressFunction(): Promise<(domain: string) => Promise<void>> {
  const { ingressAnnotations, serviceName, servicePort } = argv;
  const { version } = readPackageJson();
  const config = await getAxiosConfig();
  const annotations = ingressAnnotations ? JSON.parse(ingressAnnotations) : undefined;

  return async (domain) => {
    const name = normalize(domain);
    logger.info(`Registering ingress ${name} for ${domain}`);
    try {
      await axios({
        ...config,
        method: 'POST',
        data: {
          metadata: {
            annotations,
            // https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/#labels
            labels: {
              'app.kubernetes.io/component': 'domain',
              'app.kubernetes.io/instance': name.slice(0, 63),
              'app.kubernetes.io/managed-by': serviceName,
              'app.kubernetes.io/name': 'appsemble',
              'app.kubernetes.io/part-of': serviceName,
              'app.kubernetes.io/version': version,
            },
            name,
          },
          spec: {
            rules: [
              {
                host: domain,
                http: { paths: [{ path: '/', backend: { serviceName, servicePort } }] },
              },
            ],
            tls: [
              {
                hosts: [domain],
                secretName: `${name}-tls${domain.startsWith('*') ? '-wilcard' : ''}`,
              },
            ],
          },
        },
      });
    } catch (error: unknown) {
      if ((error as AxiosError).response?.status !== 409) {
        throw error;
      }
      logger.warn(`Conflict registering ingress ${name}`);
    }
    logger.info(`Succesfully registered ingress ${name} for ${domain}`);
  };
}

/**
 * Configure a method to map domain names to a service by updating a single ingress.
 *
 * This method requires a role bound to the default service account, which allows Appsemble to
 * read and update a single ingress resource.
 *
 * @returns A DNS implemenation basd on a Kubernetes ingress.
 */
export async function configureDNS(): Promise<void> {
  const { hostname } = new URL(argv.host);
  const createIngress = await createIngressFunction();

  /**
   * Register a wildcard domain name ingress for organizations.
   */
  Organization.afterCreate('dns', ({ id }) => createIngress(`*.${id}.${hostname}`));

  /**
   * Register a domain name for apps who have defined a custom domain name.
   */
  App.afterSave('dns', async (app) => {
    const oldDomain = app.previous('domain');
    const { domain } = app;

    if (domain && oldDomain !== domain) {
      await createIngress(domain);
    }
  });
}

/**
 * Cleanup all ingresses managed by the current service.
 */
export async function cleanupDNS(): Promise<void> {
  const { serviceName } = argv;
  const config = await getAxiosConfig();
  logger.warn(`Deleting all ingresses for ${serviceName}`);
  await axios({
    ...config,
    method: 'DELETE',
    params: {
      labelSelector: `app.kubernetes.io/managed-by=${serviceName}`,
    },
  });
  logger.info(`Succesfully Deleted all ingresses for ${serviceName}`);
}

/**
 * Restore ingresses for all apps andorganizations.
 */
export async function restoreDNS(): Promise<void> {
  const { hostname } = new URL(argv.host);
  const createIngress = await createIngressFunction();

  for await (const { id } of iterTable(Organization, { attributes: ['id'] })) {
    await createIngress(`*.${id}.${hostname}`);
  }

  for await (const { domain } of iterTable(App, {
    attributes: ['domain'],
    where: { [Op.and]: [{ [Op.not]: { domain: null } }, { [Op.not]: { domain: '' } }] },
  })) {
    await createIngress(domain);
  }
}
