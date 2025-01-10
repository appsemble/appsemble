import { createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';

import { assertKoaError, streamToBuffer } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { AppCollection, Organization } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function updateAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
    request: { body },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId, {
    include: [{ model: Organization, attributes: ['name'] }],
  });

  assertKoaError(!collection, ctx, 404, 'Collection not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: collection.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppCollections],
  });

  const updatedCollection = await collection.update({
    name: body.name ?? undefined,
    expertName: body.expertName ?? undefined,
    expertDescription: body.expertDescription ?? undefined,
    expertProfileImage: body.expertProfileImage
      ? await streamToBuffer(createReadStream(body.expertProfileImage.path))
      : undefined,
    expertProfileImageMimeType: body.expertProfileImage?.mime ?? undefined,
    headerImage: body.headerImage
      ? await streamToBuffer(createReadStream(body.headerImage.path))
      : undefined,
    headerImageMimeType: body.headerImage?.mime ?? undefined,
    visibility: body.visibility ?? undefined,
    domain: body.domain ?? undefined,
  });

  if (body.expertProfileImage) {
    await unlink(body.expertProfileImage.path);
  }

  if (body.headerImage) {
    await unlink(body.headerImage.path);
  }

  ctx.response.status = 200;
  ctx.response.body = updatedCollection.toJSON();
}
