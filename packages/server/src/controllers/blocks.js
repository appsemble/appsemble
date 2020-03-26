import { logger } from '@appsemble/node-utils';
import { permissions } from '@appsemble/utils';
import Boom from '@hapi/boom';
import { isEmpty } from 'lodash';
import { DatabaseError, UniqueConstraintError } from 'sequelize';

import checkRole from '../utils/checkRole';

export async function createBlockDefinition(ctx) {
  const { BlockDefinition } = ctx.db.models;
  const { body } = ctx.request;
  const { description, id } = body;
  const blockDefinition = { description, id };
  const [organizationId] = id.split('/');

  await checkRole(ctx, organizationId.slice(1), permissions.PublishBlocks);

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
  const { blockId, organizationId } = ctx.params;
  const { BlockDefinition } = ctx.db.models;

  const blockDefinition = await BlockDefinition.findByPk(`@${organizationId}/${blockId}`, {
    raw: true,
  });

  if (!blockDefinition) {
    throw Boom.notFound('Block definition not found');
  }

  ctx.body = {
    id: blockDefinition.id,
    description: blockDefinition.description,
  };
}

export async function queryBlockDefinitions(ctx) {
  const { BlockDefinition } = ctx.db.models;

  const blockDefinitions = await BlockDefinition.findAll({ raw: true });

  ctx.body = blockDefinitions.map(({ description, id }) => ({ id, description }));
}

export async function createBlockVersion(ctx) {
  const { blockId, organizationId } = ctx.params;
  const { db } = ctx;
  const { BlockAsset, BlockDefinition, BlockVersion } = db.models;
  const name = `@${organizationId}/${blockId}`;
  const { data, ...files } = ctx.request.body;
  const actionKeyRegex = /^[a-z]\w*$/;

  if (data.actions) {
    Object.keys(data.actions).forEach(key => {
      if (!actionKeyRegex.test(key) && key !== '$any') {
        throw Boom.badRequest(`Action “${key}” does match /${actionKeyRegex.source}/`);
      }
    });
  }

  await checkRole(ctx, organizationId, permissions.PublishBlocks);

  if (isEmpty(files)) {
    throw Boom.badRequest('At least one file should be uploaded');
  }

  const blockDefinition = await BlockDefinition.findByPk(name, { raw: true });

  if (!blockDefinition) {
    throw Boom.notFound('Block definition not found');
  }

  try {
    await db.transaction(async transaction => {
      const {
        actions = null,
        events,
        layout = null,
        parameters,
        resources = null,
        version,
      } = await BlockVersion.create({ ...data, name }, { transaction });

      Object.keys(files).forEach(filename => {
        logger.verbose(`Creating block assets for ${name}@${data.version}: ${filename}`);
      });
      await BlockAsset.bulkCreate(
        Object.entries(files).map(([filename, file]) => ({
          name,
          version: data.version,
          filename,
          mime: file.mime,
          content: file.contents,
        })),
        { logging: false, transaction },
      );

      const fileKeys = Object.entries(files).map(([key]) => key);

      ctx.body = {
        actions,
        layout,
        parameters,
        resources,
        events,
        version,
        files: fileKeys,
        name,
      };
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError || err instanceof DatabaseError) {
      throw Boom.conflict(`Block version “${name}@${data.version}” already exists`);
    }
    throw err;
  }
}

export async function getBlockVersion(ctx) {
  const { blockId, blockVersion, organizationId } = ctx.params;
  const name = `@${organizationId}/${blockId}`;
  const { BlockAsset, BlockVersion } = ctx.db.models;

  const version = await BlockVersion.findOne({
    attributes: ['actions', 'events', 'layout', 'resources', 'parameters'],
    raw: true,
    where: { name, version: blockVersion },
  });

  if (!version) {
    throw Boom.notFound('Block version not found');
  }

  const files = await BlockAsset.findAll({
    attributes: ['filename'],
    raw: true,
    where: { name, version: blockVersion },
  });

  ctx.body = { files: files.map(f => f.filename), name, version: blockVersion, ...version };
}

export async function getBlockVersions(ctx) {
  const { blockId, organizationId } = ctx.params;
  const name = `@${organizationId}/${blockId}`;
  const { BlockDefinition, BlockVersion } = ctx.db.models;

  const blockDefinition = await BlockDefinition.findOne({ where: { id: name } });
  if (!blockDefinition) {
    throw Boom.notFound('Block definition not found');
  }

  const blockVersions = await BlockVersion.findAll({
    attributes: ['version', 'actions', 'layout', 'resources', 'events'],
    raw: true,
    where: { name },
  });

  ctx.body = blockVersions;
}
