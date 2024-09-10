import { assertKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, Team, TeamMember, type User } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function patchAppTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, teamId },
    request: {
      body: { annotations, name },
    },
    user,
  } = ctx;

  await (user as User).reload({ attributes: ['id', 'primaryEmail'] });

  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      {
        model: TeamMember,
        required: false,
        include: [{ model: AppMember, where: { email: user.primaryEmail } }],
      },
      { model: App, attributes: ['OrganizationId'] },
    ],
  });

  assertKoaError(!team, ctx, 404, 'Team not found.');

  await checkRole(ctx, team.App.OrganizationId, Permissions.ManageTeams);

  await team.update({ name: name || undefined, annotations: annotations || undefined });
  ctx.body = {
    id: team.id,
    name,
    ...(annotations && { annotations }),
    ...(team.Members.length && { role: team.Members[0].role }),
  };
}
