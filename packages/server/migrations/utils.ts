import { randomUUID } from 'node:crypto';

import { logger } from '@appsemble/node-utils';
import { Op, QueryTypes, type Sequelize } from 'sequelize';

import { App, AppMember, EmailAuthorization, User } from '../models/index.js';

export async function convertUserToAppMember(
  db: Sequelize,
  appId: number,
  userId: string,
): Promise<string> {
  if (!userId) {
    return;
  }

  const app = appId ? await App.findByPk(appId, { attributes: ['id', 'definition'] }) : null;

  if (!app) {
    return;
  }

  const user = await User.findByPk(userId, {
    attributes: ['name', 'primaryEmail', 'locale'],
    include: [{ model: EmailAuthorization }],
  });

  const appMember = await AppMember.findOne({
    where: { AppId: appId, [Op.or]: [{ UserId: userId }, { email: user.primaryEmail }] },
    attributes: ['id'],
  });

  let memberId = appMember ? appMember.id : null;

  // App needs to have a security definition to assign a role to an AppMember
  if (!app.definition.security) {
    app.definition.security = {
      default: {
        role: 'User',
        policy: 'everyone',
      },
      roles: {
        User: { description: 'Default User role created through migration.' },
      },
    };
  }

  if (!memberId) {
    logger.warn(`AppMember account not found for user ${userId}, creating new app account`);
    memberId = randomUUID();
    await db.query(
      `
        INSERT INTO "AppMember" (id, "UserId", "AppId", name, role, email, "emailVerified", locale, created, updated) \
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      {
        type: QueryTypes.INSERT,
        replacements: [
          memberId,
          userId,
          app.id,
          user?.name,
          app.definition.security?.default.role || 'User',
          user?.primaryEmail,
          user?.EmailAuthorizations?.[0]?.verified ?? false,
          user?.locale,
        ],
      },
    );
  }
  return memberId;
}
