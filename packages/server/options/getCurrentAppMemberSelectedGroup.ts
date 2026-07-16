import { type AppMemberGroup } from '@appsemble/lang-sdk';
import {
  type GetCurrentAppMemberSelectedGroupParams,
  getSingleGroupId,
} from '@appsemble/node-utils';

import { getAppDB } from '../models/index.js';

export async function getCurrentAppMemberSelectedGroup({
  app,
  context: { queryParams, user: authSubject },
}: GetCurrentAppMemberSelectedGroupParams): Promise<AppMemberGroup | null> {
  const { selectedGroupId } = queryParams ?? {};
  if (!authSubject) {
    return null;
  }

  const groupId = getSingleGroupId(selectedGroupId);
  if (groupId == null) {
    return null;
  }
  const { Group, GroupMember } = await getAppDB(app.id!);
  const group = await Group.findByPk(groupId, {
    include: [
      {
        model: GroupMember,
        where: { AppMemberId: authSubject!.id },
        required: true,
        as: 'Members',
      },
    ],
  });
  if (!group) {
    return null;
  }
  return { name: group!.name, id: group!.id, role: group!.Members[0].role };
}
