import { type AppDefinition } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type AppMemberInfo, OrganizationPermission } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember } from '../../../../models/index.js';
import { getAppMemberInfo, parseAppMemberProperties } from '../../../../utils/appMember.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

type AppMemberInfoWithoutId = Omit<AppMemberInfo, 'demo' | 'sub'>;

function validateAppMemberRoles(
  definition: AppDefinition,
  appMembers: (AppMemberInfoWithoutId & { timezone: string })[],
): AppMemberInfoWithoutId[] {
  const roles = Object.keys(definition.security?.roles ?? {});
  return (appMembers ?? [])
    .filter((member) => !(member.role in roles) && member.role !== 'cron')
    .map((member) => ({ ...member, zoneinfo: member.timezone }));
}

export async function seedDemoAppMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'demoMode', 'OrganizationId'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  assertKoaCondition(app.demoMode, ctx, 403, 'App should be in demo mode');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateAppInvites],
  });

  const filteredMembers = validateAppMemberRoles(app.definition, body);
  const createdMembers = await AppMember.bulkCreate(
    filteredMembers.map(({ name, properties, role, zoneinfo: timezone }) => ({
      AppId: appId,
      email: `demo-${Math.random().toString(36).slice(2)}@example.com`,
      role,
      emailVerified: true,
      name: `${name} ${role}`,
      locale: app.definition.defaultLanguage || defaultLocale,
      demo: true,
      timezone,
      seed: true,
      ephemeral: false,
      properties: parseAppMemberProperties(properties ?? {}),
    })),
  );

  const createdEphemeralMembers = await AppMember.bulkCreate(
    createdMembers.map(({ email, locale, name, properties, role, timezone }) => ({
      AppId: appId,
      email,
      locale,
      name,
      role,
      demo: true,
      seed: false,
      ephemeral: true,
      timezone,
      emailVerified: true,
      properties: parseAppMemberProperties(properties ?? {}),
    })),
  );
  ctx.body = createdEphemeralMembers.map((member) => getAppMemberInfo(member));
}
