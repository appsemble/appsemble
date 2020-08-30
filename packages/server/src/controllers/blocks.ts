import { logger } from '@appsemble/node-utils';
import type { BlockManifest } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import { badRequest, conflict, notFound } from '@hapi/boom';
import * as fileType from 'file-type';
import isSvg from 'is-svg';
import type { File } from 'koas-body-parser/lib';
import semver from 'semver';
import { DatabaseError, UniqueConstraintError } from 'sequelize';

import { BlockAsset, BlockVersion, getDB, transactional } from '../models';
import type { KoaContext } from '../types';
import { checkRole } from '../utils/checkRole';
import { readAsset } from '../utils/readAsset';

interface Params {
  blockId: string;
  blockVersion: string;
  organizationId: string;
}

export async function getBlock(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { blockId, organizationId },
  } = ctx;

  const blockVersion = await BlockVersion.findOne({
    attributes: [
      'description',
      'longDescription',
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
    throw notFound('Block definition not found');
  }

  const {
    actions,
    description,
    events,
    layout,
    longDescription,
    parameters,
    resources,
    version,
  } = blockVersion;
  const name = `@${organizationId}/${blockId}`;

  ctx.body = {
    name,
    description,
    longDescription,
    version,
    actions,
    events,
    iconUrl: `/api/blocks/${name}/versions/${version}/icon`,
    layout,
    parameters,
    resources,
  };
}

export async function queryBlocks(ctx: KoaContext<Params>): Promise<void> {
  // Sequelize does not support subqueries
  // The alternative is to query everything and filter manually
  // See: https://github.com/sequelize/sequelize/issues/9509
  const [blockVersions] = await getDB().query(
    'SELECT "OrganizationId", name, description, "longDescription", version, actions, events, layout, parameters, resources FROM "BlockVersion" WHERE created IN (SELECT MAX(created) FROM "BlockVersion" GROUP BY "OrganizationId", name)',
  );

  ctx.body = blockVersions.map(
    ({
      OrganizationId,
      actions,
      description,
      events,
      layout,
      longDescription,
      name,
      parameters,
      resources,
      version,
    }) => ({
      name: `@${OrganizationId}/${name}`,
      description,
      longDescription,
      version,
      actions,
      events,
      iconUrl: `/api/blocks/@${OrganizationId}/${name}/versions/${version}/icon`,
      layout,
      parameters,
      resources,
    }),
  );
}

interface PublishBlockBody extends Omit<BlockManifest, 'files'> {
  files: File[];
  icon: File;
}

export async function publishBlock(ctx: KoaContext<Params>): Promise<void> {
  const { files, icon, ...data }: PublishBlockBody = ctx.request.body;
  const { name, version } = data;
  const actionKeyRegex = /^[a-z]\w*$/;

  const [org, blockId] = name.split('/');
  const OrganizationId = org.slice(1);

  if (data.actions) {
    Object.keys(data.actions).forEach((key) => {
      if (!actionKeyRegex.test(key) && key !== '$any') {
        throw badRequest(`Action “${key}” does match /${actionKeyRegex.source}/`);
      }
    });
  }

  await checkRole(ctx, OrganizationId, Permission.PublishBlocks);

  const blockVersion = await BlockVersion.findOne({
    where: { name: blockId, OrganizationId },
    order: [['created', 'DESC']],
    raw: true,
  });

  // If there is a previous version and it has a higher semver, throw an error.
  if (blockVersion && semver.gte(blockVersion.version, version)) {
    throw conflict(
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
        longDescription = null,
        parameters,
        resources = null,
      } = await BlockVersion.create(
        { ...data, icon: icon?.contents, name: blockId, OrganizationId },
        { transaction },
      );

      files.forEach((file) => {
        logger.verbose(
          `Creating block assets for ${name}@${version}: ${decodeURIComponent(file.filename)}`,
        );
      });
      await BlockAsset.bulkCreate(
        files.map((file) => ({
          name: blockId,
          OrganizationId,
          version,
          filename: decodeURIComponent(file.filename),
          mime: file.mime,
          content: file.contents,
        })),
        { logging: false, transaction },
      );

      ctx.body = {
        actions,
        iconUrl: `/api/blocks/${name}/versions/${version}/icon`,
        layout,
        parameters,
        resources,
        events,
        version,
        files: files.map((file) => decodeURIComponent(file.filename)),
        name,
        description,
        longDescription,
      };
    });
  } catch (err: unknown) {
    if (err instanceof UniqueConstraintError || err instanceof DatabaseError) {
      throw conflict(`Block “${name}@${data.version}” already exists`);
    }
    throw err;
  }
}

export async function getBlockVersion(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { blockId, blockVersion, organizationId },
  } = ctx;
  const name = `@${organizationId}/${blockId}`;

  const version = await BlockVersion.findOne({
    attributes: [
      'actions',
      'events',
      'layout',
      'resources',
      'parameters',
      'description',
      'longDescription',
    ],
    raw: true,
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
  });

  if (!version) {
    throw notFound('Block version not found');
  }

  const files = await BlockAsset.findAll({
    attributes: ['filename'],
    raw: true,
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
  });

  ctx.body = {
    files: files.map((f) => f.filename),
    iconUrl: `/api/blocks/${name}/versions/${blockVersion}/icon`,
    name,
    version: blockVersion,
    ...version,
  };
}

export async function getBlockVersions(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { blockId, organizationId },
  } = ctx;
  const name = `@${organizationId}/${blockId}`;

  const blockVersions = await BlockVersion.findAll({
    attributes: [
      'actions',
      'description',
      'longDescription',
      'events',
      'layout',
      'version',
      'resources',
      'parameters',
    ],
    raw: true,
    where: { name: blockId, OrganizationId: organizationId },
    order: [['created', 'DESC']],
  });

  if (blockVersions.length === 0) {
    throw notFound('Block not found.');
  }

  ctx.body = blockVersions.map((blockVersion) => ({
    name,
    iconUrl: `/api/blocks/${name}/versions/${blockVersion.version}/icon`,
    ...blockVersion,
  }));
}

export async function getBlockIcon(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { blockId, blockVersion, organizationId },
  } = ctx;

  const version = await BlockVersion.findOne({
    attributes: ['icon'],
    raw: true,
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
  });

  if (!version) {
    throw notFound('Block version not found');
  }

  const icon = version.icon || ((await readAsset('appsemble.svg')) as Buffer);
  ctx.type = isSvg(icon) ? 'svg' : (await fileType.fromBuffer(icon)).mime;
  ctx.body = icon;
}
