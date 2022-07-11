import { promises as fs } from 'fs';
import { Agent } from 'https';
import { join } from 'path';

import { logger } from '@appsemble/node-utils';
import { SSLStatusMap } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import axios, { AxiosRequestConfig } from 'axios';
import matcher from 'matcher';
import { Op } from 'sequelize';

import { App, Organization } from '../../models';
import pkg from '../../package.json';
import { argv } from '../argv';
import { iterTable } from '../database';

interface KubernetesMetadata {
  /**
   * The name of the Kubernetes resource
   */
  name?: string;

  /**
   * The namespace of the Kubernetes resource.
   */
  namespace?: string;

  /**
   * Annotations of the Kubernetes resource.
   */
  annotations: Record<string, string>;

  /**
   * Labels of the Kubernetes resource.
   *
   * For example Helm metadata.
   */
  labels: Record<string, string>;
}

interface AbstractKubernetesResource {
  /**
   * The API version of the Kubernetes resource.
   *
   * @example 'v1'
   */
  apiVersion?: string;

  /**
   * The kind of the Kubernetes resource.
   *
   * @example 'Pod'
   */
  kind?: string;

  /**
   * Metadata to describe the Kubernetes resource.
   */
  metadata: KubernetesMetadata;
}

interface KubernetesListResult<T extends AbstractKubernetesResource> {
  /**
   * The items that match a query.
   */
  items: T[];
}

interface IngressPath {
  /**
   * The URL path prefix which should be matched.
   */
  path: string;

  /**
   * The type of matching to use for the ingress rule.
   */
  pathType: 'Prefix';

  /**
   * The backend configuration to match.
   */
  backend: {
    /**
     * A matcher for the service to redirect traffic to.
     */
    service: {
      /**
       * The name of the service to redirect traffic to.
       */
      name: string;

      /**
       * A service port configuration.
       */
      port: {
        /**
         * The name of the port to redirect traffic to.
         */
        name: string;
      };
    };
  };
}

interface IngressRule {
  /**
   * The host that should be matched.
   */
  host: string;

  /**
   * How to handle HTTP traffic.
   */
  http: {
    /**
     * Path rules used for redirecting traffic.
     */
    paths: IngressPath[];
  };
}

interface IngressTLS {
  /**
   * The matching hosts to apply the SSL certificate to.
   *
   * Globs are supported.
   */
  hosts: string[];

  /**
   * The name of the secret containing the SSL certificate.
   */
  secretName: string;
}

interface Ingress extends AbstractKubernetesResource {
  /**
   * @inheritdoc
   */
  kind?: 'Ingress';

  /**
   * The specification of the ingress.
   */
  spec: {
    /**
     * The class name of the ingress.
     */
    ingressClassName: string;

    /**
     * Ingress rules used to match incoming traffic.
     */
    rules: IngressRule[];

    /**
     * Configuration for applying SSL certificates.
     */
    tls: IngressTLS[];
  };
}

interface CertificateCondition {
  status: 'False' | 'True' | 'Unknown';
  type: 'Issuing' | 'Ready';
}

interface Certificate extends AbstractKubernetesResource {
  /**
   * @inheritdoc
   */
  kind?: 'Certificate';

  /**
   * The specification of the certificate.
   */
  spec: {
    /**
     * A list of names the certificate may be applied to.
     *
     * Wildcards are supported.
     */
    dnsNames: string[];
  };

  /**
   * The validity status of the certificate.
   */
  status: {
    conditions: CertificateCondition[];
  };
}

function readK8sSecret(filename: string): Promise<string> {
  return fs.readFile(join('/var/run/secrets/kubernetes.io/serviceaccount', filename), 'utf8');
}

/**
 * Get common Axios request configuration based on the command line arguments.
 *
 * @returns A partial Axios request configuration for making ingress related requests.
 */
async function getAxiosConfig(): Promise<AxiosRequestConfig> {
  const K8S_HOST = `https://${argv.kubernetesServiceHost}:${argv.kubernetesServicePort}`;
  const ca = await readK8sSecret('ca.crt');
  const token = await readK8sSecret('token');
  return {
    headers: { authorization: `Bearer ${token}` },
    httpsAgent: new Agent({ ca }),
    baseURL: K8S_HOST,
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
  const { ingressAnnotations, ingressClassName, serviceName, servicePort } = argv;
  const namespace = await readK8sSecret('namespace');
  const config = await getAxiosConfig();
  const annotations = ingressAnnotations ? JSON.parse(ingressAnnotations) : undefined;

  return async (domain) => {
    const name = normalize(domain);
    logger.info(`Registering ingress ${name} for ${domain}`);
    try {
      await axios.post(
        `/apis/networking.k8s.io/v1/namespaces/${namespace}/ingresses`,
        {
          metadata: {
            annotations,
            // https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/#labels
            labels: {
              'app.kubernetes.io/component': 'domain',
              'app.kubernetes.io/instance': name.slice(0, 63),
              'app.kubernetes.io/managed-by': serviceName,
              'app.kubernetes.io/name': 'appsemble',
              'app.kubernetes.io/part-of': serviceName,
              'app.kubernetes.io/version': pkg.version,
            },
            name,
          },
          spec: {
            ingressClassName,
            rules: [
              {
                host: domain,
                http: {
                  paths: [
                    {
                      path: '/',
                      pathType: 'Prefix',
                      backend: { service: { name: serviceName, port: { name: servicePort } } },
                    },
                  ],
                },
              },
            ],
            tls: [
              {
                hosts: [domain],
                secretName: `${name}-tls${domain.startsWith('*') ? '-wilcard' : ''}`,
              },
            ],
          },
        } as Ingress,
        config,
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response.status !== 409) {
        throw error;
      }
      logger.warn(`Conflict registering ingress ${name}`);
    }
    logger.info(`Successfully registered ingress ${name} for ${domain}`);
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
  const namespace = await readK8sSecret('namespace');
  logger.warn(`Deleting all ingresses for ${serviceName}`);
  await axios.delete(`/apis/networking.k8s.io/v1/namespaces/${namespace}/ingresses`, {
    ...config,
    params: {
      labelSelector: `app.kubernetes.io/managed-by=${serviceName}`,
    },
  });
  logger.info(`Successfully Deleted all ingresses for ${serviceName}`);
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
    where: { [Op.and]: [{ domain: { [Op.not]: null } }, { domain: { [Op.not]: '' } }] },
  })) {
    await createIngress(domain);
  }
}

/**
 * Get the SSL status for all given domain names based on Kubernetes cert-manager certificates.
 *
 * @param domains The domain names to get a status for.
 * @returns A mapping of domain names to the status of the SSL certificate.
 */
export async function getSSLStatus(domains: string[]): Promise<SSLStatusMap> {
  const pending = new Set(domains);
  const config = await getAxiosConfig();
  const namespace = await readK8sSecret('namespace');
  const { data } = await axios.get<KubernetesListResult<Certificate>>(
    `/apis/cert-manager.io/v1/namespaces/${namespace}/certificates`,
    config,
  );
  const statuses: SSLStatusMap = {};
  for (const { spec, status } of data.items) {
    const matches = matcher([...pending], spec.dnsNames);
    for (const match of matches) {
      pending.delete(match);
      if (!status.conditions.length) {
        statuses[match] = 'unknown';
        continue;
      }
      const ready = status.conditions.find((condition) => condition.type === 'Ready');
      const issuing = status.conditions.find((condition) => condition.type === 'Issuing');
      if (!ready) {
        statuses[match] = 'error';
        continue;
      }
      if (ready.status === 'True') {
        statuses[match] = 'ready';
        continue;
      }
      if (ready.status === 'Unknown') {
        statuses[match] = 'unknown';
        continue;
      }
      if (!issuing) {
        statuses[match] = 'error';
        continue;
      }
      if (issuing.status === 'True') {
        statuses[match] = 'pending';
        continue;
      }
      statuses[match] = 'unknown';
    }
    if (!pending.size) {
      break;
    }
  }
  for (const domain of pending) {
    statuses[domain] = 'missing';
  }
  return statuses;
}
