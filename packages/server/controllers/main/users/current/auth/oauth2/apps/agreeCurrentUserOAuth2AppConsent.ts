import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import {
  App,
  AppMember,
  EmailAuthorization,
  type User,
} from '../../../../../../../models/index.js';
import { checkAppSecurityPolicy } from '../../../../../../../utils/auth.js';
import { createAppOAuth2AuthorizationCode } from '../../../../../../../utils/oauth2.js';

export async function agreeCurrentUserOAuth2AppConsent(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { redirectUri, scope },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['domain', 'definition', 'id', 'path', 'OrganizationId'],
    include: [{ model: AppMember, where: { UserId: user.id }, required: false }],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  if (!(await checkAppSecurityPolicy(app, user as User))) {
    throwKoaError(ctx, 400, 'User is not allowed to login due to the app’s security policy', {
      isAllowed: false,
    });
  }

  if (app.AppMembers.length) {
    await AppMember.update({ consent: new Date() }, { where: { id: app.AppMembers[0].id } });
  } else {
    await (user as User).reload({
      include: [
        {
          model: EmailAuthorization,
          where: { email: { [Op.col]: 'User.primaryEmail' } },
          required: false,
        },
      ],
    });
    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      name: user.name,
      email: user.primaryEmail,
      emailVerified: user.EmailAuthorizations?.[0]?.verified ?? false,
      role: app.definition.security.default.role,
      consent: new Date(),
    });
  }
  ctx.body = await createAppOAuth2AuthorizationCode(app, redirectUri, scope, user as User, ctx);
}
