import { type ExtendedGroup, type GetAppSubEntityParams } from '@appsemble/node-utils';

import { getAppDB } from '../models/index.js';

export async function getAppGroups({ app }: GetAppSubEntityParams): Promise<ExtendedGroup[]> {
  const { Group, GroupMember } = await getAppDB(app.id!);
  const groups = await Group.findAll({
    where: { demo: false },
    include: [{ model: GroupMember, required: false, as: 'Members' }],
    order: [['name', 'ASC']],
  });

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    size: group.Members.length,
    annotations: group.annotations ?? {},
  }));
}
