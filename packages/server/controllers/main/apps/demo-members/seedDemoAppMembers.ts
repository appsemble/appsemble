import { type AppDefinition, type AppRole } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import {
  getAppMemberInfo,
  normalizeAppMemberRoles,
  parseAppMemberProperties,
} from '../../../../utils/appMember.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

interface SeedAppMember {
  name: string;
  roles: AppRole[];
  properties?: Record<string, any>;
  timezone: string;
}

function validateAppMemberRoles(
  ctx: Context,
  definition: AppDefinition,
  appMembers: SeedAppMember[],
): SeedAppMember[] {
  const supportedRoles = new Set(Object.keys(definition.security?.roles ?? {}));

  return (appMembers ?? []).map((member) => {
    const roles = normalizeAppMemberRoles(member.roles);

    assertKoaCondition(
      roles.length > 0,
      ctx,
      400,
      'Each demo app member must have at least one role',
    );
    assertKoaCondition(
      roles.every((role) => supportedRoles.has(role)),
      ctx,
      400,
      'Role not allowed',
    );

    return {
      ...member,
      roles,
    };
  });
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

  const { AppMember } = await getAppDB(appId);
  const validatedMembers = validateAppMemberRoles(ctx, app.definition, body);
  const createdMembers = await AppMember.bulkCreate(
    validatedMembers.map(({ name, properties, roles, timezone }) => ({
      email: `demo-${Math.random().toString(36).slice(2)}@example.com`,
      roles,
      emailVerified: true,
      name: `${name} ${roles.join(', ')}`,
      locale: app.definition.defaultLanguage || defaultLocale,
      demo: true,
      timezone,
      seed: true,
      ephemeral: false,
      properties: parseAppMemberProperties(properties ?? {}),
    })),
  );

  const createdEphemeralMembers = await AppMember.bulkCreate(
    createdMembers.map(({ email, locale, name, properties, roles, timezone }) => ({
      email,
      locale,
      name,
      roles,
      demo: true,
      seed: false,
      ephemeral: true,
      timezone,
      emailVerified: true,
      properties: parseAppMemberProperties(properties ?? {}),
    })),
  );

  ctx.body = createdEphemeralMembers.map((member) => getAppMemberInfo(appId, member));
}
