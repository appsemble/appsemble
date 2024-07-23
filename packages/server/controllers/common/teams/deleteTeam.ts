import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Team } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function deleteTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { teamId },
  } = ctx;

  const team = await Team.findByPk(teamId);

  assertKoaError(!team, ctx, 404, 'Team not found');

  await checkAuthSubjectAppPermissions(ctx, team.AppId, [AppPermission.DeleteTeams]);

  await team.destroy();
}
