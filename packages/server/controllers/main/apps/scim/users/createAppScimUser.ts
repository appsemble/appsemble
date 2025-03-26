import { assertKoaCondition, scimAssert } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember, Group, GroupMember, transactional } from '../../../../../models/index.js';
import { getCaseInsensitive } from '../../../../../utils/object.js';
import { convertAppMemberToScimUser } from '../../../../../utils/scim.js';

export async function createAppScimUser(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const externalId = getCaseInsensitive(body, 'externalid');
  scimAssert(typeof externalId === 'string', ctx, 400, 'Expected externalId to be string');

  const userName = getCaseInsensitive(body, 'username');
  scimAssert(typeof userName === 'string', ctx, 400, 'Expected userName to be string');

  const active = getCaseInsensitive(body, 'active');
  scimAssert(typeof active === 'boolean', ctx, 400, 'Expected active to be boolean');

  const name = getCaseInsensitive(body, 'name');
  scimAssert(name == null || typeof name === 'object', ctx, 400, 'Expected name to be an object');

  const formattedName = name && getCaseInsensitive(name, 'formatted');
  scimAssert(
    formattedName == null || typeof formattedName === 'string',
    ctx,
    400,
    'Expected name.formatted to be a string',
  );

  const locale = getCaseInsensitive(body, 'locale') || 'en';
  scimAssert(typeof locale === 'string', ctx, 400, 'Expected locale to be a string');

  const timezone = getCaseInsensitive(body, 'timezone') || 'Europe/Amsterdam';
  scimAssert(typeof timezone === 'string', ctx, 400, 'Expected locale to be a string');

  const enterpriseUser =
    getCaseInsensitive(body, 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user') || {};
  scimAssert(
    enterpriseUser == null || typeof enterpriseUser === 'object',
    ctx,
    400,
    'Expected urn:ietf:params:scim:schemas:extension:enterprise:2.0:User to be an object',
  );

  const managerId = enterpriseUser && getCaseInsensitive(enterpriseUser, 'manager');
  scimAssert(
    managerId == null || typeof managerId === 'string',
    ctx,
    400,
    'Expected manager to be a string',
  );

  let group: Group | null;
  if (managerId) {
    group = await Group.findOne({ where: { AppId: appId, name: managerId } });
  }
  const managerGroup = await Group.findOne({ where: { AppId: appId, name: externalId } });
  const defaultRole = (await App.findByPk(appId, { attributes: ['definition'] }))?.definition
    .security?.default?.role;

  assertKoaCondition(
    defaultRole != null,
    ctx,
    400,
    'App does not have a security definition in place to handle SCIM users. See SCIM documentation for more info.',
  );
  try {
    let member: AppMember | undefined;
    await transactional(async (transaction) => {
      member = await AppMember.create(
        {
          AppId: appId,
          role: defaultRole,
          email: userName,
          name: formattedName,
          scimExternalId: externalId,
          timezone,
          scimActive: active,
          locale,
          emailVerified: true,
        },
        { transaction },
      );

      if (managerId) {
        if (!group) {
          group = await Group.create({ AppId: appId, name: managerId }, { transaction });
          const groupManager = await AppMember.findOne({
            where: { AppId: appId, scimExternalId: group.name },
          });

          if (groupManager) {
            await GroupMember.create(
              {
                GroupId: group.id,
                AppMemberId: groupManager.id,
                role: 'manager',
              },
              { transaction },
            );
          }
        }
        const groupMember = await GroupMember.create(
          {
            GroupId: group.id,
            AppMemberId: member.id,
            role: 'member',
          },
          { transaction },
        );
        groupMember.Group = group;
        member.GroupMembers = [groupMember];
      }

      if (managerGroup) {
        await GroupMember.create(
          {
            GroupId: managerGroup.id,
            AppMemberId: member.id,
            role: 'manager',
          },
          { transaction },
        );
      }
    });
    ctx.body = convertAppMemberToScimUser(member!);
  } catch {
    scimAssert(false, ctx, 409, 'Conflict');
  }
}
