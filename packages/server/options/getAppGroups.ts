import { type ExtendedGroup, type GetAppGroupsParams } from '@appsemble/node-utils';

import { AppMember, Group, GroupMember } from '../models/index.js';

export async function getAppGroups({ app, id }: GetAppGroupsParams): Promise<ExtendedGroup[]> {
  const groups = await Group.findAll({
    where: {
      AppId: app.id,
    },
    include: [{ model: GroupMember, include: [{ model: AppMember }], required: false }],
    order: [['name', 'ASC']],
  });

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    size: group.Members.length,
    role: group.Members.find((m) => m.AppMember.id === id)?.role,
    annotations: group.annotations ?? {},
  }));
}
