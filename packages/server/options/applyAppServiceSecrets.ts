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

  for (const serviceSecret of appServiceSecrets) {
    if (!isMatch(axiosConfig.url, serviceSecret.urlPatterns.split(','))) {
      continue;
    }

    const decryptedSecret = decrypt(serviceSecret.secret, argv.aesSecret);

    switch (serviceSecret.authenticationMethod) {
      case 'http-basic':
        if (axiosConfig.headers?.Authorization) {
          continue;
        }
        newAxiosConfig.headers.Authorization = basicAuth(serviceSecret.identifier, decryptedSecret);
        break;
      case 'client-certificate':
        if (axiosConfig.httpsAgent) {
          continue;
        }
        newAxiosConfig.httpsAgent = new https.Agent({
          cert: serviceSecret.identifier,
          key: decryptedSecret,
        });
        break;
      case 'client-credentials':
        if (axiosConfig.headers?.Authorization) {
          continue;
        }
        if (
          !serviceSecret.accessToken ||
          // Only retrieve a new token starting 10 minutes before expiry of the current token
          Number(serviceSecret.expiresAt) - 6 * 1e5 < Date.now()
        ) {
          const clientCertSecret = appServiceSecrets.find(
            (secret) =>
              secret.authenticationMethod === 'client-certificate' &&
              isMatch(serviceSecret.tokenUrl, secret.urlPatterns.split(',')),
          );
          let httpsAgent;
          if (clientCertSecret) {
            httpsAgent = new https.Agent({
              cert: clientCertSecret.identifier,
              key: decrypt(clientCertSecret.secret, argv.aesSecret),
              ...(clientCertSecret.ca ? { ca: clientCertSecret.ca } : {}),
            });
          }

          let response;
          try {
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
            newAxiosConfig.headers.Authorization = `Bearer ${decrypt(
              updatedSecret.accessToken,
              argv.aesSecret,
            )}`;
          }
        } else {
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
          newAxiosConfig.headers['Set-Cookie'] += ` ${cookie}`;
        } else {
          newAxiosConfig.headers['Set-Cookie'] = cookie;
        }
        break;
      }
      case 'custom-header':
        if (
          serviceSecret.identifier.toLowerCase() === 'authorization' &&
          axiosConfig.headers?.Authorization
        ) {
          continue;
        }
        newAxiosConfig.headers[serviceSecret.identifier] = decryptedSecret;
        break;
      case 'query-parameter':
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
