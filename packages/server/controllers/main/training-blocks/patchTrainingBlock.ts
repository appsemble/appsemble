import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { TrainingBlock } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function patchTrainingBlock(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingBlockId },
    request: {
      body: { documentationLink, exampleCode, externalResource, title, videoLink },
    },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: 'appsemble',
    requiredPermissions: [OrganizationPermission.UpdateTrainingBlocks],
  });
  const trainingBlock = await TrainingBlock.findByPk(trainingBlockId);

  assertKoaError(!trainingBlock, ctx, 404, 'Training Block not found.');

  const result: Partial<TrainingBlock> = {};
  if (documentationLink !== undefined) {
    result.documentationLink = documentationLink || null;
  }

  if (videoLink !== undefined) {
    result.videoLink = videoLink || null;
  }

  if (exampleCode !== undefined) {
    result.exampleCode = exampleCode || null;
  }

  if (externalResource !== undefined) {
    result.externalResource = externalResource || null;
  }

  if (title !== undefined) {
    result.title = title || null;
  }

  const updated = await trainingBlock.update(result);

  ctx.body = {
    id: trainingBlockId,
    documentationLink: updated.documentationLink,
    videoLink: updated.videoLink,
    exampleCode: updated.exampleCode,
    title: updated.videoLink,
    externalResource: updated.externalResource,
  };
}
