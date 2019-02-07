import { logger } from '@appsemble/node-utils';
import * as k8s from '@kubernetes/client-node';
import axios from 'axios';

import appsembleDeployment from '../kubernetes/appsembleDeployment';
import appsembleService from '../kubernetes/appsembleService';
import ingress from '../kubernetes/ingress';
import mysqlDeployment from '../kubernetes/mysqlDeployment';
import mysqlService from '../kubernetes/mysqlService';

const { CI_ENVIRONMENT_URL, KUBE_NAMESPACE } = process.env;

/**
 * Create or replace a Kubernetes resource.
 *
 * At first, an attempt is made to create a resource. If this fails due to a conflict, the resource
 * is replaced instead.
 *
 * @param {Object} resource The resource to create or replace.
 * @param {Function} create The function to use for creating the resource.
 * @param {Function} replace The function to use for replacing the resource.
 */
async function noConflict(resource, create, replace) {
  const { kind } = resource;
  const { name } = resource.metadata;
  try {
    logger.info(`Creating ${kind.toLowerCase()}: ${name}`);
    await create(KUBE_NAMESPACE, resource);
    logger.info(`Created ${kind.toLowerCase()}: ${name}`);
  } catch (err) {
    if (err.response.statusCode !== 409) {
      throw err;
    }
    logger.warn(`${kind} ${name} already exists… Replacing instead.`);
    await replace(name, KUBE_NAMESPACE, resource);
    logger.info(`Replaced ${kind.toLowerCase()}: ${name}`);
  }
}

/**
 * Deploy the newly built Appsemble Docker image to Kubernetes.
 */
async function deploy() {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const apps = kc.makeApiClient(k8s.Apps_v1Api);
  const beta = kc.makeApiClient(k8s.Extensions_v1beta1Api);
  const core = kc.makeApiClient(k8s.Core_v1Api);

  await noConflict(
    mysqlDeployment,
    apps.createNamespacedDeployment.bind(apps),
    apps.replaceNamespacedDeployment.bind(apps),
  );
  await noConflict(
    mysqlService,
    core.createNamespacedService.bind(core),
    core.replaceNamespacedService.bind(core),
  );
  await noConflict(
    appsembleDeployment,
    apps.createNamespacedDeployment.bind(apps),
    apps.replaceNamespacedDeployment.bind(apps),
  );
  await noConflict(
    appsembleService,
    core.createNamespacedService.bind(core),
    core.replaceNamespacedService.bind(core),
  );
  await noConflict(
    ingress,
    beta.createNamespacedIngress.bind(beta),
    beta.replaceNamespacedIngress.bind(beta),
  );
}

/**
 * Sleep asynchronously.
 *
 * @param {Number} milliseconds How long to sleep.
 */
async function sleep(milliseconds) {
  await new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Check if the API is up and running by fetching the OpenAPI definition.
 */
async function check() {
  await axios.get('/api.json', { baseURL: CI_ENVIRONMENT_URL });
}

/**
 * Wait until the Appsemble server is up and running.
 *
 * @param {Object} options
 * @param {Number} options.tries How often to check if the API is up and running.
 * @param {Number} options.interval How long to wait between checks in milliseconds.
 */
async function waitForServer({ tries, interval }) {
  for (let i = 0; i < tries; i += 1) {
    try {
      logger.info(`Checking for API status. Try ${i}.`);
      // eslint-disable-next-line no-await-in-loop
      await check();
    } catch (err) {
      logger.info(`The API is down. Retrying in ${interval} milliseconds…`);
      // eslint-disable-next-line no-await-in-loop
      await sleep(interval);
      // eslint-disable-next-line no-continue
      continue;
    }
    logger.info('The API is up!');
    break;
  }
}

async function main() {
  await deploy();
  await waitForServer({ tries: Infinity, interval: 5e3 });
}

main().catch(err => {
  logger.error(err);
  process.exit(1);
});
