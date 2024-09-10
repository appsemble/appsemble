import { randomBytes } from 'node:crypto';

import { GroupPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, Group, GroupInvite } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';
import { checkAuthSubjectGroupPermissions } from '../../../../utils/authorization.js';

export async function createGroupInvite(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId, groupId },
    request: {
      body: { email, role = 'member' },
    },
  } = ctx;

  await checkAuthSubjectGroupPermissions(ctx, groupId, [GroupPermission.CreateGroupInvites]);

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'path', 'OrganizationId', 'domain'],
  });

  const group = await Group.findOne({ where: { id: groupId } });

  const invite = await GroupInvite.create({
    email: email.trim().toLowerCase(),
    GroupId: groupId,
    key: randomBytes(20).toString('hex'),
    role,
  });

  const url = new URL('/Group-Invite', getAppUrl(app));
  url.searchParams.set('code', invite.key);

  const existingAppMember = await AppMember.findOne({
    where: { email },
    attributes: ['name', 'locale'],
  });

  await (existingAppMember
    ? mailer.sendTranslatedEmail({
        to: {
          name: existingAppMember.name,
          email,
        },
        emailName: 'groupInvite',
        locale: existingAppMember.locale,
        values: {
          link: (text) => `[${text}](${String(url)})`,
          name: existingAppMember.name,
          groupName: group.name,
          appName: app.definition.name,
        },
      })
    : mailer.sendTranslatedEmail({
        to: { email },
        emailName: 'groupInvite',
        values: {
          link: (text) => `[${text}](${String(url)})`,
          name: 'null',
          groupName: group.name,
          appName: app.definition.name,
        },
      }));
}
