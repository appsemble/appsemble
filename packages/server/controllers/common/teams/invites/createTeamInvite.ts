import { randomBytes } from 'node:crypto';

import { TeamPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, Team, TeamInvite } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';
import { checkAuthSubjectTeamPermissions } from '../../../../utils/authorization.js';

export async function createTeamInvite(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId, teamId },
    request: {
      body: { email, role = 'member' },
    },
  } = ctx;

  await checkAuthSubjectTeamPermissions(ctx, teamId, [TeamPermission.CreateTeamInvites]);

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'path', 'OrganizationId', 'domain'],
  });

  const team = await Team.findOne({ where: { id: teamId } });

  const invite = await TeamInvite.create({
    email: email.trim().toLowerCase(),
    TeamId: teamId,
    key: randomBytes(20).toString('hex'),
    role,
  });

  const url = new URL('/Team-Invite', getAppUrl(app));
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
        emailName: 'teamInvite',
        locale: existingAppMember.locale,
        values: {
          link: (text) => `[${text}](${String(url)})`,
          name: existingAppMember.name,
          teamName: team.name,
          appName: app.definition.name,
        },
      })
    : mailer.sendTranslatedEmail({
        to: { email },
        emailName: 'teamInvite',
        values: {
          link: (text) => `[${text}](${String(url)})`,
          name: 'null',
          teamName: team.name,
          appName: app.definition.name,
        },
      }));
}
