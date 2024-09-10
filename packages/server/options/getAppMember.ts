import { type GetAppMemberParams } from '@appsemble/node-utils';
import { type AppMember as AppMemberInterface } from '@appsemble/types';

import { AppMember } from '../models/index.js';

export async function getAppMember({ id }: GetAppMemberParams): Promise<AppMemberInterface | null> {
  const member = await AppMember.findByPk(id, {
    attributes: {
      exclude: ['picture'],
    },
  });

  if (!member) {
    return null;
  }

  return {
    id: member.id,
    name: member.name,
    primaryEmail: member.email,
    emailVerified: member.emailVerified,
    role: member.role,
    demo: member.demo,
    timezone: member.timezone,
    properties: member.properties,
  };
}
