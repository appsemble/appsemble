import { assertKoaCondition, uploadToBuffer } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { AppCollection, Organization } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import {
  handleAppCollectionDomainValidationError,
  normalizeDomain,
} from '../../../utils/domain.js';

export async function updateAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
    request: { body },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId, {
    include: [{ model: Organization, attributes: ['name'] }],
  });

  assertKoaCondition(collection != null, ctx, 404, 'Collection not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: collection.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppCollections],
  });

  try {
    const updatedCollection = await collection.update({
      name: body.name ?? undefined,
      expertName: body.expertName ?? undefined,
      expertDescription: body.expertDescription ?? undefined,
      expertProfileImage: body.expertProfileImage
        ? await uploadToBuffer(body.expertProfileImage.path)
        : undefined,
      expertProfileImageMimeType: body.expertProfileImage?.mime ?? undefined,
      headerImage: body.headerImage ? await uploadToBuffer(body.headerImage.path) : undefined,
      headerImageMimeType: body.headerImage?.mime ?? undefined,
      visibility: body.visibility ?? undefined,
      domain: body.domain === undefined ? undefined : normalizeDomain(body.domain),
    });

    ctx.response.status = 200;
    ctx.response.body = updatedCollection.toJSON();
  } catch (error: unknown) {
    handleAppCollectionDomainValidationError(ctx, error, normalizeDomain(body.domain));
  }
}
