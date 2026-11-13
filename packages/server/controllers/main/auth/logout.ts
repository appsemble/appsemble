import { type Context } from 'koa';

import { OrganizationSsoIdentity, OrganizationSsoSession } from '../../../models/index.js';

export async function logout(ctx: Context): Promise<void> {
  if (ctx.state.organizationSsoSessionId) {
    const session = await OrganizationSsoSession.findOne({
      where: { id: ctx.state.organizationSsoSessionId },
      include: [{ model: OrganizationSsoIdentity, where: { UserId: ctx.user!.id } }],
    });
    await session?.update({ interactiveRevoked: true });
  }
  ctx.status = 204;
}
