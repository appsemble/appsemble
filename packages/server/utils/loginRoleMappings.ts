import { type AppRole } from '@appsemble/lang-sdk';
import { type AppLoginRoleMapping } from '@appsemble/types';
import { Op } from 'sequelize';
import { type Repository } from 'sequelize-typescript';

import { type AppMember, type AppMemberAssignedRole } from '../models/index.js';

export interface ResolvedLoginRoleMapping {
  externalGroup: string;
  role: AppRole;
}

export function hasLoginRoleMappings(
  roleMappings?: AppLoginRoleMapping[] | null,
): roleMappings is AppLoginRoleMapping[] {
  return Boolean(roleMappings?.length);
}

export function normalizeLoginGroups(
  groups: null | readonly string[] | string | undefined,
): string[] {
  const values = Array.isArray(groups) ? groups : groups ? [groups] : [];

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function normalizeLoginRoleMappings(
  roleMappings?: AppLoginRoleMapping[] | null,
): AppLoginRoleMapping[] | undefined {
  if (!roleMappings?.length) {
    return undefined;
  }

  const seenMappings = new Set<string>();
  const normalizedRoleMappings: AppLoginRoleMapping[] = [];

  for (const { group, role } of roleMappings) {
    const normalizedGroup = group.trim();
    const key = `${normalizedGroup}\u0000${role}`;

    if (seenMappings.has(key)) {
      continue;
    }

    seenMappings.add(key);
    normalizedRoleMappings.push({ group: normalizedGroup, role });
  }

  return normalizedRoleMappings;
}

export function resolveLoginRoleMappings(
  groups: null | readonly string[] | string | undefined,
  roleMappings?: AppLoginRoleMapping[] | null,
): ResolvedLoginRoleMapping[] {
  if (!roleMappings?.length) {
    return [];
  }

  const normalizedGroups = new Set(normalizeLoginGroups(groups));
  const seenRoles = new Set<AppRole>();
  const resolvedMappings: ResolvedLoginRoleMapping[] = [];

  for (const { group, role } of roleMappings) {
    if (!normalizedGroups.has(group) || seenRoles.has(role)) {
      continue;
    }

    seenRoles.add(role);
    resolvedMappings.push({ externalGroup: group, role });
  }

  return resolvedMappings;
}

export function validateLoginRoleMappings(
  roleMappings: unknown,
  validRoles: readonly AppRole[],
): string | null {
  if (roleMappings == null) {
    return null;
  }

  if (!Array.isArray(roleMappings)) {
    return 'Role mappings must be an array';
  }

  const validRoleSet = new Set(validRoles);

  for (const [index, roleMapping] of roleMappings.entries()) {
    if (!roleMapping || typeof roleMapping !== 'object' || Array.isArray(roleMapping)) {
      return `Role mapping ${index + 1} must be an object`;
    }

    const { group, role } = roleMapping as { group?: unknown; role?: unknown };

    if (typeof group !== 'string' || !group.trim()) {
      return `Role mapping ${index + 1} must define a non-empty group`;
    }

    if (typeof role !== 'string' || !validRoleSet.has(role as AppRole)) {
      return `Role mapping ${index + 1} has unknown role '${String(role)}'`;
    }
  }

  return null;
}

export async function syncLoginRoleMappings(
  appMemberAssignedRoleModel: Repository<AppMemberAssignedRole>,
  appMember: AppMember,
  resolvedMappings: ResolvedLoginRoleMapping[],
): Promise<void> {
  const preservedRoles = new Set(
    (
      await appMemberAssignedRoleModel.findAll({
        attributes: ['role'],
        where: {
          AppMemberId: appMember.id,
          source: {
            [Op.ne]: 'group-sync',
          },
        },
      })
    ).map(({ role }) => role),
  );

  await appMemberAssignedRoleModel.destroy({
    where: {
      AppMemberId: appMember.id,
      source: 'group-sync',
    },
  });

  const rows = resolvedMappings
    .filter(({ role }) => !preservedRoles.has(role))
    .map(({ externalGroup, role }) => ({
      AppMemberId: appMember.id,
      externalGroup,
      role,
      source: 'group-sync',
    }));

  if (rows.length) {
    await appMemberAssignedRoleModel.bulkCreate(rows);
  }

  await appMember.reload();
}
