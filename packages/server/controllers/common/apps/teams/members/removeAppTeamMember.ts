import { assertKoaError } from '@appsemble/node-utils';
import { Permissions, uuid4Pattern } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, Team, TeamMember } from '../../../../../models/index.js';
import { checkRole } from '../../../../../utils/checkRole.js';
import { checkTeamPermission } from '../../../../../utils/team.js';

export async function removeAppTeamMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId, teamId },
  } = ctx;

  const isUuid = uuid4Pattern.test(memberId);
  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      {
        model: TeamMember,
        include: [
          {
            model: AppMember,
            where: isUuid ? { id: memberId } : { email: memberId },
          },
        ],
        required: false,
      },
      { model: App, attributes: ['OrganizationId', 'demoMode'] },
    ],
  });

  assertKoaError(!team, ctx, 400, 'Team not found');

  if (!(team.App.demoMode && team.Members[0]?.AppMember.demo)) {
    try {
      await checkRole(ctx, team.App.OrganizationId, Permissions.ManageTeams);
    } catch {
      await checkTeamPermission(ctx, team);
    }
  }

  assertKoaError(!team.Members.length, ctx, 400, 'This user is not a member of this team.');

  await team.Members[0].destroy();
}
