import {
  assertKoaCondition,
  handleValidatorResult,
  logger,
  throwKoaError,
  uploadToBuffer,
} from '@appsemble/node-utils';
import { type BlockDefinition, OrganizationPermission } from '@appsemble/types';
import { has } from '@appsemble/utils';
import { Validator } from 'jsonschema';
import { type Context } from 'koa';
import { type OpenAPIV3 } from 'openapi-types';
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
import { blockVersionToJson } from '../../../utils/block.js';

export async function createBlock(ctx: Context): Promise<void> {
  const { files, icon, messages, ...data }: PublishBlockBody = ctx.request.body;
  const { name, version } = data;
  const actionKeyRegex = /^[a-z]\w*$/;

  const [org, blockId] = name.split('/');
  const OrganizationId = org.slice(1);

  if (data.actions) {
    for (const key of Object.keys(data.actions)) {
      assertKoaCondition(
        actionKeyRegex.test(key) || key === '$any',
        ctx,
        400,
        `Action “${key}” does match /${actionKeyRegex.source}/`,
      );
    }
  }

  if (data.examples?.length) {
    const validator = new Validator();
    validator.customFormats.fontawesome = () => true;
    validator.customFormats.remapper = () => true;
    validator.customFormats.action = () => true;
    validator.customFormats['event-listener'] = () => true;
    validator.customFormats['event-emitter'] = () => true;

    for (const exampleString of data.examples) {
      let example: BlockDefinition;
      try {
        example = parse(exampleString);
      } catch {
        throwKoaError(ctx, 400, `Error parsing YAML example:\n${exampleString}`);
      }
      if (!example || typeof example !== 'object') {
        continue;
      }
      const { required, ...blockSchema } = structuredClone(
        ctx.openApi.document.components.schemas.BlockDefinition,
      ) as OpenAPIV3.NonArraySchemaObject;

      delete blockSchema.properties.name;
      delete blockSchema.properties.version;

      const actionsSchema = blockSchema.properties.actions as OpenAPIV3.NonArraySchemaObject;

      delete actionsSchema.additionalProperties;
      if (example.actions) {
        actionsSchema.properties = Object.fromEntries(
          Object.keys(example.actions).map((key) => [
            key,
            { $ref: '#/components/schemas/ActionDefinition' },
          ]),
        );
      }
      const blockEventsSchema: OpenAPIV3.NonArraySchemaObject = {
        type: 'object',
        additionalProperties: false,
        properties: {},
      };
      blockSchema.properties.events = blockEventsSchema;
      if (example.events) {
        if (example.events.emit) {
          blockEventsSchema.properties.emit = has(example.events.emit, '$any')
            ? { type: 'object', additionalProperties: { type: 'string' } }
            : {
                type: 'object',
                properties: Object.fromEntries(
                  Object.keys(example.events.emit).map((emitter) => [emitter, { type: 'string' }]),
                ),
              };
        }
        if (example.events.listen) {
          blockEventsSchema.properties.listen = has(example.events.listen, '$any')
            ? { type: 'object', additionalProperties: { type: 'string' } }
            : {
                type: 'object',
                properties: Object.fromEntries(
                  Object.keys(example.events.listen).map((listener) => [
                    listener,
                    { type: 'string' },
                  ]),
                ),
              };
        }
      }

      const validationResult = ctx.openApi.validate(example, blockSchema, { throw: false });
      handleValidatorResult(ctx, validationResult, 'Validation failed for block example');
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
    throwKoaError(
      ctx,
      409,
      `Version ${blockVersion.version} is equal to or lower than the already existing ${name}@${version}.`,
    );
  }

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
      createdBlock.BlockAssets = await BlockAsset.bulkCreate(
        await Promise.all(
          files.map(async (file) => ({
            name: blockId,
            BlockVersionId: createdBlock.id,
            filename: decodeURIComponent(file.filename),
            mime: file.mime,
            content: await uploadToBuffer(file.path),
          })),
        ),
        { logging: false, transaction },
      );

      if (messages) {
        await BlockMessages.bulkCreate(
          Object.entries(messages).map(([language, content]) => ({
            language,
            messages: content,
            BlockVersionId: createdBlock.id,
          })),
          { transaction },
        );
      }

      createdBlock.Organization = new Organization({ id: OrganizationId });
      if (!icon) {
        await createdBlock.Organization.reload({
          attributes: ['updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
        });
      }

      ctx.body = blockVersionToJson(createdBlock);
    });
  } catch (err: unknown) {
    if (err instanceof UniqueConstraintError || err instanceof DatabaseError) {
      throwKoaError(ctx, 409, `Block “${name}@${data.version}” already exists`);
    }
    throw err;
  }
}
