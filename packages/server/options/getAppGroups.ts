import { type ExtendedGroup, type GetAppSubEntityParams } from '@appsemble/node-utils';

import { Group, GroupMember } from '../models/index.js';

export async function getAppGroups({ app }: GetAppSubEntityParams): Promise<ExtendedGroup[]> {
  const groups = await Group.findAll({
    where: { AppId: app.id, demo: false },
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
