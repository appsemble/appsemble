import { assertKoaCondition, serveIcon } from '@appsemble/node-utils';
import { isEqual, parseISO } from 'date-fns';
import { type Context } from 'koa';

import { BlockVersion, Organization } from '../../../../models/index.js';

export async function getBlockVersionIcon(ctx: Context): Promise<void> {
  const {
    pathParams: { blockId, blockVersion, organizationId },
    query: { size, updated },
  } = ctx;

  const version = await BlockVersion.findOne({
    attributes: ['icon'],
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
    include: [{ model: Organization, attributes: ['icon', 'updated'] }],
  });

  assertKoaCondition(version != null, ctx, 404, 'Block version not found');

  const cache = version.icon
    ? true
    : isEqual(parseISO(updated as string), version.Organization.updated);

  return serveIcon(ctx, {
    cache,
    fallback: 'cubes-solid.png',
    height: size && Number.parseInt(size as string),
    icon: version.icon || version.Organization.icon,
    width: size && Number.parseInt(size as string),
  });
}
