import { assertKoaCondition, logger } from '@appsemble/node-utils';
import { type SAMLStatus } from '@appsemble/types';
import { wrapPem } from '@appsemble/utils';
import { DOMParser } from '@xmldom/xmldom';
import axios from 'axios';
import { type Context } from 'koa';
import { type Promisable } from 'type-fest';
import { SignedXml, xpath } from 'xml-crypto';

import {
  App,
  AppMember,
  AppSamlAuthorization,
  AppSamlSecret,
  SamlLoginRequest,
  User,
} from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { checkAppSecurityPolicy, handleUniqueAppMemberEmailIndex } from '../../../../utils/auth.js';
import { createAppOAuth2AuthorizationCode } from '../../../../utils/oauth2.js';
import { NS } from '../../../../utils/saml.js';

const parser = new DOMParser();

export async function assertAppSamlConsumerService(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appSamlSecretId },
    request: {
      body: { RelayState, SAMLResponse },
    },
    user: authSubject,
  } = ctx;

  const prompt = (status: SAMLStatus, query?: Record<string, string>): void =>
    ctx.redirect(`/saml/response/${status}${query ? `?${new URLSearchParams(query)}` : ''}`);

  if (RelayState !== argv.host) {
    return prompt('invalidrelaystate');
  }

  const app = await App.findByPk(appId, {
    attributes: ['definition', 'domain', 'id', 'path', 'OrganizationId', 'scimEnabled'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  assertKoaCondition(
    await checkAppSecurityPolicy(app, authSubject?.id),
    ctx,
    401,
    'User is not allowed to login due to the app’s security policy',
    { isAllowed: false },
  );

  const appSamlSecret = await AppSamlSecret.findOne({
    attributes: ['entityId', 'idpCertificate', 'objectIdAttribute'],
    where: { AppId: appId, id: appSamlSecretId },
  });

  if (!appSamlSecret) {
    return prompt('invalidsecret');
  }

  const buf = Buffer.from(SAMLResponse, 'base64');
  const xml = buf.toString('utf8');
  logger.verbose(`SAML response XML: ${xml}`);
  const doc = parser.parseFromString(xml);
  const x = (localName: string, namespace: NS, element: Node = doc): Element =>
    xpath(
      element,
      `//*[local-name(.)="${localName}" and namespace-uri(.)="${namespace}"]`,
    )?.[0] as Element;

  const sig = new SignedXml();

  const status = x('StatusCode', NS.samlp);
  if (status.getAttribute('Value') !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
    return prompt('invalidstatuscode');
  }

  const signature = x('Signature', NS.ds);
  let idpCertificate: string;
  if (appSamlSecret.entityId) {
    try {
      const { data } = await axios.get<string>(appSamlSecret.entityId);
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
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks) - Severe
    getKeyInfo: null,
    getKey: () => Buffer.from(idpCertificate || appSamlSecret.idpCertificate),
  };
  sig.loadSignature(signature);
  const res = sig.checkSignature(xml);
  if (!res) {
    for (const error of sig.validationErrors) {
      logger.warn(error);
    }
    return prompt('badsignature');
  }

  const subject = x('Subject', NS.saml);
  if (!subject) {
    return prompt('missingsubject');
  }

  const nameId = x('NameID', NS.saml, subject)?.textContent;
  if (!nameId) {
    return prompt('missingnameid');
  }

  const loginId = x('SubjectConfirmationData', NS.saml, subject)?.getAttribute('InResponseTo');
  if (!loginId) {
    return prompt('invalidsubjectconfirmation');
  }

  const loginRequest = await SamlLoginRequest.findOne({
    where: { id: loginId },
    include: [
      {
        model: AppSamlSecret,
      },
      {
        model: User,
        attributes: ['id', 'primaryEmail'],
      },
    ],
  });
  if (!loginRequest) {
    return prompt('invalidsubjectconfirmation');
  }

  const authorization = await AppSamlAuthorization.findOne({
    where: { nameId, AppSamlSecretId: appSamlSecretId },
    include: [{ model: AppMember, attributes: ['id'] }],
  });

  const attributes = new Map(
    Array.from(
      x('AttributeStatement', NS.saml)?.childNodes as unknown as Iterable<Element>,
      (el) => [el.getAttribute('Name')?.trim(), el.firstChild?.textContent?.trim()],
    ),
  );

  // These have to be specified within the SAML secret configuration
  const email =
    appSamlSecret.emailAttribute && attributes.get(appSamlSecret.emailAttribute)?.toLowerCase();
  const emailVerified =
    (appSamlSecret.emailVerifiedAttribute &&
      attributes.get(appSamlSecret.emailVerifiedAttribute)?.toLowerCase()) === 'true';
  const name = appSamlSecret.nameAttribute && attributes.get(appSamlSecret.nameAttribute);
  const objectId =
    appSamlSecret.objectIdAttribute && attributes.get(appSamlSecret.objectIdAttribute);

  function handleAuthorization(appMember?: AppMember): Promisable<AppSamlAuthorization> {
    return (
      authorization ??
      AppSamlAuthorization.create({
        nameId,
        email,
        emailVerified,
        AppSamlSecretId: appSamlSecretId,
        AppMemberId: appMember?.id,
      })
    );
  }

  let appMember: AppMember;
  const location = new URL(loginRequest.redirectUri);

  switch (true) {
    case app.scimEnabled:
      // If the app uses SCIM for user provisioning, it should be able to find a user based on
      // the "objectId" attribute in the secret.
      assertKoaCondition(
        objectId != null,
        ctx,
        400,
        'Could not retrieve ObjectID value from incoming secret. Is your app SAML secret configured correctly?.',
      );
      appMember = await AppMember.findOne({
        where: { AppId: appId, scimExternalId: objectId },
        attributes: { exclude: ['picture'] },
      });
      break;

    default:
      appMember = authorization?.AppMember;
      if (!appMember) {
        const role = app.definition.security?.default?.role;
        try {
          appMember = await AppMember.create({
            AppId: appId,
            role,
            email,
            name,
            timezone: '',
            emailVerified,
          });
          await handleAuthorization(appMember);
        } catch (error) {
          await handleUniqueAppMemberEmailIndex(
            ctx,
            error,
            // @ts-expect-error 2345 argument of type is not assignable to parameter of type
            // (strictNullChecks) - Severe
            email,
            emailVerified,
            async ({ logins, user }) => {
              const { AppSamlSecretId, nameId: id } = await handleAuthorization();
              const secret = `saml:${AppSamlSecretId}`;
              location.searchParams.set('externalId', id);
              location.searchParams.set('secret', secret);
              // @ts-expect-error 2345 argument of type is not assignable to parameter of type
              // (strictNullChecks) - Severe
              location.searchParams.set('email', email);
              location.searchParams.set('user', String(user));
              location.searchParams.set('logins', logins);
            },
          );
        }
      }
  }

  if (appMember) {
    const { code } = await createAppOAuth2AuthorizationCode(
      app,
      loginRequest.redirectUri,
      loginRequest.scope,
      appMember,
      ctx,
    );
    location.searchParams.set('code', code);
    location.searchParams.set('state', loginRequest.state);
  }
  ctx.redirect(String(location));
  ctx.body = `Redirecting to ${location}`;
}
