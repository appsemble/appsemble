import { type ExtendedGroup, type GetAppGroupsParams } from '@appsemble/node-utils';

import { Group, GroupMember } from '../models/index.js';

export async function getAppGroups({ app }: GetAppGroupsParams): Promise<ExtendedGroup[]> {
  const groups = await Group.findAll({
    where: { AppId: app.id },
    include: [{ model: GroupMember, required: false }],
    order: [['name', 'ASC']],
  });

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    size: group.Members.length,
    annotations: group.annotations ?? {},
  }));
}
