import { App } from '../models/App.js';
import { AppMember, EmailAuthorization, User } from '../models/index.js';

export async function getUserAppAccount(appId: number, userId: string): Promise<AppMember> {
  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [{ model: AppMember }],
  });

  const user = await User.findByPk(userId, {
    attributes: ['id', 'name', 'primaryEmail', 'locale'],
    include: [{ model: EmailAuthorization }],
  });

  if (!app || !user) {
    return;
  }

  const appMember =
    app.AppMembers.find((m) => m.UserId === user.id) ??
    (await AppMember.create({
      UserId: user.id,
      AppId: appId,
      role: app.definition.security?.default?.role ?? 'User',
      email: user.primaryEmail,
      name: user.name,
      locale: user.locale,
      emailVerified: user.EmailAuthorizations?.[0]?.verified ?? false,
    }));

  return appMember;
}
