import Boom from 'boom';
import { UniqueConstraintError } from 'sequelize';

export async function createBlockDefinition(ctx) {
  const { BlockDefinition } = ctx.state.db;
  const { body } = ctx.request;
  const { id, description } = body;
  const blockDefinition = { description, id };

  try {
    await BlockDefinition.create(blockDefinition, { raw: true });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw Boom.conflict(`Another block definition with id “${id}” already exists`);
    }
    throw error;
  }

  ctx.body = blockDefinition;
}

export async function getBlockDefinition(ctx) {
  const { organization, id } = ctx.params;
  const { BlockDefinition } = ctx.state.db;

  const blockDefinition = await BlockDefinition.findByPk(`${organization}/${id}`, { raw: true });

  if (!blockDefinition) {
    throw Boom.notFound('Block definition not found');
  }

  ctx.body = {
    id: blockDefinition.id,
    description: blockDefinition.description,
  };
}

export async function queryBlockDefinitions(ctx) {
  const { BlockDefinition } = ctx.state.db;

  const blockDefinitions = await BlockDefinition.findAll({ raw: true });

  ctx.body = blockDefinitions.map(({ id, description }) => ({ id, description }));
}
