import { assertKoaCondition, serveIcon } from '@appsemble/node-utils';
import { isEqual, parseISO } from 'date-fns';
import { type Context } from 'koa';

import { Organization } from '../../../models/index.js';

export async function getOrganizationIcon(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    query: { background, maskable, raw, size = 128, updated },
  } = ctx;

  const organization = await Organization.findOne({
    where: { id: organizationId },
    attributes: ['icon', 'updated'],
    raw: true,
  });

  assertKoaCondition(organization != null, ctx, 404, 'Organization not found.');

  await serveIcon(ctx, {
    background: background as string,
    cache: isEqual(parseISO(updated as string), organization.updated),
    fallback: 'building-solid.png',
    height: size ? Number.parseInt(size as string) : undefined,
    icon: organization.icon,
    maskable: Boolean(maskable),
    raw: Boolean(raw),
    width: size ? Number.parseInt(size as string) : undefined,
  });
}
