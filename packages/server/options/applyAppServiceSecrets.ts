import https from 'node:https';

import {
  type ApplyAppServiceSecretsParams,
  basicAuth,
  logger,
  version,
} from '@appsemble/node-utils';
import { type App, PredefinedOrganizationRole } from '@appsemble/types';
import axios, { type RawAxiosRequestConfig } from 'axios';
import { isMatch } from 'matcher';
import { Op } from 'sequelize';

import {
  App as AppModel,
  type AppDB,
  type AppServiceSecret,
  getAppDB,
  OrganizationMember,
  User,
} from '../models/index.js';
import { argv } from '../utils/argv.js';
import { checkAppPermissions } from '../utils/authorization.js';
import { decrypt, encrypt } from '../utils/crypto.js';

const tokenErrorNotificationInterval = 24 * 60 * 60 * 1e3;

/**
 * Describe a failed token request the way the token endpoint reported it.
 *
 * OAuth2 token endpoints (RFC 6749 section 5.2) answer with a JSON body holding `error` and
 * optionally `error_description`; the description is the actionable part (e.g. Entra's
 * `AADSTS7000215: Invalid client secret provided`). Transport errors carry no body.
 *
 * @param error The error thrown by the token request.
 * @returns The provider's description, or the transport error message.
 */
function describeTokenError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const description = data?.error_description || data?.error;
    if (typeof description === 'string') {
      return description;
    }
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Record a failed token request on the service secret and email the organization owners.
 *
 * Owners are emailed at most once per secret per 24 hours; the gate is a conditional update, so
 * concurrent failures send a single email.
 *
 * @param context The Koa context of the request that triggered the token request.
 * @param app The app the service secret belongs to.
 * @param AppServiceSecret The service secret model of the app database.
 * @param serviceSecret The service secret whose token request failed.
 * @param error The error thrown by the token request.
 */
async function recordTokenError(
  context: ApplyAppServiceSecretsParams['context'],
  app: App,
  AppServiceSecret: AppDB['AppServiceSecret'],
  serviceSecret: AppServiceSecret,
  error: unknown,
): Promise<void> {
  const now = new Date();
  const lastTokenError = describeTokenError(error);
  const [notify] = await AppServiceSecret.update(
    { lastTokenError, lastTokenErrorAt: now, lastTokenErrorNotifiedAt: now },
    {
      where: {
        id: serviceSecret.id,
        [Op.or]: [
          { lastTokenErrorNotifiedAt: null },
          {
            lastTokenErrorNotifiedAt: {
              [Op.lt]: new Date(now.getTime() - tokenErrorNotificationInterval),
            },
          },
        ],
      },
    },
  );
  if (!notify) {
    await AppServiceSecret.update(
      { lastTokenError, lastTokenErrorAt: now },
      { where: { id: serviceSecret.id } },
    );
    return;
  }

  // Callers load the app with the attributes they need, which need not include the organization.
  const { OrganizationId } = (await AppModel.findByPk(app.id, { attributes: ['OrganizationId'] }))!;
  const owners = await OrganizationMember.findAll({
    where: { role: PredefinedOrganizationRole.Owner, OrganizationId },
    include: [{ model: User, required: true, attributes: ['primaryEmail', 'name', 'locale'] }],
    attributes: [],
  });
  await Promise.all(
    owners.map(async (owner) => {
      try {
        await context.mailer.sendTranslatedEmail({
          to: { name: owner.User!.name, email: owner.User!.primaryEmail! },
          emailName: 'serviceSecretTokenError',
          locale: owner.User!.locale,
          values: {
            name: owner.User!.name,
            appName: app.definition.name,
            secretName: serviceSecret.name || serviceSecret.urlPatterns,
            tokenUrl: serviceSecret.tokenUrl!,
            error: lastTokenError,
            link: (text) => `[${text}](${argv.host}/apps/${app.id}/secrets)`,
          },
        });
      } catch (emailError) {
        // A failed notification must not change the outcome of the proxied request.
        logger.error(
          `Failed to email ${owner.User!.primaryEmail} about service secret ${serviceSecret.id}`,
        );
        logger.error(emailError);
      }
    }),
  );
}

export async function applyAppServiceSecrets({
  app,
  axiosConfig,
  context,
}: ApplyAppServiceSecretsParams): Promise<RawAxiosRequestConfig> {
  const { AppServiceSecret } = await getAppDB(app.id!);
  // XXX: this is not a copy, intent unclear
  const newAxiosConfig = axiosConfig;

  const publicSecrets = await AppServiceSecret.count({
    where: { public: true },
  });
  if (!context.user && !publicSecrets) {
    return newAxiosConfig;
  }
  await checkAppPermissions({ context, appId: app.id!, requiredPermissions: [] });

  const appServiceSecrets = (
    await AppServiceSecret.findAll({ where: { ...(context.user ? {} : { public: true }) } })
  ).map<AppServiceSecret>((secret) => secret.toJSON());

  logger.silly('Service Secrets:');
  for (const serviceSecret of appServiceSecrets) {
    logger.silly(serviceSecret);
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    if (!isMatch(axiosConfig.url, serviceSecret.urlPatterns.split(','))) {
      continue;
    }

    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
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
          // @ts-expect-error 2345 argument of type is not assignable to parameter of type
          // (strictNullChecks)
          `Applying http-basic secret ${basicAuth(serviceSecret.identifier, decryptedSecret)}`,
        );
        newAxiosConfig.headers ??= {};
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
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
          ca: serviceSecret.ca,
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
              // @ts-expect-error 2345 argument of type is not assignable to parameter of type
              // (strictNullChecks)
              isMatch(serviceSecret.tokenUrl, secret.urlPatterns.split(',')),
          );
          let httpsAgent;
          if (clientCertSecret) {
            logger.silly('Using client-certificate secret:');
            logger.silly({
              cert: clientCertSecret.identifier,
              // @ts-expect-error 2345 argument of type is not assignable to parameter of type
              // (strictNullChecks)
              key: decrypt(clientCertSecret.secret, argv.aesSecret),
              ...(clientCertSecret.ca ? { ca: clientCertSecret.ca } : {}),
            });

            httpsAgent = new https.Agent({
              cert: clientCertSecret.identifier,
              // @ts-expect-error 2345 argument of type is not assignable to parameter of type
              // (strictNullChecks)
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
                // @ts-expect-error 2345 argument of type is not assignable to parameter of type
                // (strictNullChecks)
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
                // @ts-expect-error 2345 argument of type is not assignable to parameter of type
                // (strictNullChecks)
                Authorization: basicAuth(serviceSecret.identifier, decryptedSecret),
              },
              httpsAgent,
            });
          } catch (error) {
            logger.verbose(`Failed to fetch token from ${serviceSecret.tokenUrl}`);
            logger.error(error);
            logger.error(String(error));
            await recordTokenError(context, app, AppServiceSecret, serviceSecret, error);
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
                    lastTokenError: null,
                    lastTokenErrorAt: null,
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
              // @ts-expect-error 2345 argument of type is not assignable to parameter of type
              // (strictNullChecks)
              `Using updated client-credentials secret "Bearer ${decrypt(updatedSecret.accessToken, argv.aesSecret)}"`,
            );
            newAxiosConfig.headers ??= {};
            newAxiosConfig.headers.Authorization = `Bearer ${decrypt(
              // @ts-expect-error 2345 argument of type is not assignable to parameter of type
              // (strictNullChecks)
              updatedSecret.accessToken,
              argv.aesSecret,
            )}`;
          }
        } else {
          logger.silly(
            `Using client-credentials secret "Bearer ${decrypt(serviceSecret.accessToken, argv.aesSecret)}"`,
          );

          newAxiosConfig.headers ??= {};
          newAxiosConfig.headers.Authorization = `Bearer ${decrypt(
            serviceSecret.accessToken,
            argv.aesSecret,
          )}`;
        }
        break;
      case 'cookie': {
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        const cookie = `${encodeURIComponent(serviceSecret.identifier)}=${encodeURIComponent(
          decryptedSecret,
        )};`;
        newAxiosConfig.headers ??= {};
        if (axiosConfig.headers?.['Set-Cookie']) {
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
          serviceSecret.identifier?.toLowerCase() === 'authorization' &&
          axiosConfig.headers?.Authorization
        ) {
          logger.silly(
            `Axios config has ${axiosConfig.headers?.Authorization} auth header. Not applying custom-header secret.`,
          );
          continue;
        }
        logger.silly(`Applying custom-header secret ${decryptedSecret}.`);
        newAxiosConfig.headers ??= {};
        // @ts-expect-error 2538 type undefined cannot be used as an index type
        newAxiosConfig.headers[serviceSecret.identifier] = decryptedSecret;
        break;
      case 'query-parameter':
        logger.silly(`Applying query-parameter secret ${decryptedSecret}.`);
        newAxiosConfig.params = {
          ...axiosConfig.params,
          // @ts-expect-error 2464 A computed property must be of type ...
          [serviceSecret.identifier]: decryptedSecret,
        };
        break;
      default:
        break;
    }
  }

  return newAxiosConfig;
}
