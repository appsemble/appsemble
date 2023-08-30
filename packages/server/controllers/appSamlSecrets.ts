import { Permission } from '@appsemble/utils';
import { addYears } from 'date-fns';
import { type Context } from 'koa';
import forge from 'node-forge';

import { App, AppSamlSecret } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { checkAppLock } from '../utils/checkAppLock.js';
import { checkRole } from '../utils/checkRole.js';

export async function createAppSamlSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret }],
  });
  if (!app) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'App not found',
    };
    ctx.throw();
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const { privateKey, publicKey } = await new Promise<forge.pki.rsa.KeyPair>((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: 2048 }, (error, result) =>
      error ? reject(error) : resolve(result),
    );
  });
  const cert = forge.pki.createCertificate();
  cert.publicKey = publicKey;
  cert.privateKey = privateKey;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = addYears(new Date(), 10);
  const attrs = [
    { shortName: 'CN', value: argv.host },
    { shortName: 'O', value: 'Appsemble' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(privateKey);

  const secret = { ...body, spCertificate: forge.pki.certificateToPem(cert).trim() };
  const { id } = await AppSamlSecret.create({
    ...secret,
    AppId: appId,
    spPrivateKey: forge.pki.privateKeyToPem(privateKey).trim(),
    spPublicKey: forge.pki.publicKeyToPem(publicKey).trim(),
  });
  ctx.body = { ...secret, id };
}

export async function getAppSamlSecrets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret }],
  });
  if (!app) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'App not found',
    };
    ctx.throw();
  }

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  ctx.body = app.AppSamlSecrets;
}

export async function updateAppSamlSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appSamlSecretId },
    request: {
      body: {
        emailAttribute,
        entityId,
        icon,
        idpCertificate,
        name,
        nameAttribute,
        objectIdAttribute,
        ssoUrl,
      },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret, required: false, where: { id: appSamlSecretId } }],
  });

  if (!app) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'App not found',
    };
    ctx.throw();
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const [secret] = app.AppSamlSecrets;
  if (!secret) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'SAML secret not found',
    };
    ctx.throw();
  }

  ctx.body = await secret.update({
    emailAttribute,
    entityId,
    icon,
    idpCertificate,
    name,
    nameAttribute,
    objectIdAttribute,
    ssoUrl,
  });
}
export async function deleteAppSamlSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appSamlSecretId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret, required: false, where: { id: appSamlSecretId } }],
  });
  if (!app) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'App not found',
    };
    ctx.throw();
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const [secret] = app.AppSamlSecrets;
  if (!secret) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'SAML secret not found',
    };
    ctx.throw();
  }

  await secret.destroy();
}
