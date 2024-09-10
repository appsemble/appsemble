import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { checkAppRole, Permission, TeamRole } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, Team, TeamMember, transactional, User } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';
import { assertTeamsDefinition } from '../../../../utils/team.js';

export async function createAppTeam(ctx: Context): Promise<void> {
  const {
    clients,
    pathParams: { appId },
    request: {
      body: { annotations, name },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition', 'OrganizationId', 'id'],
    include:
      'app' in clients
        ? [
            {
              model: AppMember,
              required: false,
              where: { UserId: user.id },
              attributes: ['role', 'UserId', 'id'],
            },
          ]
        : [],
  });
  assertTeamsDefinition(ctx, app);

  if ('app' in clients) {
    const appMember = app.AppMembers.find((member) => member.UserId === user.id);

    assertKoaError(!appMember, ctx, 403, 'User is not an app member');

    if (
      !app.definition.security.teams.create.some((teamName) =>
        checkAppRole(app.definition.security, teamName, appMember.role, appMember.TeamMembers),
      )
    ) {
      throwKoaError(ctx, 403, 'User is not allowed to create teams');
    }
  } else {
    await checkRole(ctx, app.OrganizationId, Permission.ManageTeams);
  }

  let team: Team;
  await transactional(async (transaction) => {
    team = await Team.create(
      { name, AppId: appId, annotations: annotations || undefined },
      { transaction },
    );
    let member =
      app.AppMembers?.[0] ||
      (await AppMember.findOne({ where: { AppId: app.id, UserId: user.id } }));

    if (!member) {
      const completeUser = await User.findByPk(user.id);
      member = await AppMember.create(
        {
          UserId: completeUser.id,
          AppId: app.id,
          role: app.definition.security.default.role,
          name: completeUser.name,
          email: completeUser.primaryEmail,
        },
        { transaction },
      );
    }
    await TeamMember.create(
      { TeamId: team.id, AppMemberId: member.id, role: TeamRole.Manager },
      { transaction },
    );
  });

  ctx.body = {
    id: team.id,
    name: team.name,
    role: TeamRole.Manager,
    annotations: team.annotations ?? {},
  };
}
