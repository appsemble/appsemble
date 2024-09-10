import { randomBytes } from 'node:crypto';

import { assertKoaError } from '@appsemble/node-utils';
import { checkAppRole } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, Team, TeamInvite, TeamMember } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';

export async function createAppTeamInvite(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId, teamId },
    request: {
      body: { email, role = 'member' },
    },
    user: authSubject,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'path', 'OrganizationId', 'domain'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  assertKoaError(!app.definition.security, ctx, 400, 'App does not have a security definition.');

  assertKoaError(!app.definition.security.teams, ctx, 400, 'App does not have a teams definition.');

  assertKoaError(
    app.definition.security.teams.join !== 'invite',
    ctx,
    400,
    'Team invites are not supported.',
  );

  const team = await Team.findOne({ where: { id: teamId } });

  assertKoaError(!team, ctx, 404, 'Team not found');

  const appMember = await AppMember.findByPk(authSubject.id);

  const teamMembers = await TeamMember.findAll({
    where: { TeamId: teamId },
    include: { model: AppMember, where: { id: appMember.id } },
  });

  assertKoaError(
    !app.definition.security.teams.invite.some((r) =>
      checkAppRole(app.definition.security, r, appMember.role, teamMembers),
    ),
    ctx,
    403,
    'App member is not allowed to invite members to this team',
  );

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
