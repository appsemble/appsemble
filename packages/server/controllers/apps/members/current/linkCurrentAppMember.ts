import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import {
  AppMember,
  AppOAuth2Authorization,
  AppSamlAuthorization,
  EmailAuthorization,
  User,
} from '../../../../models/index.js';

export async function linkCurrentAppMember(ctx: Context): Promise<void> {
  const {
    // PathParams: { appId },
    request: {
      body: { email, externalId, secret },
    },
    user: { id: AppMemberId },
  } = ctx;
  const assert = (emailVerified: boolean): void =>
    assertKoaCondition(
      emailVerified,
      ctx,
      403,
      `Account linking is only allowed to a verified account. Please verify your email ${email}.`,
    );

  const [type, secretId] = secret.split(':');
  switch (type) {
    case 'oauth2': {
      const authorization = await AppOAuth2Authorization.findOne({
        where: { sub: externalId, AppOAuth2SecretId: secretId, email },
        attributes: ['sub', 'AppOAuth2SecretId', 'emailVerified'],
      });
      assert(authorization.emailVerified);
      authorization.update({ AppMemberId });
      break;
    }
    case 'saml': {
      const authorization = await AppSamlAuthorization.findOne({
        where: { nameId: externalId, AppSamlSecretId: secretId, email },
        attributes: ['nameId', 'AppSamlSecretId', 'emailVerified'],
      });
      assert(authorization.emailVerified);
      authorization.update({ AppMemberId });
      break;
    }
    case 'user': {
      const user = await User.findByPk(externalId, {
        include: {
          model: EmailAuthorization,
          where: { email, verified: true },
          required: true,
          limit: 1,
        },
        attributes: ['id'],
      });
      assert(user?.EmailAuthorizations?.[0]?.verified);
      await AppMember.update({ UserId: externalId }, { where: { id: AppMemberId } });
      break;
    }
    default:
      break;
  }
}
