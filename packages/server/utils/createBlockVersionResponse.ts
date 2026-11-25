import { type BlockManifest } from '@appsemble/types';
import { type Context } from 'koa';

import { getOrganizationMemberAccess } from './organizationSso.js';
import { type BlockVersion } from '../models/index.js';

export interface ExtendedBlockVersion extends BlockVersion {
  hasIcon?: boolean;
  hasOrganizationIcon?: boolean;
  organizationUpdated?: Date;
}

export async function createBlockVersionResponse(
  ctx: Context,
  blockVersions: ExtendedBlockVersion[],
  mapper: (blockVersion: ExtendedBlockVersion) => Omit<BlockManifest, 'files' | 'languages'>,
): Promise<Omit<BlockManifest, 'files' | 'languages'>[]> {
  const memberships = await Promise.all(
    [
      ...new Set(
        blockVersions
          .filter(({ visibility }) => visibility !== 'public')
          .map(({ OrganizationId }) => OrganizationId),
      ),
    ].map((organizationId) => getOrganizationMemberAccess(ctx, organizationId)),
  );
  const organizationIds = new Set(
    memberships.flatMap((member) => (member ? [member.OrganizationId] : [])),
  );

  return blockVersions
    .filter(
      (blockVersion) =>
        blockVersion.visibility === 'public' || organizationIds.has(blockVersion.OrganizationId),
    )
    .map(mapper);
}
