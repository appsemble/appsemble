import { getAppRoles } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { addYears } from 'date-fns';
import { type Context } from 'koa';
import forge from 'node-forge';

import { DEFAULT_SAML_EMAIL_ATTRIBUTE } from '../../../../../models/apps/AppSamlSecret.js';
import { App, getAppDB } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';
import {
  normalizeLoginRoleMappings,
  validateLoginRoleMappings,
} from '../../../../../utils/loginRoleMappings.js';

export async function createAppSamlSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['OrganizationId', 'definition'] });
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

  const roleMappingsError = validateLoginRoleMappings(
    body.roleMappings,
    getAppRoles(app.definition.security),
  );
  const roleMappings = normalizeLoginRoleMappings(body.roleMappings);
  const groupAttribute = body.groupAttribute?.trim() || undefined;

  assertKoaCondition(
    roleMappingsError == null,
    ctx,
    400,
    roleMappingsError || 'Invalid role mappings',
  );
  assertKoaCondition(
    !roleMappings || Boolean(groupAttribute),
    ctx,
    400,
    'Group attribute is required when role mappings are configured',
  );

  const { AppSamlSecret } = await getAppDB(appId);
  const secret = {
    ...body,
    groupAttribute,
    roleMappings,
    spCertificate: forge.pki.certificateToPem(cert).trim(),
  };
  const { id } = await AppSamlSecret.create({
    ...secret,
    spPrivateKey: forge.pki.privateKeyToPem(privateKey).trim(),
    spPublicKey: forge.pki.publicKeyToPem(publicKey).trim(),
    emailAttribute: secret.emailAttribute || DEFAULT_SAML_EMAIL_ATTRIBUTE,
  });

  ctx.body = { ...secret, id };
}
