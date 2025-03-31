import { readFile } from 'node:fs/promises';
import { Agent } from 'node:https';
import { join } from 'node:path';

import { logger, version } from '@appsemble/node-utils';
import { type SSLStatusMap } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import axios, { type RawAxiosRequestConfig } from 'axios';
import { escapeJsonPointer } from 'koas-core/lib/jsonRefs.js';
import { matcher } from 'matcher';
import { Op } from 'sequelize';

import { App, AppCollection, Organization } from '../../models/index.js';
import { argv } from '../argv.js';
import { iterTable } from '../database.js';

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
  return readFile(join('/var/run/secrets/kubernetes.io/serviceaccount', filename), 'utf8');
}

/**
 * Get common Axios request configuration based on the command line arguments.
 *
 * @returns A partial Axios request configuration for making ingress related requests.
 */
async function getAxiosConfig(): Promise<RawAxiosRequestConfig> {
  const K8S_HOST = `https://${argv.kubernetesServiceHost}:${argv.kubernetesServicePort}`;
  const ca = await readK8sSecret('ca.crt');
  const token = await readK8sSecret('token');
  return {
    headers: { authorization: `Bearer ${token}` },
    httpsAgent: new Agent({ ca }),
    baseURL: K8S_HOST,
  };
}

function generateSSLSecretName(domain: string): string {
  const name = normalize(domain);
  return `${name}-tls${domain.startsWith('*') ? '-wilcard' : ''}`;
}

/**
 * Create a function for creating ingresses.
 *
 * @returns A function for creating an ingress.
 *
 *   The ingress function takes a domain name to create an ingress for. The rest is determined from
 *   the command line arguments and the environment.
 */
async function createIngressFunction(): Promise<
  (domain: string, customSSL?: boolean, redirectTo?: string) => Promise<void>
> {
  const { clusterIssuer, ingressAnnotations, ingressClassName, issuer, serviceName, servicePort } =
    argv;
  const namespace = await readK8sSecret('namespace');
  const config = await getAxiosConfig();
  const defaultAnnotations: Record<string, string> = ingressAnnotations
    ? JSON.parse(ingressAnnotations)
    : undefined;
  const issuerAnnotationKey = clusterIssuer
    ? 'cert-manager.io/cluster-issuer'
    : issuer
      ? 'cert-manager.io/issuer'
      : undefined;
  const issuerAnnotationValue = clusterIssuer || issuer;

  return async (domain, customSSL, redirectTo) => {
    const name = normalize(domain);
    const url = `/apis/networking.k8s.io/v1/namespaces/${namespace}/ingresses`;
    const annotations = {
      ...defaultAnnotations,
      ...((redirectTo
        ? {
            'nginx.ingress.kubernetes.io/rewrite-target': `https://${redirectTo}/$1`,
            'nginx.ingress.kubernetes.io/use-regex': 'true',
          }
        : {}) as Record<string, string>),
    };
    const secretName = generateSSLSecretName(domain);

    if (!customSSL && issuerAnnotationKey) {
      // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
      annotations[issuerAnnotationKey] = issuerAnnotationValue;
    }

    logger.info(`Registering ingress ${name} for ${domain}`);
    try {
      await axios.post(
        url,
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
              'app.kubernetes.io/version': version,
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
                secretName,
              },
            ],
          },
        } as Ingress,
        config,
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status !== 409) {
        throw error;
      }
      logger.warn(`Conflict registering ingress ${name}`);
      if (issuerAnnotationKey) {
        logger.info(`Patching ingress ${name} instead`);
        const path = `/metadata/annotations/${escapeJsonPointer(issuerAnnotationKey)}`;
        try {
          await axios.patch(
            `${url}/${name}`,
            [
              customSSL
                ? { op: 'remove', path }
                : { op: 'add', path, value: issuerAnnotationValue },
            ],
            {
              ...config,
              headers: {
                ...(config.headers as Record<string, string>),
                'content-type': 'application/json-patch+json',
              },
            },
          );
        } catch (err) {
          if (axios.isAxiosError(err) && err.response?.status !== 422) {
            throw err;
          }

          logger.warn('Patching ingress failed. It was likely already up to date');
        }
      }
    }
    logger.info(`Successfully registered ingress ${name} for ${domain}`);
  };
}
async function createSSLSecretFunction(): Promise<
  (domain: string, certificate: string, key: string) => Promise<void>
> {
  const { serviceName } = argv;
  const namespace = await readK8sSecret('namespace');
  const config = await getAxiosConfig();

  return async (domain, certificate, key) => {
    const instance = normalize(domain);
    const url = `/api/v1/namespaces/${namespace}/secrets`;
    const name = generateSSLSecretName(domain);

    const secret = {
      type: 'kubernetes.io/tls',
      metadata: {
        // https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/#labels
        labels: {
          'app.kubernetes.io/component': 'domain',
          'app.kubernetes.io/instance': instance,
          'app.kubernetes.io/managed-by': serviceName,
          'app.kubernetes.io/name': 'appsemble',
          'app.kubernetes.io/part-of': serviceName,
          'app.kubernetes.io/version': version,
        },
        name,
      },
      data: {
        'tls.crt': Buffer.from(certificate, 'utf8').toString('base64'),
        'tls.key': Buffer.from(key, 'utf8').toString('base64'),
      },
    };

    logger.info(`Creating TLS secret ${name}`);
    try {
      await axios.post(url, secret, config);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status !== 409) {
        throw error;
      }
      logger.warn(`Conflict registering secret ${name}`);
      logger.info(`Updating TLS secret ${name}`);
      await axios.put(`${url}/${name}`, secret, config);
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
  const createSSLSecret = await createSSLSecretFunction();

  /**
   * Register a wildcard domain name ingress for organizations.
   */
  Organization.afterCreate('dns', ({ id }) => createIngress(`*.${id}.${hostname}`));

  /**
   * Register a domain name for apps which have defined a custom domain name.
   */
  App.afterSave('dns', async (app) => {
    const { domain, sslCertificate, sslKey } = app;

    if (domain) {
      await createIngress(domain, Boolean(sslCertificate && sslKey));
      if (sslKey && sslCertificate) {
        await createSSLSecret(domain, sslCertificate, sslKey);
      }
    }
  });

  /**
   * Register a domain name for app collections which have defined a custom domain name.
   */
  AppCollection.afterSave('dns', async (collection) => {
    const { domain } = collection;

    if (domain) {
      await createIngress(domain);
      if (!domain.startsWith('www.')) {
        await createIngress(`www.${domain}`, false, domain);
      }
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
  logger.info(`Successfully deleted all ingresses for ${serviceName}`);

  logger.warn(`Deleting all secrets for ${serviceName}`);
  await axios.delete(`/api/v1/namespaces/${namespace}/secrets`, {
    ...config,
    params: {
      labelSelector: `app.kubernetes.io/managed-by=${serviceName}`,
    },
  });
  logger.info(`Successfully deleted all secrets for ${serviceName}`);
}

/**
 * Restore ingresses for all apps and organizations.
 */
export async function restoreDNS(): Promise<void> {
  const { hostname } = new URL(argv.host);
  const createIngress = await createIngressFunction();

  for await (const { id } of iterTable(Organization, { attributes: ['id'] })) {
    await createIngress(`*.${id}.${hostname}`);
  }

  for await (const { domain } of iterTable(App, {
    attributes: ['domain'],
    // TODO: does changing null to undefined break this query?
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    where: { [Op.and]: [{ domain: { [Op.not]: null } }, { domain: { [Op.not]: '' } }] },
  })) {
    await createIngress(domain!);
  }

  for await (const { domain } of iterTable(AppCollection, {
    attributes: ['domain'],
    // TODO: does changing null to undefined break this query?
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    where: { [Op.and]: [{ domain: { [Op.not]: null } }, { domain: { [Op.not]: '' } }] },
  })) {
    await createIngress(domain!);
    if (!domain!.startsWith('www.')) {
      await createIngress(`www.${domain}`, false, domain);
    }
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
  if (argv.forceProtocolHttps) {
    for (const domain of domains) {
      const { hostname: domainHostname } = new URL(`https://${domain}`);
      const { hostname } = new URL(argv.host);
      if (domainHostname.endsWith(hostname)) {
        pending.delete(domain);
        statuses[domain] = 'ready';
      }
    }
  }
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
