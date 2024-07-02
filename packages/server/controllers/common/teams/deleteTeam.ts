import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Team } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function deleteTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, teamId },
  } = ctx;

  await checkAuthSubjectAppPermissions(ctx, appId, [AppPermission.DeleteTeams]);

  const team = await Team.findByPk(teamId);

  assertKoaError(!team, ctx, 404, 'Team not found');

  await team.destroy();
}
