import { logger } from '@appsemble/node-utils';
import { permissions } from '@appsemble/utils';
import Boom from '@hapi/boom';
import semver from 'semver';
import { DatabaseError, UniqueConstraintError } from 'sequelize';

import { BlockAsset, BlockVersion, getDB, transactional } from '../models';
import checkRole from '../utils/checkRole';

export async function getBlock(ctx) {
  const { blockId, organizationId } = ctx.params;

  const blockVersion = await BlockVersion.findOne({
    attributes: [
      'description',
      'version',
      'actions',
      'events',
      'layout',
      'parameters',
      'resources',
    ],
    raw: true,
    where: { name: blockId, OrganizationId: organizationId },
    order: [['created', 'DESC']],
  });

  if (!blockVersion) {
    throw Boom.notFound('Block definition not found');
  }

  const { actions, description, events, layout, parameters, resources, version } = blockVersion;

  ctx.body = {
    name: `@${organizationId}/${blockId}`,
    description,
    version,
    actions,
    events,
    layout,
    parameters,
    resources,
  };
}

export async function queryBlocks(ctx) {
  // Sequelize does not support subqueries
  // The alternative is to query everything and filter manually
  // See: https://github.com/sequelize/sequelize/issues/9509
  const [blockVersions] = await getDB().query(
    'SELECT "OrganizationId", name, description, version, actions, events, layout, parameters, resources FROM "BlockVersion" WHERE created IN (SELECT MAX(created) FROM "BlockVersion" GROUP BY "OrganizationId", name)',
  );

  ctx.body = blockVersions.map(
    ({
      OrganizationId,
      actions,
      description,
      events,
      layout,
      name,
      parameters,
      resources,
      version,
    }) => ({
      name: `@${OrganizationId}/${name}`,
      description,
      version,
      actions,
      events,
      layout,
      parameters,
      resources,
    }),
  );
}

export async function publishBlock(ctx) {
  const { files, ...data } = ctx.request.body;
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

  const blockVersion = await BlockVersion.findOne({
    where: { name: blockId, OrganizationId },
    order: [['created', 'DESC']],
    raw: true,
  });

  // If there is a previous version and it has a higher semver, throw an error.
  if (blockVersion && semver.gte(blockVersion.version, version)) {
    throw Boom.conflict(
      `Version ${blockVersion.version} is equal to or lower than the already existing ${name}@${version}.`,
    );
  }

  try {
    await transactional(async (transaction) => {
      const {
        actions = null,
        description = null,
        events,
        layout = null,
        parameters,
        resources = null,
      } = await BlockVersion.create({ ...data, name: blockId, OrganizationId }, { transaction });

      files.forEach((file) => {
        logger.verbose(
          `Creating block assets for ${name}@${version}: ${decodeURIComponent(file.basename)}`,
        );
      });
      await BlockAsset.bulkCreate(
        files.map((file) => ({
          name: blockId,
          OrganizationId,
          version,
          filename: decodeURIComponent(file.basename),
          mime: file.mime,
          content: file.contents,
        })),
        { logging: false, transaction },
      );

      ctx.body = {
        actions,
        layout,
        parameters,
        resources,
        events,
        version,
        files: files.map((file) => decodeURIComponent(file.basename)),
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

  const blockVersions = await BlockVersion.findAll({
    attributes: [
      'actions',
      'description',
      'events',
      'layout',
      'version',
      'resources',
      'parameters',
    ],
    raw: true,
    where: { name: blockId, OrganizationId: organizationId },
  });

  if (blockVersions.length === 0) {
    throw Boom.notFound('Block not found.');
  }

  ctx.body = blockVersions.map((blockVersion) => ({ name, ...blockVersion }));
}
