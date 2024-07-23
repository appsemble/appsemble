import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Team, transactional } from '../../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

// This no longer creates a team member and doesn't return the role
export async function createAppTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { annotations, name },
    },
  } = ctx;

  await checkAuthSubjectAppPermissions(ctx, appId, [AppPermission.CreateTeams]);

  await transactional(async (transaction) => {
    const team = await Team.create(
      { name, AppId: appId, annotations: annotations || undefined },
      { transaction },
    );

    ctx.body = {
      id: team.id,
      name: team.name,
      annotations: team.annotations ?? {},
    };
  });
}
