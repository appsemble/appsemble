import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { addYears } from 'date-fns';
import { type Context } from 'koa';
import forge from 'node-forge';

import { DEFAULT_SAML_EMAIL_ATTRIBUTE } from '../../../../../models/AppSamlSecret.js';
import { App, AppSamlSecret } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';

export async function createAppSamlSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret }],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateAppSecrets],
  });

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
    emailAttribute: secret.emailAttribute || DEFAULT_SAML_EMAIL_ATTRIBUTE,
  });

  ctx.body = { ...secret, id };
}
