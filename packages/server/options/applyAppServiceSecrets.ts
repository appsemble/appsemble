import https from 'node:https';

import {
  type ApplyAppServiceSecretsParams,
  basicAuth,
  logger,
  version,
} from '@appsemble/node-utils';
import axios, { type RawAxiosRequestConfig } from 'axios';
import { isMatch } from 'matcher';

import { checkAuthSubjectAppPermissions } from './checkAuthSubjectAppPermissions.js';
import { AppServiceSecret } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { decrypt, encrypt } from '../utils/crypto.js';

export async function applyAppServiceSecrets({
  app,
  axiosConfig,
  context,
}: ApplyAppServiceSecretsParams): Promise<RawAxiosRequestConfig> {
  const newAxiosConfig = axiosConfig;

  if (!context.user) {
    return newAxiosConfig;
  }
  await checkAuthSubjectAppPermissions({ context, app, permissions: [] });

  const appServiceSecrets = (
    await AppServiceSecret.findAll({
      where: { AppId: app.id },
    })
  ).map<AppServiceSecret>((secret) => secret.toJSON());

  logger.silly('Service Secrets:');
  for (const serviceSecret of appServiceSecrets) {
    logger.silly(serviceSecret);
    if (!isMatch(axiosConfig.url, serviceSecret.urlPatterns.split(','))) {
      continue;
    }

    const decryptedSecret = decrypt(serviceSecret.secret, argv.aesSecret);

    switch (serviceSecret.authenticationMethod) {
      case 'http-basic':
        if (axiosConfig.headers?.Authorization) {
          logger.silly(
            `Axios config has ${axiosConfig.headers?.Authorization} auth header. Not applying http-basic secret.`,
          );
          continue;
        }
        logger.silly(
          `Applying http-basic secret ${basicAuth(serviceSecret.identifier, decryptedSecret)}`,
        );
        newAxiosConfig.headers.Authorization = basicAuth(serviceSecret.identifier, decryptedSecret);
        break;
      case 'client-certificate':
        if (axiosConfig.httpsAgent) {
          logger.silly(
            `Axios config has ${axiosConfig.httpsAgent} httpsAgent. Not applying client-certificate secret.`,
          );
          continue;
        }
        logger.silly(
          `Applying client-certificate secret { cert: ${serviceSecret.identifier}; key: ${decryptedSecret} }`,
        );
        newAxiosConfig.httpsAgent = new https.Agent({
          cert: serviceSecret.identifier,
          key: decryptedSecret,
        });
        break;
      case 'client-credentials':
        if (axiosConfig.headers?.Authorization) {
          logger.silly(
            `Axios config has ${axiosConfig.headers?.Authorization} auth header. Not applying client-credentials secret.`,
          );
          continue;
        }
        if (
          !serviceSecret.accessToken ||
          // Only retrieve a new token starting 10 minutes before expiry of the current token
          Number(serviceSecret.expiresAt) - 6 * 1e5 < Date.now()
        ) {
          logger.silly('Token has expired. Retrieving new one.');
          const clientCertSecret = appServiceSecrets.find(
            (secret) =>
              secret.authenticationMethod === 'client-certificate' &&
              isMatch(serviceSecret.tokenUrl, secret.urlPatterns.split(',')),
          );
          let httpsAgent;
          if (clientCertSecret) {
            logger.silly('Using client-certificate secret:');
            logger.silly({
              cert: clientCertSecret.identifier,
              key: decrypt(clientCertSecret.secret, argv.aesSecret),
              ...(clientCertSecret.ca ? { ca: clientCertSecret.ca } : {}),
            });

            httpsAgent = new https.Agent({
              cert: clientCertSecret.identifier,
              key: decrypt(clientCertSecret.secret, argv.aesSecret),
              ...(clientCertSecret.ca ? { ca: clientCertSecret.ca } : {}),
            });
          }

          let response;
          try {
            logger.silly('Fetching token using:');
            logger.silly({
              url: serviceSecret.tokenUrl,
              method: 'POST',
              data: {
                grant_type: 'client_credentials',
                ...(serviceSecret.scope ? { scope: serviceSecret.scope } : {}),
              },
              headers: {
                'user-agent': `AppsembleServer/${version}`,
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: basicAuth(serviceSecret.identifier, decryptedSecret),
              },
              httpsAgent,
            });

            response = await axios({
              url: serviceSecret.tokenUrl,
              method: 'POST',
              data: {
                grant_type: 'client_credentials',
                ...(serviceSecret.scope ? { scope: serviceSecret.scope } : {}),
              },
              headers: {
                'user-agent': `AppsembleServer/${version}`,
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: basicAuth(serviceSecret.identifier, decryptedSecret),
              },
              httpsAgent,
            });
          } catch (error) {
            logger.verbose(`Failed to fetch token from ${serviceSecret.tokenUrl}`);
            logger.error(error);
            logger.error(String(error));
          }

          let updatedSecret;
          if (response) {
            try {
              logger.silly(
                `Updating client-credentials secret with the new token ${response.data.access_token}`,
              );
              updatedSecret = (
                await AppServiceSecret.update(
                  {
                    accessToken: encrypt(response.data.access_token, argv.aesSecret),
                    expiresAt: Date.now() + response.data.expires_in * 1e3,
                  },
                  { where: { id: serviceSecret.id }, returning: true },
                )
              )[1][0];
            } catch (error) {
              logger.verbose(`Failed to update service secret ${serviceSecret.name}`);
              logger.error(error);
            }
          }

          if (updatedSecret) {
            logger.silly(
              `Using updated client-credentials secret "Bearer ${decrypt(updatedSecret.accessToken, argv.aesSecret)}"`,
            );

            newAxiosConfig.headers.Authorization = `Bearer ${decrypt(
              updatedSecret.accessToken,
              argv.aesSecret,
            )}`;
          }
        } else {
          logger.silly(
            `Using client-credentials secret "Bearer ${decrypt(serviceSecret.accessToken, argv.aesSecret)}"`,
          );

          newAxiosConfig.headers.Authorization = `Bearer ${decrypt(
            serviceSecret.accessToken,
            argv.aesSecret,
          )}`;
        }
        break;
      case 'cookie': {
        const cookie = `${encodeURIComponent(serviceSecret.identifier)}=${encodeURIComponent(
          decryptedSecret,
        )};`;
        if (axiosConfig.headers['Set-Cookie']) {
          logger.silly(`Appending cookie secret ${cookie}`);
          newAxiosConfig.headers['Set-Cookie'] += ` ${cookie}`;
        } else {
          logger.silly(`Setting cookie secret ${cookie}`);
          newAxiosConfig.headers['Set-Cookie'] = cookie;
        }
        break;
      }
      case 'custom-header':
        if (
          serviceSecret.identifier.toLowerCase() === 'authorization' &&
          axiosConfig.headers?.Authorization
        ) {
          logger.silly(
            `Axios config has ${axiosConfig.headers?.Authorization} auth header. Not applying custom-header secret.`,
          );
          continue;
        }
        logger.silly(`Applying custom-header secret ${decryptedSecret}.`);
        newAxiosConfig.headers[serviceSecret.identifier] = decryptedSecret;
        break;
      case 'query-parameter':
        logger.silly(`Applying query-parameter secret ${decryptedSecret}.`);
        newAxiosConfig.params = {
          ...axiosConfig.params,
          [serviceSecret.identifier]: decryptedSecret,
        };
        break;
      default:
        break;
    }
  }

  return newAxiosConfig;
}
