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
 * Deploy the newly built Appsemble Docker image to Kubernetes.
 */
async function deploy() {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const apps = kc.makeApiClient(k8s.Extensions_v1beta1Api);
  const core = kc.makeApiClient(k8s.Core_v1Api);
  try {
    logger.info(`Creating deployment: ${mysqlDeployment.metadata.name}`);
    await apps.createNamespacedDeployment(KUBE_NAMESPACE, mysqlDeployment);
    logger.info(`Created deployment: ${mysqlDeployment.metadata.name}`);
    logger.info(`Creating service: ${mysqlService.metadata.name}`);
    await core.createNamespacedService(KUBE_NAMESPACE, mysqlService);
    logger.info(`Created service: ${mysqlService.metadata.name}`);
  } catch (err) {
    if (err.response.statusCode !== 409) {
      throw err;
    }
    logger.warn(`Deployment ${mysqlDeployment.metadata.name} Already exists… Replacing instead.`);
    await apps.replaceNamespacedDeployment(
      mysqlDeployment.metadata.name,
      KUBE_NAMESPACE,
      mysqlDeployment,
    );
    logger.info(`Replaced deployment: ${mysqlDeployment.metadata.name}`);
  }
  try {
    logger.info(`Creating deployment: ${appsembleDeployment.metadata.name}`);
    await apps.createNamespacedDeployment(KUBE_NAMESPACE, appsembleDeployment);
    logger.info(`Created deployment: ${appsembleDeployment.metadata.name}`);
    logger.info(`Creating service: ${appsembleService.metadata.name}`);
    await core.createNamespacedService(KUBE_NAMESPACE, appsembleService);
    logger.info(`Created service: ${appsembleService.metadata.name}`);
  } catch (err) {
    if (err.response.statusCode !== 409) {
      throw err;
    }
    logger.warn(
      `Deployment ${appsembleDeployment.metadata.name} Already exists… Replacing instead.`,
    );
    await apps.replaceNamespacedDeployment(
      appsembleDeployment.metadata.name,
      KUBE_NAMESPACE,
      appsembleDeployment,
    );
    logger.info(`Replaced deployment: ${appsembleDeployment.metadata.name}`);
  }
  try {
    logger.info(`Creating ingress: ${ingress.metadata.name}`);
    await apps.createNamespacedIngress(KUBE_NAMESPACE, ingress);
    logger.info(`Created ingress: ${ingress.metadata.name}`);
  } catch (err) {
    if (err.response.statusCode !== 409) {
      throw err;
    }
    logger.warn(`Ingress ${ingress.metadata.name} Already exists… Skipping.`);
  }
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
