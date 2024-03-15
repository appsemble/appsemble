import https from 'node:https';

import { type ApplyAppServiceSecretsParams, basicAuth, version } from '@appsemble/node-utils';
import { checkAppRole } from '@appsemble/utils';
import axios, { type RawAxiosRequestConfig } from 'axios';
import { type Context } from 'koa';
import { isMatch } from 'matcher';

import { App, AppMember, AppServiceSecret, Organization } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { decrypt, encrypt } from '../utils/crypto.js';

async function verifyPermission(ctx: Context, app: App): Promise<AppServiceSecret[]> {
  if (!app) {
    return [];
  }

  const appServiceSecrets = await AppServiceSecret.findAll({
    where: { AppId: app.id },
  });

  if (!appServiceSecrets.length) {
    return [];
  }

  if (!app.definition.security) {
    // Apply service secrets without security when opted-in.
    if (app.enableUnsecuredServiceSecrets) {
      return appServiceSecrets.map<AppServiceSecret>((secret) => secret.toJSON());
    }
    return [];
  }

  const { user } = ctx;

  if (!user) {
    return [];
  }

  await app.reload({
    attributes: ['id', 'OrganizationId', 'definition'],
    include: user
      ? [
          { model: Organization, attributes: ['id'] },
          {
            model: AppMember,
            attributes: ['role', 'UserId'],
            required: false,
            where: { UserId: user.id },
          },
        ]
      : [],
  });

  const member = app.AppMembers?.find((m) => m.UserId === user?.id);
  const { policy = 'everyone', role: defaultRole } = app.definition.security.default;
  let role: string;

  if (member) {
    ({ role } = member);
  } else {
    switch (policy) {
      case 'everyone':
        role = defaultRole;
        break;

      case 'organization':
        if (!(await app.Organization.$has('User', user.id))) {
          return [];
        }

        role = defaultRole;
        break;

      case 'invite':
        return [];

      default:
        role = null;
    }
  }

  const { roles: appRoles } = app.definition;
  if (!appRoles.some((r) => checkAppRole(app.definition.security, r, role, null))) {
    return [];
  }

  return appServiceSecrets.map<AppServiceSecret>((secret) => secret.toJSON());
}

export async function applyAppServiceSecrets({
  app,
  axiosConfig,
  context,
}: ApplyAppServiceSecretsParams): Promise<RawAxiosRequestConfig> {
  const newAxiosConfig = axiosConfig;

  const persistedApp = await App.findOne({
    where: {
      id: app.id,
    },
  });

  const appServiceSecrets = await verifyPermission(context, persistedApp);

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
            });
          }
          const response = await axios({
            url: serviceSecret.tokenUrl,
            method: 'POST',
            data: {
              grant_type: 'client_credentials',
            },
            headers: {
              'user-agent': `AppsembleServer/${version}`,
              'content-type': 'application/x-www-form-urlencoded',
              Authorization: basicAuth(serviceSecret.identifier, decryptedSecret),
            },
            httpsAgent,
          });
          const updatedSecret = (
            await AppServiceSecret.update(
              {
                accessToken: encrypt(response.data.access_token, argv.aesSecret),
                expiresAt: Date.now() + response.data.expires_in * 1e3,
              },
              { where: { id: serviceSecret.id }, returning: true },
            )
          )[1][0];
          newAxiosConfig.headers.Authorization = `Bearer ${decrypt(
            updatedSecret.accessToken,
            argv.aesSecret,
          )}`;
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
