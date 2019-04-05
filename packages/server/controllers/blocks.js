import Boom from 'boom';
import { isEmpty } from 'lodash';
import { UniqueConstraintError } from 'sequelize';

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
  const { organization, id } = ctx.params;
  const { BlockDefinition } = ctx.db.models;

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
  const { BlockDefinition } = ctx.db.models;

  const blockDefinitions = await BlockDefinition.findAll({ raw: true });

  ctx.body = blockDefinitions.map(({ id, description }) => ({ id, description }));
}

export async function createBlockVersion(ctx) {
  const { organization, id } = ctx.params;
  const { db } = ctx;
  const { BlockAsset, BlockDefinition, BlockVersion } = db.models;
  const name = `${organization}/${id}`;
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
        position = null,
        resources = null,
        version,
      } = await BlockVersion.create({ ...data, name }, { transaction });
      const fileKeys = await Promise.all(
        Object.entries(files).map(async ([key, file]) => {
          await BlockAsset.create(
            {
              name,
              version: data.version,
              filename: key,
              mime: file.mime,
              content: file.contents,
            },
            { transaction },
          );
          return key;
        }),
      );
      ctx.body = {
        actions,
        files: fileKeys,
        name,
        position,
        resources,
        version,
      };
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw Boom.conflict(`Block version “${name}@${data.version}” already exists`);
    }
    throw err;
  }
}

export async function getBlockVersion(ctx) {
  const { organization, id, version } = ctx.params;
  const name = `${organization}/${id}`;
  const { BlockAsset, BlockVersion } = ctx.db.models;

  const blockVersion = await BlockVersion.findOne({
    attributes: ['actions', 'position', 'resources'],
    raw: true,
    where: { name, version },
  });

  if (!blockVersion) {
    throw Boom.notFound('Block version not found');
  }

  const files = await BlockAsset.findAll({
    attributes: ['filename'],
    raw: true,
    where: { name, version },
  });

  ctx.body = { files: files.map(f => f.filename), name, version, ...blockVersion };
}

export async function getBlockVersions(ctx) {
  const { organization, id } = ctx.params;
  const name = `${organization}/${id}`;
  const { BlockDefinition, BlockVersion } = ctx.db.models;

  const blockDefinition = await BlockDefinition.findOne({ where: { id: name } });
  if (!blockDefinition) {
    throw Boom.notFound('Block definition not found');
  }

  const blockVersions = await BlockVersion.findAll({
    attributes: ['version', 'actions', 'position', 'resources'],
    raw: true,
    where: { name },
  });

  ctx.body = blockVersions;
}

export async function getBlockAsset(ctx) {
  const { organization, id, version, path } = ctx.params;
  const name = `${organization}/${id}`;
  const { BlockAsset } = ctx.db.models;
  const asset = await BlockAsset.findOne({
    where: { name, version, filename: path.join('/') },
  });
  if (asset == null) {
    ctx.throw(404);
    return;
  }
  ctx.type = asset.mime;
  ctx.body = asset.content;
}
