import { logger } from '@appsemble/node-utils';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import fs from 'fs-extra';
import https from 'https';
import path from 'path';

async function readK8sSecret(filename) {
  return fs.readFile(path.join('/var/run/secrets/kubernetes.io/serviceaccount', filename), 'utf-8');
}

/**
 * Configure a method to map domain names to a service by updating a single ingress.
 *
 * This method requires a role bound to the default service account, which allows Appsemble to
 * read and update a single ingress resource.
 */
export default async function kubernetes({
  host,
  ingressName,
  ingressServiceName,
  ingressServicePort,
  kubernetesServiceHost = 'kubernetes.default.svc',
  kubernetesServicePort = 443,
}) {
  const K8S_HOST = `https://${kubernetesServiceHost}:${kubernetesServicePort}`;
  const ca = await readK8sSecret('ca.crt');
  const namespace = await readK8sSecret('namespace');
  const token = await readK8sSecret('token');
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json-patch+json',
  };
  const httpsAgent = new https.Agent({ ca });
  const config = { headers, httpsAgent };
  const {
    data: { info },
  } = await axios.get(`${K8S_HOST}/openapi/v2`, config);
  logger.info(`Using Kubernetes API version: ${info.title} ${info.version}`);
  const url = `${K8S_HOST}/apis/networking.k8s.io/v1beta1/namespaces/${namespace}/ingresses/${ingressName}`;

  function formatRule(domain) {
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

  function formatTLS(domain) {
    return {
      hosts: [domain],
      secretName: `${normalize(domain)}-tls`,
    };
  }

  async function add(...domains) {
    domains.forEach(domain => {
      logger.info(`Registering ingress rule for ${domain}`);
    });
    await axios.patch(
      url,
      [].concat(
        ...domains.map(domain => [
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
      ),
      config,
    );
  }

  async function update(oldDomain, newDomain) {
    const {
      data: {
        spec: { rules, tls },
      },
    } = await axios.get(url, config);
    logger.info(`Changing ingress rule for ${oldDomain} to ${newDomain}`);
    const ops = [];
    const ruleIndex = rules.findIndex(rule => rule.host === oldDomain);
    const tlsIndex = tls.findIndex(t => t.hosts.includes(newDomain));
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

  async function remove(domain) {
    await update(domain, host);
  }

  return { add, remove, update };
}
