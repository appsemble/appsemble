import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { Training } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function patchTraining(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    request: {
      body: { competences, description, difficultyLevel, title },
    },
  } = ctx;

  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: 'appsemble',
    requiredPermissions: [OrganizationPermission.UpdateTrainings],
  });
  const result: Partial<Training> = {};

  if (competences !== undefined) {
    result.competences = JSON.parse(competences) || [];
  }

  if (description !== undefined) {
    result.description = description || null;
  }

  if (difficultyLevel !== undefined) {
    result.difficultyLevel = difficultyLevel || null;
  }

  if (title !== undefined) {
    result.title = title || null;
  }

  const updated = await training.update(result);
  ctx.body = {
    id: trainingId,
    competences: updated.competences,
    description: updated.description,
    difficultyLevel: updated.difficultyLevel,
    title: updated.title,
  };
}
