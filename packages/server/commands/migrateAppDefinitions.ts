import { readFile, writeFile } from 'node:fs/promises';

import {
  type AppDefinition as AppDefinitionType,
  BaseValidatorFactory,
  schemas,
  validateAppDefinition,
} from '@appsemble/lang-sdk';
import { logger } from '@appsemble/node-utils';
import { type Validator } from 'jsonschema';
import { type Sequelize, type Transaction } from 'sequelize';
import { type Document, parseDocument, stringify, type YAMLMap } from 'yaml';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations } from '../migrations/main/index.js';
import { App, AppSnapshot, initDB, transactional } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { getBlockVersions } from '../utils/block.js';
import { handleDBError } from '../utils/sqlUtils.js';
import { collectPaths, type Patch } from '../utils/yaml.js';

interface AdditionalArguments {
  validate?: boolean;
  save?: boolean;
  paths?: string[];
  batch?: number;
}

export const command = 'migrate-app-definitions';
export const description = 'Migrate all app definitions in the Appsemble database.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('paths', {
      describe: 'The paths to the app definitions to patch.',
    })
    .option('validate', {
      desc: 'Whether to validate the definitions before saving.',
      type: 'boolean',
      default: true,
    })
    .option('save', {
      desc: 'Whether to save the changes.',
      type: 'boolean',
      default: false,
    })
    .option('batch', {
      desc: 'The batch size of apps to patch at once.',
      type: 'number',
      default: 100,
    });
}

export interface IterAppsOptions {
  /**
   * How many app definitions to retrieve at once.
   */
  batch?: number;

  paths?: string[];
}

async function* iterApps({
  batch,
  paths,
}: IterAppsOptions): AsyncGenerator<[string, number | string][], void, undefined> {
  let offset = 0;
  let length = Number.POSITIVE_INFINITY;
  // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
  while (batch <= length) {
    let chunk: [string, number | string][] = [];
    if (paths?.length) {
      chunk = await Promise.all(
        paths
          // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
          .slice(offset, offset + batch)
          .map<Promise<[string, number | string]>>(async (path) => [
            String(await readFile(path)),
            path,
          ]),
      );
      yield chunk;
    } else {
      const apps = await App.findAll({
        attributes: ['id', 'definition'],
        include: [
          {
            model: AppSnapshot,
            as: 'AppSnapshots',
            order: [['created', 'DESC']],
            attributes: ['yaml'],
            limit: 1,
          },
        ],
        order: [['created', 'ASC']],
        limit: batch,
        offset,
      });
      chunk = apps.map<[string, number | string]>((app) => [
        app.AppSnapshots?.[0]?.yaml || stringify(app.definition),
        app.id,
      ]);
      yield chunk;
    }
    ({ length } = chunk);
    offset += length;
  }
}

export async function applyPatch(
  patch: Patch,
  document: Document,
  transaction: Transaction,
): Promise<boolean> {
  if (!patch.path.length) {
    logger.warn('Patch path empty, please provide a path.');
    return false;
  }
  logger.verbose(patch.message);
  const [paths, stepsList] = collectPaths(patch.path, document.contents as YAMLMap);
  if (!paths.length) {
    logger.silly('No matching paths found.');
    return false;
  }

  if (patch.patches) {
    for (const apply of patch.patches) {
      await apply(document, transaction, stepsList);
    }
  }

  for (const [index, path] of paths.entries()) {
    if (patch.delete) {
      document.deleteIn(path);
    }
    if (patch.value !== undefined) {
      const value =
        typeof patch.value === 'function'
          ? await patch.value(path, transaction, stepsList[index])
          : patch.value;
      if (patch.add) {
        document.addIn(path, value);
      } else {
        document.setIn(path, value);
      }
    }
  }

  return Boolean(paths.length);
}

/**
 * @param definition to be patched.
 * @param patches to be applied.
 * @param db the database, to use when applying a patch
 * @returns a list of patched definitions, if the definition is null, then there's nothing to apply.
 */
export async function migrateAppDefinition(
  definition: string,
  patches: Patch[],
  db: Sequelize,
): Promise<string | null> {
  let patchedDefinition: string | null = null;
  const transaction = await db.transaction();
  try {
    const applied = [];
    const document: Document = parseDocument(definition);
    logger.info(`Applying patches for app: ${document.get('name')}`);
    for (const patch of patches) {
      applied.push(await applyPatch(patch, document, transaction));
    }
    if (applied.some(Boolean)) {
      patchedDefinition = String(document);
      await transaction.commit();
    } else {
      await transaction.rollback();
    }
  } catch (error) {
    logger.error(error);
    await transaction.rollback();
  }
  return patchedDefinition;
}

// TODO: combine validation logic with playground, controllers, etc.
async function validateDefinition(
  validator: Validator,
  yaml: string,
  appId?: number,
): Promise<boolean> {
  const document = parseDocument(yaml);
  const definition = document.toJS({ maxAliasCount: 10_000 }) as AppDefinitionType;
  const schemaValidationResult = validator.validate(definition, schemas.AppDefinition, {
    throwError: false,
    throwFirst: false,
    throwAll: false,
    ...BaseValidatorFactory.defaultOptions,
  });
  const id = appId ? `id: ${appId}, ` : '';
  if (schemaValidationResult.errors.length > 0) {
    logger.error(`Schema validation failed. ${id}name: "${document.get('name')}"`);
    return true;
  }
  const customValidationResult = await validateAppDefinition(definition, getBlockVersions);
  if (customValidationResult.errors.length > 0) {
    logger.error(`Custom validation failed. ${id}name: "${document.get('name')}"`);
    return true;
  }
  logger.info(`Successfully validated.   ${id}name: "${document.get('name')}"`);
  return false;
}

async function saveDefinition(yaml: string, idOrPath: number | string): Promise<void> {
  if (typeof idOrPath === 'string') {
    await writeFile(idOrPath, yaml);
    logger.info(`Wrote patched definition to ${idOrPath}`);
  } else {
    // TODO: add properties to inform the user about the patched definition
    // TODO: maybe a command line option to adjust what apps will use the patched definition
    // for the published version based on a supplied list of apps and or orgs
    await transactional(async (transaction) => {
      const document = parseDocument(yaml);
      const definition = document.toJS({ maxAliasCount: 10_000 }) as AppDefinitionType;
      await App.update({ definition }, { where: { id: idOrPath }, transaction });
      await AppSnapshot.create({ yaml, AppId: idOrPath }, { transaction });
    });
    logger.info(`Saved snapshot for app: ${idOrPath}`);
  }
}

export async function handler({
  batch,
  paths,
  save,
  validate,
}: AdditionalArguments = {}): Promise<void> {
  const patches = migrations.at(-1)?.appPatches;
  if (!patches?.length) {
    logger.info('No patches found, nothing to migrate.');
    return process.exit();
  }

  let db: Sequelize;
  try {
    db = initDB({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (error: unknown) {
    if (!paths?.length) {
      handleDBError(error as Error);
    }
    handleDBError(error as Error);
  }

  let validator: Validator | undefined;
  if (validate) {
    validator = new BaseValidatorFactory({ schemas }).build();
  }

  let checked = 0;
  let patched = 0;
  let failed = 0;
  let success = 0;
  let saved = 0;

  for await (const apps of iterApps({ batch, paths })) {
    const items = await Promise.all(
      apps.map<Promise<[string | null, number | string]>>(async ([definition, idOrPath]) => [
        await migrateAppDefinition(definition, patches, db),
        idOrPath,
      ]),
    );

    const saving: [string, number | string][] = [];
    for (const [patchedDefinition, idOrPath] of items) {
      checked += 1;

      if (patchedDefinition == null) {
        logger.verbose('Nothing changed.');
        continue;
      }
      patched += 1;

      const id = typeof idOrPath === 'number' ? idOrPath : undefined;
      if (validate && (await validateDefinition(validator!, patchedDefinition, id))) {
        failed += 1;
        continue;
      }
      success += 1;

      saving.push([patchedDefinition, idOrPath]);
    }

    if (!save) {
      continue;
    }

    for (const [patchedDefinition, idOrPath] of saving) {
      try {
        await saveDefinition(patchedDefinition, idOrPath);
        saved += 1;
      } catch (err) {
        logger.error(err);
      }
    }
  }

  logger.info(`Checked ${checked} app(s).`);
  logger.info(`Patched ${patched} app(s).`);
  logger.info(`Validation failed for ${failed} app(s).`);
  logger.info(`Successfully validated ${success} app(s).`);
  logger.info(`Saved ${saved} app(s).`);

  await db.close();
  process.exit();
}
