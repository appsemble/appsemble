import { logger } from '@appsemble/node-utils';
import { BlockManifest } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import { badRequest, conflict, notFound } from '@hapi/boom';
import { isEqual, parseISO } from 'date-fns';
import { File } from 'koas-body-parser';
import semver from 'semver';
import { DatabaseError, literal, QueryTypes, UniqueConstraintError } from 'sequelize';

import {
  BlockAsset,
  BlockMessages,
  BlockVersion,
  getDB,
  Organization,
  transactional,
} from '../models';
import { KoaContext } from '../types';
import { checkRole } from '../utils/checkRole';
import { serveIcon } from '../utils/icon';

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
      [literal('"BlockVersion".icon IS NOT NULL'), 'hasIcon'],
    ],
    where: { name: blockId, OrganizationId: organizationId },
    include: {
      model: Organization,
      attributes: ['updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
    },
    order: [['created', 'DESC']],
  });

  if (!blockVersion) {
    throw notFound('Block definition not found');
  }

  const { actions, description, events, layout, longDescription, parameters, resources, version } =
    blockVersion;
  const name = `@${organizationId}/${blockId}`;
  let iconUrl = null;
  if (blockVersion.get('hasIcon')) {
    iconUrl = `/api/blocks/${name}/versions/${version}/icon`;
  } else if (blockVersion.Organization.get('hasIcon')) {
    iconUrl = `/api/organizations/@${organizationId}/icon?updated=${blockVersion.Organization.updated.toISOString()}`;
  }
  ctx.body = {
    name,
    description,
    longDescription,
    version,
    actions,
    events,
    iconUrl,
    layout,
    parameters,
    resources,
  };
}

export async function queryBlocks(ctx: KoaContext<Params>): Promise<void> {
  // Sequelize does not support subqueries
  // The alternative is to query everything and filter manually
  // See: https://github.com/sequelize/sequelize/issues/9509
  const blockVersions = await getDB().query<
    BlockVersion & { hasIcon: boolean; hasOrganizationIcon: boolean; organizationUpdated: Date }
  >(
    `SELECT bv."OrganizationId", bv.name, bv.description, "longDescription",
    version, actions, events, layout, parameters, resources,
    bv.icon IS NOT NULL as "hasIcon", o.icon IS NOT NULL as "hasOrganizationIcon", o.updated AS "organizationUpdated"
    FROM "BlockVersion" bv
    INNER JOIN "Organization" o ON o.id = bv."OrganizationId"
    WHERE bv.created IN (SELECT MAX(created)
                          FROM "BlockVersion"
                          GROUP BY "OrganizationId", name)`,
    { type: QueryTypes.SELECT },
  );

  ctx.body = blockVersions.map((blockVersion) => {
    const {
      OrganizationId,
      actions,
      description,
      events,
      hasIcon,
      hasOrganizationIcon,
      layout,
      longDescription,
      name,
      organizationUpdated,
      parameters,
      resources,
      version,
    } = blockVersion;
    let iconUrl = null;
    if (hasIcon) {
      iconUrl = `/api/blocks/@${OrganizationId}/${name}/versions/${version}/icon`;
    } else if (hasOrganizationIcon) {
      iconUrl = `/api/organizations/@${OrganizationId}/icon?updated=${organizationUpdated.toISOString()}`;
    }
    return {
      name: `@${OrganizationId}/${name}`,
      description,
      longDescription,
      version,
      actions,
      events,
      iconUrl,
      layout,
      parameters,
      resources,
    };
  });
}

interface PublishBlockBody extends Omit<BlockManifest, 'files'> {
  files: File[];
  icon: File;
}

export async function publishBlock(ctx: KoaContext<Params>): Promise<void> {
  const { files, icon, messages, ...data }: PublishBlockBody = ctx.request.body;
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

  if (messages) {
    const messageKeys = Object.keys(messages.en);
    Object.entries(messages as Record<string, Record<string, string>>).forEach(
      ([language, record]) => {
        const keys = Object.keys(record);
        if (keys.length !== messageKeys.length || keys.some((key) => !messageKeys.includes(key))) {
          throw badRequest(`Language ‘${language}’ contains mismatched keys compared to ‘en’.`);
        }
      },
    );
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
        id,
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
          BlockVersionId: id,
          filename: decodeURIComponent(file.filename),
          mime: file.mime,
          content: file.contents,
        })),
        { logging: false, transaction },
      );

      if (messages) {
        await BlockMessages.bulkCreate(
          Object.entries(messages).map(([language, content]) => ({
            language,
            messages: content,
            BlockVersionId: id,
          })),
          { transaction },
        );
      }

      let iconUrl = icon ? `/api/blocks/${name}/versions/${version}/icon` : null;
      if (!iconUrl) {
        const organization = await Organization.findByPk(OrganizationId, {
          transaction,
          attributes: ['updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
        });

        if (organization.get('hasIcon')) {
          iconUrl = `/api/organizations/${OrganizationId}/icon?updated=${organization.updated.toISOString()}`;
        }
      }

      ctx.body = {
        actions,
        iconUrl,
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
      'id',
      'actions',
      'events',
      'layout',
      'resources',
      'parameters',
      'description',
      'longDescription',
      [literal('"BlockVersion".icon IS NOT NULL'), 'hasIcon'],
    ],
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
    include: [
      { model: BlockAsset, attributes: ['filename'] },
      {
        model: Organization,
        attributes: ['updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      },
    ],
  });

  if (!version) {
    throw notFound('Block version not found');
  }

  let iconUrl = version.get('hasIcon') ? `/api/blocks/${name}/versions/${blockVersion}/icon` : null;
  if (!iconUrl && version.Organization.get('hasIcon')) {
    iconUrl = `/api/organizations/${organizationId}/icon?updated=${version.Organization.updated.toISOString()}`;
  }

  ctx.body = {
    files: version.BlockAssets.map((f) => f.filename),
    iconUrl,
    name,
    version: blockVersion,
    actions: version.actions,
    events: version.events,
    layout: version.layout,
    resources: version.resources,
    parameters: version.parameters,
    description: version.description,
    longDescription: version.longDescription,
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

export async function getBlockAsset(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { blockId, blockVersion, organizationId },
    query: { filename },
  } = ctx;

  const block = await BlockVersion.findOne({
    attributes: ['id'],
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
    include: [
      { model: BlockAsset, where: { filename }, attributes: ['content', 'mime'], required: false },
    ],
  });

  if (!block) {
    throw notFound('Block version not found');
  }

  if (block.BlockAssets.length !== 1) {
    throw notFound(`Block has no asset named "${filename}"`);
  }

  ctx.body = block.BlockAssets[0].content;
  ctx.type = block.BlockAssets[0].mime;
}

export async function getBlockIcon(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { blockId, blockVersion, organizationId },
    query: { size, updated },
  } = ctx;

  const version = await BlockVersion.findOne({
    attributes: ['icon'],
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
    include: [{ model: Organization, attributes: ['icon', 'updated'] }],
  });

  if (!version) {
    throw notFound('Block version not found');
  }

  const cache = version.icon
    ? true
    : isEqual(parseISO(updated as string), version.Organization.updated);

  return serveIcon(ctx, {
    cache,
    fallback: 'cubes-solid.png',
    height: size && Number.parseInt(size as string),
    icon: version.icon || version.Organization.icon,
    width: size && Number.parseInt(size as string),
  });
}
