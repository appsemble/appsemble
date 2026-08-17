import {
  type BlockDefinition,
  BlockExampleValidator,
  BlockParamSchemaValidator,
} from '@appsemble/lang-sdk';
import {
  assertKoaCondition,
  handleValidatorResult,
  logger,
  isValidBlockAssetFilename,
  throwKoaError,
  uploadS3File,
  uploadToBuffer,
} from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import semver from 'semver';
import { DatabaseError, literal, UniqueConstraintError } from 'sequelize';
import { parse } from 'yaml';

import {
  BlockAsset,
  BlockMessages,
  BlockVersion,
  Organization,
  transactional,
} from '../../../models/index.js';
import { type PublishBlockBody } from '../../../types/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import {
  deleteBlockAssetObjects,
  getBlockAssetsBucketName,
  getBlockAssetStorageKey,
} from '../../../utils/blockAssets.js';
import { blockVersionToJson } from '../../../utils/block.js';

export async function createBlock(ctx: Context): Promise<void> {
  const { files, icon, messages, ...data }: PublishBlockBody = ctx.request.body;
  const { name, version } = data;
  const actionKeyRegex = /^[a-z]\w*$/;

  const [org, blockId] = name.split('/');
  const OrganizationId = org.slice(1);

  if (data.actions) {
    for (const key of Object.keys(data.actions)) {
      // TODO: this doesn't belong here at all.
      assertKoaCondition(
        actionKeyRegex.test(key) || key === '$any',
        ctx,
        400,
        `Action “${key}” does not match /${actionKeyRegex.source}/`,
      );
    }
  }

  if (data.parameters) {
    const paramValidator = new BlockParamSchemaValidator();

    const result = paramValidator.validateParamSchema(data.parameters);
    handleValidatorResult(ctx, result, 'Validation failed for block parameters');
  }

  if (data.examples?.length) {
    const exampleValidator = new BlockExampleValidator();

    for (const exampleString of data.examples) {
      let example: BlockDefinition | undefined;
      try {
        example = parse(exampleString);
      } catch {
        throwKoaError(ctx, 400, `Error parsing YAML example:\n${exampleString}`);
      }
      if (!example || typeof example !== 'object') {
        continue;
      }
      const result = exampleValidator.validate(example);
      handleValidatorResult(ctx, result, 'Validation failed for block example');
    }
  }

  if (messages) {
    const messageKeys = Object.keys(messages.en);
    for (const [language, record] of Object.entries(messages)) {
      const keys = Object.keys(record);
      assertKoaCondition(
        !(keys.length !== messageKeys.length || keys.some((key) => !messageKeys.includes(key))),
        ctx,
        400,
        `Language ‘${language}’ contains mismatched keys compared to ‘en’.`,
      );
    }
  }

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: OrganizationId,
    requiredPermissions: [OrganizationPermission.PublishBlocks],
  });

  const blockVersion = await BlockVersion.findOne({
    where: { name: blockId, OrganizationId },
    order: [['created', 'DESC']],
    raw: true,
  });

  // If there is a previous version and it has a higher semver, throw an error.
  if (blockVersion && semver.gte(blockVersion.version, version)) {
    logger.silly(`DB version ${blockVersion.version}, Request body version ${version}`);
    throwKoaError(
      ctx,
      409,
      `Version ${blockVersion.version} is equal to or lower than the already existing ${name}@${version}.`,
    );
  }

  const filenames = files.map((file) => {
    try {
      return decodeURIComponent(file.filename);
    } catch {
      throwKoaError(ctx, 400, `Invalid block asset filename: ${file.filename}`);
    }
  });

  for (const filename of filenames) {
    assertKoaCondition(
      isValidBlockAssetFilename(filename),
      ctx,
      400,
      `Invalid block asset filename: ${filename}`,
    );
  }

  const uploadedKeys: string[] = [];

  try {
    await transactional(async (transaction) => {
      const createdBlock = await BlockVersion.create(
        {
          ...data,
          visibility: data.visibility || 'public',
          icon: icon ? await uploadToBuffer(icon.path) : undefined,
          name: blockId,
          OrganizationId,
        },
        { transaction },
      );

      for (const file of files) {
        logger.verbose(
          `Creating block assets for ${name}@${version}: ${decodeURIComponent(file.filename)}`,
        );
      }

      const assets = [];
      for (const [index, file] of files.entries()) {
        const filename = filenames[index];
        const content = await uploadToBuffer(file.path);
        const storageKey = getBlockAssetStorageKey({
          blockName: blockId,
          blockVersionId: createdBlock.id,
          filename,
          organizationId: OrganizationId,
          version,
        });

        await uploadS3File(getBlockAssetsBucketName(), storageKey, content, content.byteLength, {
          'Cache-Control': 'public,max-age=31536000,immutable',
          'Content-Type': file.mime ?? 'application/octet-stream',
        });
        uploadedKeys.push(storageKey);
        assets.push({
          BlockVersionId: createdBlock.id,
          content,
          filename,
          mime: file.mime,
          size: content.byteLength,
          storageKey,
        });
      }

      createdBlock.BlockAssets = await BlockAsset.bulkCreate(assets, {
        logging: false,
        transaction,
      });

      createdBlock.BlockMessages = messages
        ? await BlockMessages.bulkCreate(
            Object.entries(messages).map(([language, content]) => ({
              language,
              messages: content,
              BlockVersionId: createdBlock.id,
            })),
            { transaction },
          )
        : [];

      createdBlock.Organization = new Organization({ id: OrganizationId });
      if (!icon) {
        await createdBlock.Organization.reload({
          attributes: ['updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
        });
      }

      const manifestJson = blockVersionToJson(createdBlock, { includeFileUrls: false });
      await createdBlock.update({ manifestJson }, { transaction });

      ctx.body = blockVersionToJson(createdBlock);
    });
  } catch (err: unknown) {
    if (uploadedKeys.length) {
      await deleteBlockAssetObjects(uploadedKeys);
    }

    if (err instanceof UniqueConstraintError || err instanceof DatabaseError) {
      logger.silly(err);
      throwKoaError(ctx, 409, `Block “${name}@${data.version}” already exists`);
    }
    throw err;
  }
}
