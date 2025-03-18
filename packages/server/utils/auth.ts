import { randomBytes } from 'node:crypto';

import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op, type Transaction, UniqueConstraintError } from 'sequelize';
import { type Promisable } from 'type-fest';

import { argv } from './argv.js';
import { type Mailer } from './email/Mailer.js';
import {
  type App,
  AppMember,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  AppSamlAuthorization,
  AppSamlSecret,
  EmailAuthorization,
  OrganizationMember,
  User,
} from '../models/index.js';

export async function processEmailAuthorization(
  mailer: Mailer,
  id: string,
  name: string,
  email: string,
  verified: boolean,
  transaction: Transaction,
): Promise<void> {
  const key = verified ? null : randomBytes(40).toString('hex');
  await EmailAuthorization.create(
    { UserId: id, email: email.toLowerCase(), key, verified },
    { transaction },
  );
  const user = await User.findByPk(id, { attributes: ['locale'] });
  if (!verified) {
    await mailer.sendTranslatedEmail({
      to: {
        name,
        email,
      },
      emailName: 'resend',
      ...(user ? { locale: user.locale } : {}),
      values: {
        link: (text) => `[${text}](${argv.host}/verify?token=${key})`,
        name: user ? user.name : 'null',
        appName: 'null',
      },
    });
  }
}

export async function checkAppSecurityPolicy(app: App, authSubjectId?: string): Promise<boolean> {
  const policy = app.definition?.security?.default?.policy ?? 'everyone';

  if (policy === 'invite') {
    return false;
  }

  if (policy === 'everyone') {
    return true;
  }

  if (policy === 'organization' && authSubjectId) {
    return Boolean(
      await OrganizationMember.count({
        where: { OrganizationId: app.OrganizationId, UserId: authSubjectId },
      }),
    );
  }

  return false;
}

export async function handleUniqueAppMemberEmailIndex(
  ctx: Context,
  error: unknown,
  email: string,
  emailVerified: boolean,

  /**
   * Callback which handles creation/authorization updates.
   *
   * The `externalId` is either the `sub` when using OAuth2, `nameId` when using SAML or `UserId`
   * when using the Appsemble OAuth2 flow.
   * The `secret` is the type of secret either oauth2 or saml combined with the id, or just user;
   * format `oauth2|saml:{id}` or `user:`.
   */
  handleAuthorization: (data: { email: string; user: boolean; logins: string }) => Promisable<void>,
): Promise<void> {
  if (
    error instanceof UniqueConstraintError &&
    'constraint' in error.parent &&
    error.parent.constraint === 'UniqueAppMemberEmailIndex'
  ) {
    assertKoaCondition(
      emailVerified,
      ctx,
      403,
      `Account linking is only allowed to a verified account. Please verify your email ${email}.`,
    );
    const memberToLink = await AppMember.findOne({
      where: { AppId: ctx.pathParams.appId, email },
      attributes: ['id', 'email', 'UserId'],
      include: [
        {
          model: AppOAuth2Authorization,
          include: [{ model: AppOAuth2Secret, attributes: ['id'] }],
          attributes: ['AppOAuth2SecretId'],
          required: false,
        },
        {
          model: AppSamlAuthorization,
          include: [{ model: AppSamlSecret, attributes: ['id'] }],
          attributes: ['AppSamlSecretId'],
          required: false,
        },
      ],
    });
    const hasPassword = await AppMember.count({
      where: { id: memberToLink.id, password: { [Op.ne]: null } },
    });
    const data = {
      email,
      user: Boolean(memberToLink.UserId),
      password: Boolean(hasPassword),
      logins: [
        ...memberToLink.AppOAuth2Authorizations.map(
          ({ AppOAuth2Secret: { id } }) => `oauth2:${id}`,
        ),
        ...memberToLink.AppSamlAuthorizations.map(({ AppSamlSecret: { id } }) => `saml:${id}`),
      ].join(','),
    };
    await handleAuthorization(data);
  }
}
