import { promisify } from 'util';
import { deflateRaw } from 'zlib';

import { logger } from '@appsemble/node-utils';
import { stripPem, wrapPem } from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import axios from 'axios';
import { md, pki } from 'node-forge';
import { v4 } from 'uuid';
import { SignedXml, xpath } from 'xml-crypto';
import { DOMImplementation, DOMParser } from 'xmldom';

import { App, AppMember, AppSamlSecret, transactional, User } from '../models';
import { AppSamlAuthorization } from '../models/AppSamlAuthorization';
import { SamlLoginRequest } from '../models/SamlLoginRequest';
import { KoaContext } from '../types';
import { createOAuth2AuthorizationCode } from '../utils/model';

interface Params {
  appId: number;
  appSamlSecretId: number;
}

/**
 * An enum for managing known XML namespaces.
 */
enum NS {
  ds = 'http://www.w3.org/2000/09/xmldsig#',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  md = 'urn:oasis:names:tc:SAML:2.0:metadata',
  saml = 'urn:oasis:names:tc:SAML:2.0:assertion',
  samlp = 'urn:oasis:names:tc:SAML:2.0:protocol',
  xmlns = 'http://www.w3.org/2000/xmlns/',
}

const deflate = promisify(deflateRaw);
const dom = new DOMImplementation();
const parser = new DOMParser();

export async function createAuthnRequest(ctx: KoaContext<Params>): Promise<void> {
  const {
    argv: { host },
    params: { appId, appSamlSecretId },
    request: {
      body: { redirectUri, scope, state },
    },
    user,
  } = ctx;

  const app = await App.findOne({
    where: { id: appId },
    include: [
      {
        model: AppSamlSecret,
        attributes: ['ssoUrl', 'spPrivateKey'],
        where: { id: appSamlSecretId },
        required: false,
      },
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  const [secret] = app.AppSamlSecrets;

  if (!secret) {
    throw notFound('SAML secret not found');
  }

  const loginId = `id${v4()}`;
  const doc = dom.createDocument(NS.samlp, 'samlp:AuthnRequest', null);
  const samlUrl = new URL(`/api/apps/${appId}/saml/${appSamlSecretId}`, host);

  const authnRequest = doc.documentElement;
  authnRequest.setAttributeNS(NS.xmlns, 'xmlns:saml', NS.saml);
  authnRequest.setAttribute('AssertionConsumerServiceURL', `${samlUrl}/acs`);
  authnRequest.setAttribute('Destination', secret.ssoUrl);
  authnRequest.setAttribute('ID', loginId);
  authnRequest.setAttribute('Version', '2.0');
  authnRequest.setAttribute('IssueInstant', new Date().toISOString());
  authnRequest.setAttribute('IsPassive', 'true');

  const issuer = doc.createElementNS(NS.saml, 'saml:Issuer');
  issuer.textContent = `${samlUrl}/metadata.xml`;
  // eslint-disable-next-line unicorn/prefer-node-append
  authnRequest.appendChild(issuer);

  const nameIDPolicy = doc.createElementNS(NS.samlp, 'samlp:NameIDPolicy');
  nameIDPolicy.setAttribute('Format', 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');
  // eslint-disable-next-line unicorn/prefer-node-append
  authnRequest.appendChild(nameIDPolicy);

  const samlRequest = await deflate(Buffer.from(String(doc)));
  const redirect = new URL(secret.ssoUrl);
  redirect.searchParams.set('SAMLRequest', samlRequest.toString('base64'));
  redirect.searchParams.set('RelayState', host);
  redirect.searchParams.set('SigAlg', 'http://www.w3.org/2000/09/xmldsig#rsa-sha1');

  const privateKey = pki.privateKeyFromPem(secret.spPrivateKey);

  const sha = md.sha1.create().update(String(redirect.searchParams));
  const signatureBinary = privateKey.sign(sha);
  const signature = Buffer.from(signatureBinary).toString('base64');
  redirect.searchParams.set('Signature', signature);

  await SamlLoginRequest.create({
    id: loginId,
    AppSamlSecretId: appSamlSecretId,
    UserId: user?.id,
    redirectUri,
    state,
    scope,
  });

  ctx.body = { redirect: String(redirect) };
}

export async function assertConsumerService(ctx: KoaContext<Params>): Promise<void> {
  const {
    argv,
    params: { appId, appSamlSecretId },
    request: {
      body: { RelayState, SAMLResponse },
    },
  } = ctx;

  if (RelayState !== argv.host) {
    throw badRequest('Invalid RelayState');
  }

  const secret = await AppSamlSecret.findOne({
    attributes: ['entityId', 'idpCertificate'],
    where: { AppId: appId, id: appSamlSecretId },
  });

  if (!secret) {
    throw notFound('SAML secret not found');
  }

  const buf = Buffer.from(SAMLResponse, 'base64');
  const xml = buf.toString('utf-8');
  const doc = parser.parseFromString(xml);
  const x = (localName: string, namespace: NS, element: Node = doc): Element =>
    xpath(
      element,
      `//*[local-name(.)="${localName}" and namespace-uri(.)="${namespace}"]`,
    )?.[0] as Element;

  const sig = new SignedXml();

  const status = x('StatusCode', NS.samlp);
  if (status.getAttribute('Value') !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
    throw badRequest('Status code is unsuccesful');
  }

  const signature = x('Signature', NS.ds);
  let idpCertificate: string;
  if (secret.entityId) {
    try {
      const { data } = await axios.get(secret.entityId);
      const metadata = parser.parseFromString(data);
      const cert = x('X509Certificate', NS.ds, metadata)?.textContent;
      if (cert) {
        idpCertificate = wrapPem(cert, 'CERTIFICATE');
      }
    } catch {
      // Fall back to the secret IDP certificate
    }
  }

  sig.keyInfoProvider = {
    file: null,
    getKeyInfo: null,
    getKey: () => Buffer.from(idpCertificate || secret.idpCertificate),
  };
  sig.loadSignature(signature);
  const res = sig.checkSignature(xml);
  if (!res) {
    sig.validationErrors.forEach((error) => {
      logger.warn(error);
    });
    throw badRequest('Bad signature');
  }
  logger.info(xml);

  const subject = x('Subject', NS.saml);
  if (!subject) {
    throw badRequest('No subject could be found');
  }

  const nameId = x('NameID', NS.saml, subject)?.textContent;
  if (!nameId) {
    throw badRequest('Unsupported NameID');
  }

  const loginId = x('SubjectConfirmationData', NS.saml, subject)?.getAttribute('InResponseTo');
  if (!loginId) {
    throw badRequest('Invalid subject confirmation data');
  }

  const loginRequest = await SamlLoginRequest.findOne({
    where: { id: loginId },
    include: [
      {
        model: AppSamlSecret,
        include: [
          { model: App, attributes: ['definition', 'domain', 'id', 'path', 'OrganizationId'] },
        ],
      },
      { model: User, attributes: ['id'] },
    ],
  });
  if (!loginRequest) {
    throw badRequest('Invalid subject confirmation data');
  }

  const app = loginRequest.AppSamlSecret.App;
  const authorization = await AppSamlAuthorization.findOne({
    where: { nameId, AppSamlSecretId: appSamlSecretId },
    include: [{ model: User }],
  });

  let user: User;
  if (authorization) {
    // If the user is already linked to a known SAML authorization, use that account.
    user = authorization.User;
  } else {
    await transactional(async (transaction) => {
      // Otherwise, link to the Appsemble account that’s logged in to Appsemble Studio.
      // If the user isn’t logged in to Appsemble studio either, create a new anonymous Appsemble
      // account.
      user = loginRequest.User || (await User.create({ name: nameId }, { transaction }));

      // The logged in account is linked to a new SAML authorization for next time.
      await AppSamlAuthorization.create(
        { nameId, AppSamlSecretId: appSamlSecretId, UserId: user.id },
        { transaction },
      );

      const role = app.definition.security?.default?.role;
      if (role) {
        await AppMember.create({ UserId: user.id, AppId: appId, role }, { transaction });
      }
    });
  }

  const { code } = await createOAuth2AuthorizationCode(
    argv,
    app,
    loginRequest.redirectUri,
    loginRequest.scope,
    user,
  );
  const location = new URL(loginRequest.redirectUri);
  location.searchParams.set('code', code);
  location.searchParams.set('state', loginRequest.state);
  ctx.redirect(String(location));
  ctx.body = `Redirecting to ${location}`;
}

export async function getEntityId(ctx: KoaContext<Params>): Promise<void> {
  const {
    argv: { host },
    params: { appId, appSamlSecretId },
    path,
  } = ctx;

  const secret = await AppSamlSecret.findOne({
    attributes: ['spCertificate'],
    where: { AppId: appId, id: appSamlSecretId },
  });

  if (!secret) {
    throw notFound('SAML secret not found');
  }

  const doc = dom.createDocument(NS.md, 'md:EntityDescriptor', null);
  const entityDescriptor = doc.documentElement;
  entityDescriptor.setAttributeNS(NS.xmlns, 'xmlns:md', NS.md);
  entityDescriptor.setAttribute('entityID', String(new URL(path, host)));

  const spssoDescriptor = doc.createElementNS(NS.md, 'md:SPSSODescriptor');
  spssoDescriptor.setAttribute('AuthnRequestsSigned', 'true');
  spssoDescriptor.setAttribute('WantAssertionsSigned', 'true');
  spssoDescriptor.setAttribute('protocolSupportEnumeration', NS.samlp);
  // eslint-disable-next-line unicorn/prefer-node-append
  entityDescriptor.appendChild(spssoDescriptor);

  const createKeyDescriptor = (use: string): void => {
    const keyDescriptor = doc.createElementNS(NS.md, 'md:KeyDescriptor');
    keyDescriptor.setAttribute('use', use);
    // eslint-disable-next-line unicorn/prefer-node-append
    spssoDescriptor.appendChild(keyDescriptor);

    const keyInfo = doc.createElementNS(NS.ds, 'ds:KeyInfo');
    keyInfo.setAttributeNS(NS.xmlns, 'xmlns:ds', NS.ds);
    // eslint-disable-next-line unicorn/prefer-node-append
    entityDescriptor.appendChild(keyInfo);

    const x509Data = doc.createElementNS(NS.ds, 'ds:X509Data');
    // eslint-disable-next-line unicorn/prefer-node-append
    keyInfo.appendChild(x509Data);

    const x509Certificate = doc.createElementNS(NS.ds, 'ds:X509Certificate');
    x509Certificate.textContent = stripPem(secret.spCertificate, true);
    // eslint-disable-next-line unicorn/prefer-node-append
    x509Data.appendChild(x509Certificate);
  };

  createKeyDescriptor('signing');
  createKeyDescriptor('encryption');

  const assertionConsumerService = doc.createElementNS(NS.md, 'md:AssertionConsumerService');
  assertionConsumerService.setAttribute(
    'Binding',
    'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
  );
  assertionConsumerService.setAttribute(
    'Location',
    String(new URL(`/api/apps/${appId}/saml/${appSamlSecretId}/acs`, host)),
  );
  // eslint-disable-next-line unicorn/prefer-node-append
  entityDescriptor.appendChild(assertionConsumerService);

  ctx.body = `<?xml version="1.0" encoding="utf-8"?>\n${doc}`;
}
