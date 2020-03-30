import { logger } from '@appsemble/node-utils';
import { permissions } from '@appsemble/utils';
import Boom from '@hapi/boom';
import { isEmpty } from 'lodash';
import semver from 'semver';
import { DatabaseError, UniqueConstraintError } from 'sequelize';

import checkRole from '../utils/checkRole';

export async function getBlock(ctx) {
  const { blockId, organizationId } = ctx.params;
  const { BlockVersion } = ctx.db.models;

  const blockDefinition = await BlockVersion.findOne({
    attributes: ['description', 'version'],
    raw: true,
    where: { name: blockId, OrganizationId: organizationId },
    order: [['created', 'DESC']],
  });

  if (!blockDefinition) {
    throw Boom.notFound('Block definition not found');
  }

  ctx.body = {
    name: `@${organizationId}/${blockId}`,
    description: blockDefinition.description,
    version: blockDefinition.version,
  };
}

export async function queryBlocks(ctx) {
  const { db } = ctx;

  // Sequelize does not support subqueries
  // The alternative is to query everything and filter manually
  // See: https://github.com/sequelize/sequelize/issues/9509
  const [blockDefinitions] = await db.query(
    'SELECT "OrganizationId", name, description, version FROM "BlockVersion" WHERE created IN (SELECT MAX(created) FROM "BlockVersion" GROUP BY "OrganizationId", name)',
  );

  ctx.body = blockDefinitions.map(({ OrganizationId, description, name, version }) => ({
    name: `@${OrganizationId}/${name}`,
    description,
    version,
  }));
}

export async function publishBlock(ctx) {
  const { db } = ctx;
  const { BlockAsset, BlockVersion } = db.models;
  const { data, ...files } = ctx.request.body;
  const { name, version } = data;
  const actionKeyRegex = /^[a-z]\w*$/;

  const [org, blockId] = name.split('/');
  const OrganizationId = org.slice(1);

  if (data.actions) {
    Object.keys(data.actions).forEach((key) => {
      if (!actionKeyRegex.test(key) && key !== '$any') {
        throw Boom.badRequest(`Action “${key}” does match /${actionKeyRegex.source}/`);
      }
    });
  }

  await checkRole(ctx, OrganizationId, permissions.PublishBlocks);

  if (isEmpty(files)) {
    throw Boom.badRequest('At least one file should be uploaded');
  }

  const blockDefinition = await BlockVersion.findOne({
    where: { name: blockId, OrganizationId },
    order: [['created', 'DESC']],
    raw: true,
  });

  // If there is a previous version and it has a higher semver, throw an error.
  if (blockDefinition && semver.gte(blockDefinition.version, version)) {
    throw Boom.badRequest(
      `Version semver (${version}) is equal to or lower than the current version of ${blockDefinition.version}.`,
    );
  }

  try {
    await db.transaction(async (transaction) => {
      const {
        actions = null,
        description = null,
        events,
        layout = null,
        parameters,
        resources = null,
      } = await BlockVersion.create({ ...data, name: blockId, OrganizationId }, { transaction });

      Object.keys(files).forEach((filename) => {
        logger.verbose(`Creating block assets for ${name}@${version}: ${filename}`);
      });
      await BlockAsset.bulkCreate(
        Object.entries(files).map(([filename, file]) => ({
          name: blockId,
          OrganizationId,
          version,
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
        description,
      };
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError || err instanceof DatabaseError) {
      throw Boom.conflict(`Block “${name}@${data.version}” already exists`);
    }
    throw err;
  }
}

export async function getBlockVersion(ctx) {
  const { blockId, blockVersion, organizationId } = ctx.params;
  const name = `@${organizationId}/${blockId}`;
  const { BlockAsset, BlockVersion } = ctx.db.models;

  const version = await BlockVersion.findOne({
    attributes: ['actions', 'events', 'layout', 'resources', 'parameters', 'description'],
    raw: true,
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
  });

  if (!version) {
    throw Boom.notFound('Block version not found');
  }

  const files = await BlockAsset.findAll({
    attributes: ['filename'],
    raw: true,
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
  });

  ctx.body = {
    files: files.map((f) => f.filename),
    name,
    version: blockVersion,
    ...version,
  };
}

export async function getBlockVersions(ctx) {
  const { blockId, organizationId } = ctx.params;
  const name = `@${organizationId}/${blockId}`;
  const { BlockVersion } = ctx.db.models;

  const blockVersions = await BlockVersion.findAll({
    attributes: ['version', 'actions', 'layout', 'resources', 'events', 'description'],
    raw: true,
    where: { name: blockId, OrganizationId: organizationId },
  });

  if (blockVersions.length === 0) {
    throw Boom.notFound('Block not found.');
  }

  ctx.body = blockVersions.map((blockVersion) => ({ name, ...blockVersion }));
}
