import { logger } from '@appsemble/node-utils';
import Boom from '@hapi/boom';
import { isEmpty } from 'lodash';
import { DatabaseError, UniqueConstraintError } from 'sequelize';

export async function createBlockDefinition(ctx) {
  const { BlockDefinition } = ctx.db.models;
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
  const { organizationId, blockId } = ctx.params;
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

  ctx.body = blockDefinitions.map(({ id, description }) => ({ id, description }));
}

export async function createBlockVersion(ctx) {
  const { organizationId, blockId } = ctx.params;
  const { db } = ctx;
  const { BlockAsset, BlockDefinition, BlockVersion } = db.models;
  const name = `@${organizationId}/${blockId}`;
  const { data, ...files } = ctx.request.body;

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
  const { organizationId, blockId, blockVersion } = ctx.params;
  const name = `@${organizationId}/${blockId}`;
  const { BlockAsset, BlockVersion } = ctx.db.models;

  const version = await BlockVersion.findOne({
    attributes: ['actions', 'layout', 'resources', 'parameters'],
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
  const { organizationId, blockId } = ctx.params;
  const name = `@${organizationId}/${blockId}`;
  const { BlockDefinition, BlockVersion } = ctx.db.models;

  const blockDefinition = await BlockDefinition.findOne({ where: { id: name } });
  if (!blockDefinition) {
    throw Boom.notFound('Block definition not found');
  }

  const blockVersions = await BlockVersion.findAll({
    attributes: ['version', 'actions', 'layout', 'resources'],
    raw: true,
    where: { name },
  });

  ctx.body = blockVersions;
}

export async function getBlockAsset(ctx) {
  const { organizationId, blockId, blockVersion, path } = ctx.params;
  const name = `@${organizationId}/${blockId}`;
  const { BlockAsset } = ctx.db.models;
  const asset = await BlockAsset.findOne({
    where: { name, version: blockVersion, filename: path.join('/') },
  });
  if (asset == null) {
    ctx.throw(404);
    return;
  }
  ctx.type = asset.mime;
  ctx.body = asset.content;
}
