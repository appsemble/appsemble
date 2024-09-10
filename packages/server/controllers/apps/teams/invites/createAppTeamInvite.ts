import { randomBytes } from 'node:crypto';

import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { checkAppRole } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, Team, TeamInvite, TeamMember, User } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';
import { assertTeamsDefinition } from '../../../../utils/team.js';

export async function createAppTeamInvite(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId, teamId },
    request: {
      body: { email, role = 'member' },
    },
    user,
  } = ctx;

  await (user as User).reload({ attributes: ['id', 'primaryEmail'] });

  const app = await App.findOne({
    attributes: ['id', 'definition', 'path', 'OrganizationId', 'domain'],
    where: { id: appId },
    include: [
      { model: Team, required: false, where: { id: teamId } },
      {
        model: AppMember,
        required: false,
        attributes: ['role'],
        where: { email: user.primaryEmail },
      },
    ],
  });
  assertTeamsDefinition(ctx, app);

  if (app.definition.security.teams.join !== 'invite') {
    throwKoaError(ctx, 400, 'Team invites are not supported');
  }
  assertKoaError(!app.Teams?.length, ctx, 400, `Team ${teamId} does not exist`);

  const teamMembers = await TeamMember.findAll({
    where: { TeamId: teamId },
    include: { model: AppMember, where: { email: user.primaryEmail } },
  });
  const [appMember] = app.AppMembers;
  if (
    !app.definition.security.teams.invite.some((r) =>
      checkAppRole(app.definition.security, r, appMember?.role, teamMembers),
    )
  ) {
    throwKoaError(ctx, 403, 'User is not allowed to invite members to this team');
  }

  const invite = await TeamInvite.create({
    email: email.trim().toLowerCase(),
    TeamId: teamId,
    key: randomBytes(20).toString('hex'),
    role,
  });
  const url = new URL('/Team-Invite', getAppUrl(app));
  url.searchParams.set('code', invite.key);

  const existingUser = await User.findOne({
    where: {
      primaryEmail: email,
    },
    attributes: ['name', 'locale'],
  });

  await mailer.sendTranslatedEmail({
    to: {
      ...(existingUser ? { name: existingUser.name } : {}),
      email,
    },
    emailName: 'teamInvite',
    ...(existingUser ? { locale: existingUser.locale } : {}),
    values: {
      link: (text) => `[${text}](${String(url)})`,
      name: existingUser ? existingUser.name : 'null',
      teamName: app.Teams[0].name,
      appName: app.definition.name,
    },
  });
}
