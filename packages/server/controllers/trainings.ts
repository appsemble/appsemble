import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Training } from '../models/Training.js';
import { TrainingBlock } from '../models/TrainingBlock.js';
import { User } from '../models/User.js';
import { UserTraining } from '../models/UserTraining.js';
import { checkRole } from '../utils/checkRole.js';

export async function getTrainings(ctx: Context): Promise<void> {
  const { user } = ctx;

  assertKoaError(!user, ctx, 401, 'User is not logged in');

  const trainings = await Training.findAll();

  ctx.status = 200;
  ctx.body = trainings.map((training) => training.toJSON());
}

export async function createTraining(ctx: Context): Promise<void> {
  const {
    request: {
      body: { competence, description, difficultyLevel, title },
    },
  } = ctx;

  await checkRole(ctx, 'appsemble', Permission.CreateApps);
  const training = await Training.create({
    title,
    description,
    competence,
    difficultyLevel,
  });
  ctx.status = 201;
  ctx.body = training.toJSON();
}

export async function patchTraining(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    request: {
      body: { competence, description, difficultyLevel, title },
    },
  } = ctx;

  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  await checkRole(ctx, 'appsemble', Permission.EditApps);
  const result: Partial<Training> = {};

  if (competence !== undefined) {
    result.competence = competence || null;
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
    competence: updated.competence,
    description: updated.description,
    difficultyLevel: updated.difficultyLevel,
    title: updated.title,
  };
}

export async function deleteTraining(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
  } = ctx;

  await checkRole(ctx, 'appsemble', Permission.DeleteApps);

  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  const trainingBlocks = await TrainingBlock.findAll({
    where: { TrainingId: trainingId },
  });

  trainingBlocks.map(async (trainingBlock) => {
    await trainingBlock.destroy();
  });
  await training.destroy();

  ctx.status = 204;
}

export async function getTrainingById(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    user,
  } = ctx;

  assertKoaError(!user, ctx, 401, 'User is not logged in');
  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  ctx.status = 200;
  ctx.body = training;
}

export async function getTrainingBlocksByTrainingId(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    user,
  } = ctx;
  assertKoaError(!user, ctx, 401, 'User is not logged in');

  const trainingBlocks = await TrainingBlock.findAll({
    where: {
      TrainingId: trainingId,
    },
  });
  ctx.status = 200;
  ctx.body = trainingBlocks;
}

export async function createTrainingBlock(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    request: {
      body: { documentationLink, exampleCode, externalResource, title, videoLink },
    },
  } = ctx;

  await checkRole(ctx, 'appsemble', Permission.CreateApps);

  const parentTraining = await Training.findByPk(trainingId);
  assertKoaError(!parentTraining, ctx, 404, 'Training not found');

  await TrainingBlock.create({
    TrainingId: trainingId,
    title,
    documentationLink,
    videoLink,
    exampleCode,
    externalResource,
  });
  ctx.status = 201;
}

export async function patchTrainingBlock(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingBlockId },
    request: {
      body: { documentationLink, exampleCode, externalResource, title, videoLink },
    },
  } = ctx;

  await checkRole(ctx, 'appsemble', Permission.EditApps);
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

export async function deleteTrainingBlock(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingBlockId },
  } = ctx;

  await checkRole(ctx, 'appsemble', Permission.DeleteApps);

  const trainingBlock = await TrainingBlock.findByPk(trainingBlockId);
  assertKoaError(!trainingBlock, ctx, 404, 'Training Block not found.');

  await trainingBlock.destroy();

  ctx.status = 204;
}

export async function enrollUserInTraining(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    user,
  } = ctx;

  assertKoaError(!user, ctx, 401, 'User is not logged in');

  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  const isEnrolled = await UserTraining.findOne({
    where: {
      UserId: user.id,
      TrainingId: trainingId,
    },
  });
  assertKoaError(isEnrolled != null, ctx, 400, 'User is already enrolled in this training');

  await UserTraining.create({
    UserId: user.id,
    TrainingId: trainingId,
    completed: false,
  });

  ctx.status = 201;
}

export async function isUserEnrolled(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    user,
  } = ctx;
  assertKoaError(!user, ctx, 401, 'User is not logged in');

  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  const isEnrolled = await UserTraining.findOne({
    where: {
      UserId: user.id,
      TrainingId: trainingId,
    },
  });

  if (!isEnrolled) {
    ctx.status = 200;
    ctx.body = {
      enrolled: false,
    };
    return;
  }
  ctx.status = 200;
  ctx.body = {
    enrolled: true,
    completed: isEnrolled.completed,
  };
}

export async function updateTrainingCompletionStatus(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    request: { body },
    user,
  } = ctx;
  assertKoaError(!user, ctx, 401, 'User is not logged in');

  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  const userTraining = await UserTraining.findOne({
    where: {
      UserId: user.id,
      TrainingId: trainingId,
    },
  });

  assertKoaError(!userTraining, ctx, 400, 'User is not enrolled in this training');

  await userTraining.update({
    completed: body.completed,
  });

  ctx.status = 200;
}

export async function getTrainedUsers(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    user,
  } = ctx;

  assertKoaError(!user, ctx, 401, 'User is not logged in');

  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  const enrolledUsers = await UserTraining.findAll({
    where: { TrainingId: trainingId, completed: true },
    include: User,
  });
  ctx.status = 200;
  ctx.body = enrolledUsers;
}
