import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Team, TeamMember, transactional } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

// TODO: When clicking on 'Create Team' in the studio, the UI must handle opening the
//  Appsemble OAuth2 login flow to ensure there is an app member for the user
export async function createTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { annotations, name },
    },
  } = ctx;

  const appMember = await checkAuthSubjectAppPermissions(ctx, appId, [
    AppPermission.CreateTeams,
  ]);

  await transactional(async (transaction) => {
    const team = await Team.create(
      { name, AppId: appId, annotations: annotations || undefined },
      { transaction },
    );

    await TeamMember.create(
      { TeamId: team.id, AppMemberId: appMember.id, role: 'Manager' },
      { transaction },
    );

    ctx.body = {
      id: team.id,
      name: team.name,
      role: 'Manager',
      annotations: team.annotations ?? {},
    };
  });
}
