import { assertKoaCondition, logger } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMessages, getAppDB, User } from '../../../../models/index.js';
import { revokeAppMemberRefreshSessionsForMember } from '../../../../utils/appMemberRefreshSession.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function resetAppMemberTotp(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId, appMemberId },
    user: authSubject,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [
      'id',
      'definition',
      'emailName',
      'emailHost',
      'emailUser',
      'emailPassword',
      'emailPort',
      'emailSecure',
      'OrganizationId',
    ],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    requiredPermissions: [OrganizationPermission.ResetAppMemberTotp],
    organizationId: app.OrganizationId,
  });

  const user = await User.findByPk(authSubject!.id, { attributes: ['id', 'name'] });

  const { AppMember, sequelize } = await getAppDB(appId);
  const appMember = await sequelize.transaction(async (transaction) => {
    const member = await AppMember.findByPk(appMemberId, {
      attributes: ['id', 'email', 'name', 'locale', 'totpEnabled'],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    assertKoaCondition(member != null, ctx, 404, 'App member not found');
    assertKoaCondition(member.totpEnabled, ctx, 400, 'TOTP is not enabled');

    await app.reload({
      include: {
        model: AppMessages,
        attributes: ['messages'],
        required: false,
        where: { language: member.locale ?? defaultLocale },
      },
    });

    await AppMember.update(
      {
        totpSecret: null,
        totpEnabled: false,
        totpLastCounter: null,
        totpFailedAttempts: 0,
        totpLockedUntil: null,
      },
      { where: { id: member.id }, transaction },
    );
    await revokeAppMemberRefreshSessionsForMember(appId, member.id, transaction);
    return member;
  });

  logger.verbose(
    `Organization member ${user!.name} (${user!.id}) reset the TOTP of app member ${appMember.id} of app ${appId}`,
  );

  mailer
    .sendTranslatedEmail({
      to: appMember,
      from: app.emailName,
      emailName: 'totpReset',
      appId,
      locale: appMember.locale,
      values: {
        appName: app.AppMessages?.[0]?.messages?.app?.name ?? app.definition.name,
        name: appMember.name || 'null',
      },
      app,
    })
    .catch((error: Error) => {
      logger.error(error);
    });

  ctx.status = 204;
}
