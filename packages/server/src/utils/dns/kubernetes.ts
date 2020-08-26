import { promises as fs } from 'fs';
import { Agent } from 'https';
import { join } from 'path';

import { logger } from '@appsemble/node-utils';
import { normalize } from '@appsemble/utils';
import axios from 'axios';

import type { DNSImplementation } from '.';
import type { Argv } from '../../types';

function readK8sSecret(filename: string): Promise<string> {
  return fs.readFile(join('/var/run/secrets/kubernetes.io/serviceaccount', filename), 'utf-8');
}

interface Rule {
  host: string;
  http: {
    paths: {
      path: string;
      backend: {
        serviceName: string;
        servicePort: string | number;
      };
    }[];
  };
}

interface TLS {
  hosts: string[];
  secretName: string;
}

interface Ingress {
  spec: {
    rules: Rule[];
    tls: TLS[];
  };
}

function formatTLS(domain: string): TLS {
  return {
    hosts: [domain],
    secretName: `${normalize(domain)}-tls`,
  };
}

/**
 * Configure a method to map domain names to a service by updating a single ingress.
 *
 * This method requires a role bound to the default service account, which allows Appsemble to
 * read and update a single ingress resource.
 *
 * @param argv - The parsed command line arguments.
 *
 * @returns A DNS implemenation basd on a Kubernetes ingress.
 */
export async function kubernetes({
  host,
  ingressName,
  ingressServiceName,
  ingressServicePort,
  kubernetesServiceHost = 'kubernetes.default.svc',
  kubernetesServicePort = 443,
}: Argv): Promise<DNSImplementation> {
  const K8S_HOST = `https://${kubernetesServiceHost}:${kubernetesServicePort}`;
  const ca = await readK8sSecret('ca.crt');
  const namespace = await readK8sSecret('namespace');
  const token = await readK8sSecret('token');
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json-patch+json',
  };
  const httpsAgent = new Agent({ ca });
  const config = { headers, httpsAgent };
  const {
    data: { info },
  } = await axios.get(`${K8S_HOST}/openapi/v2`, config);
  logger.info(`Using Kubernetes API version: ${info.title} ${info.version}`);
  const url = `${K8S_HOST}/apis/networking.k8s.io/v1beta1/namespaces/${namespace}/ingresses/${ingressName}`;

  function formatRule(domain: string): Rule {
    return {
      host: domain,
      http: {
        paths: [
          {
            path: '/',
            backend: {
              serviceName: ingressServiceName,
              servicePort: ingressServicePort,
            },
          },
        ],
      },
    };
  }

  async function add(...domains: string[]): Promise<void> {
    domains.forEach((domain) => {
      logger.info(`Registering ingress rule for ${domain}`);
    });
    await axios.patch(
      url,
      domains.flatMap((domain) => [
        {
          op: 'add',
          path: '/spec/rules/-',
          value: formatRule(domain),
        },
        {
          op: 'add',
          path: '/spec/tls/-',
          value: formatTLS(domain),
        },
      ]),
      config,
    );
  }

  async function update(oldDomain: string, newDomain: string): Promise<void> {
    const {
      data: {
        spec: { rules, tls },
      },
    } = await axios.get<Ingress>(url, config);
    logger.info(`Changing ingress rule for ${oldDomain} to ${newDomain}`);
    const ops = [];
    const ruleIndex = rules.findIndex((rule) => rule.host === oldDomain);
    const tlsIndex = tls.findIndex((t) => t.hosts.includes(newDomain));
    ops.push(
      ruleIndex === -1
        ? {
            op: 'add',
            path: '/spec/rules/-',
            value: formatRule(newDomain),
          }
        : {
            op: 'replace',
            path: `/spec/rules/${ruleIndex}`,
            value: formatRule(newDomain),
          },
    );
    if (tlsIndex === -1) {
      ops.push({
        op: 'add',
        path: '/spec/tls/-',
        value: formatTLS(newDomain),
      });
    }
    await axios.patch(url, ops, config);
  }

  async function remove(domain: string): Promise<void> {
    await update(domain, host);
  }

  return { add, remove, update };
}
