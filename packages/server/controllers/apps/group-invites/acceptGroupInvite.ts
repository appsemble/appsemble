import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  Group,
  GroupInvite,
  GroupMember,
  transactional,
} from '../../../models/index.js';

export async function acceptAppGroupInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { code },
    },
    user: authSubject,
  } = ctx;

  const app = await App.findByPk(appId);

  assertKoaError(!app, ctx, 404, 'App not found');

  const groupInvite = await GroupInvite.findOne({ where: { key: code } });

  assertKoaError(!groupInvite, ctx, 404, `No invite found for code: ${code}`);

  const appMember = await AppMember.findByPk(authSubject.id);

  if (appMember) {
    await transactional((transaction) =>
      Promise.all([
        GroupMember.create(
          {
            AppMemberId: appMember.id,
            role: groupInvite.role,
            GroupId: groupInvite.GroupId,
          },
          { transaction },
        ),
        groupInvite.destroy({ transaction }),
      ]),
    );
  }

  const group = await Group.findByPk(groupInvite.GroupId);

  ctx.body = {
    id: group.id,
    name: group.name,
    role: groupInvite.role,
    annotations: group.annotations ?? {},
  };
}
