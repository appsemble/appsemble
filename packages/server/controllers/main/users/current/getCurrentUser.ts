import { type Context } from 'koa';
import { literal } from 'sequelize';

import { EmailAuthorization, Organization, type User } from '../../../../models/index.js';

export async function getCurrentUser(ctx: Context): Promise<void> {
  const { user } = ctx;

  await (user as User).reload({
    include: [
      {
        model: Organization,
        attributes: {
          include: ['id', 'name', 'updated', [literal('icon IS NOT NULL'), 'hasIcon']],
          exclude: ['icon'],
        },
      },
      {
        model: EmailAuthorization,
      },
    ],
  });

  ctx.body = {
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    organizations: (user as User).Organizations.map((org: Organization) => ({
      id: org.id,
      name: org.name,
      iconUrl: org.get('hasIcon')
        ? `/api/organizations/${org.id}/icon?updated=${org.updated.toISOString()}`
        : null,
    })),
    emails: user.EmailAuthorizations.map(
      ({ email, verified }: { email: string; verified: boolean }) => ({
        email,
        verified,
        primary: user.primaryEmail === email,
      }),
    ),
    locale: user.locale,
    timezone: user.timezone,
    subscribed: user.subscribed,
  };
}
