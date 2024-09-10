import { assertKoaError, logger } from '@appsemble/node-utils';
import { type SAMLStatus } from '@appsemble/types';
import { wrapPem } from '@appsemble/utils';
import { DOMParser } from '@xmldom/xmldom';
import axios from 'axios';
import { type Context } from 'koa';
import { SignedXml, xpath } from 'xml-crypto';

import {
  App,
  AppMember,
  AppSamlAuthorization,
  AppSamlSecret,
  SamlLoginRequest,
  transactional,
  User,
} from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { createAppOAuth2AuthorizationCode } from '../../../../utils/oauth2.js';
import { NS } from '../../../../utils/saml.js';

const parser = new DOMParser();

export async function assertAppSamlConsumerService(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appSamlSecretId },
    request: {
      body: { RelayState, SAMLResponse },
    },
  } = ctx;

  const prompt = (status: SAMLStatus, query?: Record<string, string>): void =>
    ctx.redirect(`/saml/response/${status}${query ? `?${new URLSearchParams(query)}` : ''}`);

  if (RelayState !== argv.host) {
    return prompt('invalidrelaystate');
  }

  const secret = await AppSamlSecret.findOne({
    attributes: ['entityId', 'idpCertificate', 'objectIdAttribute'],
    where: { AppId: appId, id: appSamlSecretId },
  });

  if (!secret) {
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
  if (secret.entityId) {
    try {
      const { data } = await axios.get<string>(secret.entityId);
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
    getKeyInfo: null,
    getKey: () => Buffer.from(idpCertificate || secret.idpCertificate),
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
        include: [
          {
            model: App,
            attributes: ['definition', 'domain', 'id', 'path', 'OrganizationId', 'scimEnabled'],
          },
        ],
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

  const app = loginRequest.AppSamlSecret.App;
  const authorization = await AppSamlAuthorization.findOne({
    where: { nameId, AppSamlSecretId: appSamlSecretId },
    include: [{ model: AppMember, attributes: { exclude: ['picture'] }, include: [User] }],
  });

  const attributes = new Map(
    Array.from(
      x('AttributeStatement', NS.saml)?.childNodes as unknown as Iterable<Element>,
      (el) => [el.getAttribute('Name')?.trim(), el.firstChild?.textContent?.trim()],
    ),
  );

  // These have to be specified within the SAML secret configuration
  const email = secret.emailAttribute && attributes.get(secret.emailAttribute)?.toLowerCase();
  const name = secret.nameAttribute && attributes.get(secret.nameAttribute);
  const objectId = secret.objectIdAttribute && attributes.get(secret.objectIdAttribute);
  const role = app.definition.security?.default?.role;
  let member: AppMember;
  let user: User;

  switch (true) {
    case authorization != null:
      // If the user is already linked to a known SAML authorization, use that account.
      member = authorization.AppMember;
      user = member.User;
      break;

    case app.scimEnabled:
      // If the app uses SCIM for user provisioning, it should be able to find a user based on
      // the "objectId" attribute in the secret.
      assertKoaError(
        !objectId,
        ctx,
        400,
        'Could not retrieve ObjectID value from incoming secret. Is your app SAML secret configured correctly?.',
      );
      member = await AppMember.findOne({
        where: { AppId: appId, scimExternalId: objectId },
        attributes: { exclude: ['picture'] },
      });
      user = await User.findOne({ where: { id: member.UserId } });
      break;

    default:
      try {
        await transactional(async (transaction) => {
          // Otherwise, link to the Appsemble account that’s logged in to Appsemble Studio.
          // If the user isn’t logged in to Appsemble studio either, create a new anonymous
          // Appsemble account.
          user =
            loginRequest.User ||
            (await User.create(
              {
                name: name || nameId,
                timezone: loginRequest.timezone,
              },
              { transaction },
            ));

          member = await AppMember.findOne({
            where: { UserId: user.id, AppId: appId },
            attributes: { exclude: ['picture'] },
          });

          if (!member) {
            member = await AppMember.create(
              { UserId: user.id, AppId: appId, role, email, name, emailVerified: true },
              { transaction },
            );
          }

          // The logged in account is linked to a new SAML authorization for next time.
          await AppSamlAuthorization.create(
            { nameId, AppSamlSecretId: appSamlSecretId, AppMemberId: member.id },
            { transaction },
          );
        });
      } catch {
        await loginRequest.update({ email, nameId });
        return prompt('emailconflict', { email, id: loginRequest.id });
      }
  }
  const { code } = await createAppOAuth2AuthorizationCode(
    app,
    loginRequest.redirectUri,
    loginRequest.scope,
    user,
    ctx,
  );
  const location = new URL(loginRequest.redirectUri);
  location.searchParams.set('code', code);
  location.searchParams.set('state', loginRequest.state);
  ctx.redirect(String(location));
  ctx.body = `Redirecting to ${location}`;
}
