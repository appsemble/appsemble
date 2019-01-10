#!/usr/bin/env node
const querystring = require('querystring');

const axios = require('axios');

const {
  CI_COMMIT_REF_NAME,
  CI_ENVIRONMENT_SLUG,
  CI_ENVIRONMENT_URL,
  CI_REGISTRY_IMAGE,
  CI_JOB_TOKEN,
} = process.env;

const GITLAB_DEPLOY_URL = 'https://gitlab.com/api/v4/projects/8452871/trigger/pipeline';

/**
 * Trigger the GitLab pipeline that creates a review deployment.
 */
async function deploy() {
  await axios.post(
    GITLAB_DEPLOY_URL,
    querystring.stringify({
      token: CI_JOB_TOKEN,
      ref: 'master',
      'variables[TRIGGER]': 'deploy',
      'variables[ENVIRONMENT]': CI_ENVIRONMENT_SLUG,
      'variables[IMAGE]': `${CI_REGISTRY_IMAGE}:${CI_COMMIT_REF_NAME}`,
    }),
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
      // eslint-disable-next-line no-console
      console.log(`Checking for API status. Try ${i}.`);
      // eslint-disable-next-line no-await-in-loop
      await check();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`The API is down. Retrying in ${interval} milliseconds…`);
      // eslint-disable-next-line no-await-in-loop
      await sleep(interval);
      // eslint-disable-next-line no-continue
      continue;
    }
    // eslint-disable-next-line no-console
    console.log('The API is up!');
    break;
  }
}

async function main() {
  await deploy();
  await waitForServer({ tries: Infinity, interval: 5e3 });
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
