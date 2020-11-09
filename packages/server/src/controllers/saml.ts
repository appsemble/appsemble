import { promisify } from 'util';
import { deflateRaw } from 'zlib';

import { logger } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import { addYears } from 'date-fns';
import { md, pki } from 'node-forge';
import { v4 } from 'uuid';
import { SignedXml, xpath } from 'xml-crypto';
import { DOMImplementation, DOMParser, XMLSerializer } from 'xmldom';

import { App, AppSamlSecret } from '../models';
import { KoaContext } from '../types';
import { checkRole } from '../utils/checkRole';

interface Params {
  appId: number;
  appSamlSecretId: number;
}

const deflate = promisify(deflateRaw);
const dom = new DOMImplementation();
const parser = new DOMParser();
const serializer = new XMLSerializer();
const ds = 'http://www.w3.org/2000/09/xmldsig#';
const saml = 'urn:oasis:names:tc:SAML:2.0:assertion';
const samlp = 'urn:oasis:names:tc:SAML:2.0:protocol';

export async function createAppSamlSecret(ctx: KoaContext<Params>): Promise<void> {
  const {
    argv: { host },
    params: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const { privateKey, publicKey } = await new Promise<pki.rsa.KeyPair>((resolve, reject) => {
    pki.rsa.generateKeyPair({ bits: 2048 }, (error, result) =>
      error ? reject(error) : resolve(result),
    );
  });
  const cert = pki.createCertificate();
  cert.publicKey = publicKey;
  cert.privateKey = privateKey;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = addYears(new Date(), 10);
  const attrs = [
    { shortName: 'CN', value: host },
    { shortName: 'O', value: 'Appsemble' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(privateKey);

  const secret = {
    ...body,
    AppId: appId,
    spPrivateKey: pki.privateKeyToPem(privateKey).trim(),
    spPublicKey: pki.publicKeyToPem(publicKey).trim(),
    spCertificate: pki.certificateToPem(cert).trim(),
  };

  ctx.body = await AppSamlSecret.create(secret);
}

export async function getAppSamlSecrets(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  ctx.body = app.AppSamlSecrets;
}

export async function updateAppSamlSecret(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, appSamlSecretId },
    request: {
      body: { entityId, icon, idpCertificate, name, ssoUrl },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret, where: { id: appSamlSecretId } }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const [secret] = app.AppSamlSecrets;

  if (!secret) {
    throw notFound('SAML secret nof found');
  }

  ctx.body = await secret.update({
    entityId,
    icon,
    idpCertificate,
    name,
    ssoUrl,
  });
}

export async function createAuthnRequest(ctx: KoaContext<Params>): Promise<void> {
  const {
    argv: { host },
    params: { appId, appSamlSecretId },
  } = ctx;

  const secret = await AppSamlSecret.findOne({
    attributes: ['ssoUrl', 'spPrivateKey'],
    where: { AppId: appId, id: appSamlSecretId },
  });

  const loginID = `id${v4()}`;
  const doc = dom.createDocument(samlp, 'samlp:AuthnRequest', null);
  const samlUrl = new URL(`/api/apps/${appId}/saml/${appSamlSecretId}`, host);

  const authnRequest = doc.documentElement;
  authnRequest.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:saml', saml);
  authnRequest.setAttribute('AssertionConsumerServiceURL', `${samlUrl}/acs`);
  authnRequest.setAttribute('Destination', secret.ssoUrl);
  authnRequest.setAttribute('ID', loginID);
  authnRequest.setAttribute('Version', '2.0');
  authnRequest.setAttribute('IssueInstant', new Date().toISOString());
  authnRequest.setAttribute('IsPassive', 'true');

  const issuer = doc.createElementNS(saml, 'saml:Issuer');
  issuer.textContent = `${samlUrl}/metadata.xml`;
  // eslint-disable-next-line unicorn/prefer-node-append
  authnRequest.appendChild(issuer);

  const nameIDPolicy = doc.createElementNS(samlp, 'samlp:NameIDPolicy');
  nameIDPolicy.setAttribute('Format', 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');
  // eslint-disable-next-line unicorn/prefer-node-append
  authnRequest.appendChild(nameIDPolicy);

  const xml = serializer.serializeToString(doc);
  const samlRequest = await deflate(Buffer.from(xml));
  const redirect = new URL(secret.ssoUrl);
  redirect.searchParams.set('SAMLRequest', samlRequest.toString('base64'));
  redirect.searchParams.set('RelayState', host);
  redirect.searchParams.set('SigAlg', 'http://www.w3.org/2000/09/xmldsig#rsa-sha1');

  const privateKey = pki.privateKeyFromPem(secret.spPrivateKey);

  const sha = md.sha1.create().update(String(redirect.searchParams));
  const signatureBinary = privateKey.sign(sha);
  const signature = Buffer.from(signatureBinary).toString('base64');
  redirect.searchParams.set('Signature', signature);

  ctx.body = { redirect: String(redirect) };
}

export async function assertConsumerService(ctx: KoaContext): Promise<void> {
  const {
    params: { appId, appSamlSecretId },
    request: {
      body: { RelayState, SAMLResponse },
    },
  } = ctx;

  const secret = await AppSamlSecret.findOne({
    attributes: ['idpCertificate'],
    where: { AppId: appId, id: appSamlSecretId },
  });

  const buf = Buffer.from(SAMLResponse, 'base64');
  const xml = buf.toString('utf-8');
  const doc = parser.parseFromString(xml);
  const x = (selector: string, element: Node = doc): Element =>
    xpath(element, selector)?.[0] as Element;
  const sig = new SignedXml();

  const status = x(`//*[local-name(.)="StatusCode" and namespace-uri(.)="${samlp}"]`);
  if (status.getAttribute('Value') !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
    throw badRequest('Status code is unsuccesful');
  }

  const signature = x(`//*[local-name(.)="Signature" and namespace-uri(.)="${ds}"]`);

  sig.keyInfoProvider = {
    file: null,
    getKeyInfo: null,
    getKey: () => Buffer.from(secret.idpCertificate),
  };
  sig.loadSignature(signature);
  const res = sig.checkSignature(xml);
  if (!res) {
    throw badRequest('Bad signature');
  }

  const subject = x(`//*[local-name(.)="Subject" and namespace-uri(.)="${saml}"]`);
  if (!subject) {
    throw badRequest('No subject could be found');
  }

  const nameId = x(`//*[local-name(.)="NameID" and namespace-uri(.)="${saml}"]`)?.textContent;
  if (!nameId) {
    throw badRequest('Unsupported NameID');
  }
  ctx.redirect('/callback');
}
