import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, Team, TeamMember, type User } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function deleteAppTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, teamId },
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

  await checkRole(ctx, team.App.OrganizationId, Permission.ManageTeams);

  await team.destroy();
}
