import { type GetAppMembersParams } from '@appsemble/node-utils';
import { type AppMember as AppMemberInterface } from '@appsemble/types';

import { AppMember } from '../models/index.js';

export async function getAppMembers({
  app,
  userId,
}: GetAppMembersParams): Promise<AppMemberInterface[]> {
  const appMembers = await AppMember.findAll({
    where: {
      UserId: userId,
      AppId: app.id,
    },
    attributes: {
      exclude: ['picture'],
    },
  });

  return appMembers.map((member) => ({
    userId: member.UserId,
    memberId: member.id,
    name: member.name,
    primaryEmail: member.email,
    role: member.role,
    demo: app.demoMode,
    properties: member.properties,
  }));
}
