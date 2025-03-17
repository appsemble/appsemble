import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { deflateRaw } from 'node:zlib';

import { assertKoaCondition, logger } from '@appsemble/node-utils';
import { DOMImplementation } from '@xmldom/xmldom';
import { type Context } from 'koa';
import forge from 'node-forge';

import { App, AppMember, AppSamlSecret, SamlLoginRequest } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { checkAppSecurityPolicy } from '../../../../utils/auth.js';
import { NS } from '../../../../utils/saml.js';

const deflate = promisify(deflateRaw);
const dom = new DOMImplementation();

// TODO: check, make sure to connect it to the app member instead of the user
export async function createAppSamlAuthnRequest(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appSamlSecretId },
    request: {
      body: { redirectUri, scope, state, timezone },
    },
    user: authSubject,
  } = ctx;

  const app = await App.findOne({
    where: { id: appId },
    attributes: ['id'],
    include: [
      {
        model: AppSamlSecret,
        attributes: ['ssoUrl', 'spPrivateKey'],
        where: { id: appSamlSecretId },
        required: false,
      },
    ],
  });

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  assertKoaCondition(
    await checkAppSecurityPolicy(app, authSubject?.id),
    ctx,
    401,
    'User is not allowed to login due to the app’s security policy',
    { isAllowed: false },
  );

  const appMember = await AppMember.findOne({
    where: { AppId: app.id, UserId: authSubject.id },
    attributes: ['id'],
  });

  assertKoaCondition(!!appMember, ctx, 404, 'App member not found');
  const [secret] = app.AppSamlSecrets;
  assertKoaCondition(!!secret, ctx, 404, 'SAML secret not found');

  const loginId = `id${randomUUID()}`;
  const doc = dom.createDocument(NS.samlp, 'samlp:AuthnRequest', null);
  const samlUrl = new URL(`/api/apps/${appId}/saml/${appSamlSecretId}`, argv.host);

  const authnRequest = doc.documentElement;
  authnRequest.setAttributeNS(NS.xmlns, 'xmlns:saml', NS.saml);
  authnRequest.setAttribute('AssertionConsumerServiceURL', `${samlUrl}/acs`);
  authnRequest.setAttribute('Destination', secret.ssoUrl);
  authnRequest.setAttribute('ID', loginId);
  authnRequest.setAttribute('Version', '2.0');
  authnRequest.setAttribute('IssueInstant', new Date().toISOString());

  const issuer = doc.createElementNS(NS.saml, 'saml:Issuer');
  issuer.textContent = `${samlUrl}/metadata.xml`;
  // eslint-disable-next-line unicorn/prefer-dom-node-append
  authnRequest.appendChild(issuer);

  const nameIDPolicy = doc.createElementNS(NS.samlp, 'samlp:NameIDPolicy');
  nameIDPolicy.setAttribute('Format', 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');
  // eslint-disable-next-line unicorn/prefer-dom-node-append
  authnRequest.appendChild(nameIDPolicy);

  logger.verbose(`SAML request XML: ${doc}`);
  const samlRequest = await deflate(Buffer.from(String(doc)));
  const redirect = new URL(secret.ssoUrl);
  redirect.searchParams.set('SAMLRequest', samlRequest.toString('base64'));
  redirect.searchParams.set('RelayState', argv.host);
  redirect.searchParams.set('SigAlg', 'http://www.w3.org/2000/09/xmldsig#rsa-sha1');

  const privateKey = forge.pki.privateKeyFromPem(secret.spPrivateKey);

  const sha = forge.md.sha1.create().update(String(redirect.searchParams));
  const signatureBinary = privateKey.sign(sha);
  const signature = Buffer.from(signatureBinary).toString('base64');
  redirect.searchParams.set('Signature', signature);

  await SamlLoginRequest.create({
    id: loginId,
    AppMemberId: appMember.id,
    AppSamlSecretId: appSamlSecretId,
    redirectUri,
    state,
    scope,
    timezone,
  });

  ctx.body = { redirect: String(redirect) };
}
