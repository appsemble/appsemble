import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

import { logger } from '@appsemble/node-utils';
import { type AppDefinition as AppDefinitionType } from '@appsemble/types';
import { schemas, validateAppDefinition } from '@appsemble/utils';
import { Validator } from 'jsonschema';
import { type Sequelize, type Transaction } from 'sequelize';
import { type Promisable } from 'type-fest';
import { Alias, type Document, parseDocument, Scalar, stringify, YAMLMap, YAMLSeq } from 'yaml';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations } from '../migrations/index.js';
import { App, AppSnapshot, initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { getBlockVersions } from '../utils/block.js';
import { handleDBError } from '../utils/sqlUtils.js';

interface AdditionalArguments {
  validate?: boolean;
  dryRun?: boolean;
  paths?: string;
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
    .option('dry-run', {
      desc: 'Whether to save the changes.',
      type: 'boolean',
      default: true,
    });
}

export type Segment = RegExp | number | string;
export type Path = Segment[];

/**
 * A patch is based on a single path.
 *
 * The path is either used to perform an operation on, such as removing or replacing its value.
 * And/Or to use its value in an operation elsewhere.
 */
export interface Patch {
  /**
   * A message representing the patch.
   */
  message: string;

  /**
   * The path to be patched.
   *
   * A path item must be of type {@link Segment}
   *
   * Items can be a number, string literal, or regex pattern.
   *
   * Special item values:
   * - `'*'`: a wildcard, which continues the search until the next value is matched.
   * Note: a wildcard should not be used at the end of a path.
   * - `'<'`: a back reference going back 1 step from where the search continues.
   */
  path: Path;

  /**
   * Whether to add the value to a pair or sequence.
   *
   * If you would like to add a new key to a kv pair return in {@link value}:
   *
   * `{ key: 'mykey', value: 'myvalue' }`
   *
   * And if you would like to add a new collection use:
   *
   * `new YAMLSeq()`
   *
   * @default false
   */
  add?: boolean;

  /**
   * Whether to delete the key value pair.
   *
   * @default false
   */
  delete?: boolean;

  /**
   * The value to apply.
   *
   * By default replaces the current value.
   */
  value?:
    | unknown
    | ((path: Path, transaction: Transaction, ...params: unknown[]) => Promisable<unknown>);

  /**
   * Additional paths to be patched.
   */
  patches?: ((
    document: Document,
    transaction: Transaction,
    stepsList: Path[],
  ) => Promisable<void>)[];
}

const isLast = (index: number, length: number): boolean => index === length - 1;

function isMatch(input: unknown, matcher: Segment): boolean {
  return input === matcher || (matcher instanceof RegExp && matcher.test(String(input)));
}

function recurse(
  root: YAMLMap,
  node: unknown,
  main: Path,
  index: number,
  anchors: string[],
  handledAnchors: Set<string>,
  resolving: Path = [],
): Path[] {
  const output: Path[] = [];
  const matcher = main[index];
  const last = isLast(index, main.length);

  if (node instanceof YAMLMap) {
    for (const pair of node.items) {
      if (isMatch(pair.key.value, matcher)) {
        output.push([...resolving, pair.key.value]);
      } else {
        for (const path of recurse(root, pair.value, main, index, anchors, handledAnchors, [
          ...resolving,
          pair.key.value,
        ])) {
          output.push(path);
        }
      }
    }
  } else if (node instanceof YAMLSeq) {
    for (const [i, item] of node.items.entries()) {
      output.push(...recurse(root, item, main, index, anchors, handledAnchors, [...resolving, i]));
    }
  } else if (node instanceof Scalar && last && isMatch(node.value, matcher)) {
    output.push([...resolving, node.value]);
  } else if (node instanceof Alias && !handledAnchors.has(node.source)) {
    const anchor = ['anchors', anchors.indexOf(node.source)];
    output.push(
      ...recurse(root, root.getIn(anchor, true), main, index, anchors, handledAnchors, anchor),
    );
    handledAnchors.add(node.source);
  }

  return output;
}

function handleLastAlias(
  root: YAMLMap,
  anchor: Path,
  main: Path,
  index: number,
  anchors: string[],
  handledAnchors: Set<string>,
): Path[] {
  const output: Path[] = [];
  const node = root.getIn(anchor, true);
  if (node instanceof Scalar && isMatch(node.value, main[index])) {
    return [[...anchor, node.value]];
  }
  if (node instanceof YAMLMap) {
    const pairs = node.items.filter((pair) => isMatch(pair.key.value, main[index]));
    return pairs.map(({ key }) => [...anchor, key.value]);
  }
  if (node instanceof YAMLSeq) {
    return node.items.filter((item, i) => isMatch(i, main[index])).map((v, i) => [...anchor, i]);
  }
  if (node instanceof Alias && !handledAnchors.has(node.source)) {
    anchors.push(node.source);
    return handleLastAlias(root, anchor, main, index, anchors, handledAnchors);
  }
  return output;
}

/**
 * Collects the paths and steps matching the {@link Patch.path}.
 *
 * @param main The path of the patch to resolve matching paths for.
 * @param root The root of the document.
 * @param node The current node to walk over.
 * @param anchors The anchors present in the app.
 * @param handledAnchors The already searched anchors.
 * @param index The index of the {@link main} path.
 * @param resolvingPaths The paths to be resolved.
 * @param resolvingSteps The steps it took to resolve the paths.
 * @returns A tuple of resolved paths plus the resolved list of steps.
 */
export function collectPaths(
  main: Path,
  root: YAMLMap,
  node: unknown = root,
  anchors = (root.get('anchors') as YAMLSeq<Scalar | YAMLMap | YAMLSeq>)?.items.map(
    ({ anchor }) => anchor,
  ) ?? [],
  handledAnchors = new Set<string>(),
  index = 0,
  // TODO: should be able to separate paths from steps in another function
  resolvingPaths: Path = [],
  resolvingSteps: Path = [],
): [Path[], Path[]] {
  const paths: Path[] = [];
  const steps: Path[] = [];
  let back = false;

  const collect = (input: Segment): void => {
    paths.push([...resolvingPaths, input]);
    steps.push([...resolvingSteps, input]);
  };

  if (main[index] === '<') {
    back = true;
    paths.push(isLast(index, main.length) ? resolvingPaths.slice(0, -1) : resolvingPaths);
    steps.push(resolvingSteps);
  } else if (main[index] === '*') {
    // eslint-disable-next-line no-param-reassign
    index += 1;
    // TODO: Currently ending with * is not supported as this would cause out of bounds issues....
    const recursed = recurse(root, node, main, index, anchors, handledAnchors, resolvingPaths);
    paths.push(...recursed);
    steps.push(
      ...recursed.map((path) => (path[0] === 'anchors' ? [...resolvingSteps, ...path] : path)),
    );
  } else {
    // TODO: see if ordering these to scalar > yamlmap > yamlseq > alias is faster
    if (node instanceof YAMLMap) {
      const pairs = node.items.filter((pair) => isMatch(pair.key.value, main[index]));
      for (const pair of pairs) {
        collect(pair.key.value);
      }
    } else if (node instanceof YAMLSeq) {
      for (const [number] of node.items.filter((item, i) => isMatch(i, main[index])).entries()) {
        collect(number);
      }
    } else if (
      node instanceof Scalar &&
      (main?.[index + 1] || isLast(index, main.length)) &&
      isMatch(node.value, main[index])
    ) {
      collect(node.value);
    } else if (node instanceof Alias && !handledAnchors.has(node.source)) {
      const anchor = ['anchors', anchors.indexOf(node.source)];
      if (isLast(index, main.length)) {
        const output = handleLastAlias(root, anchor, main, index, anchors, handledAnchors);
        paths.push(...output);
        steps.push(...output.map((a) => [...resolvingSteps, ...a]));
      }
      // TODO: does this make sense?? what about matching??
      else {
        paths.push(anchor);
        steps.push([...resolvingSteps, ...anchor]);
      }
      handledAnchors.add(node.source);
    }
  }

  if (isLast(index, main.length)) {
    return [paths, steps];
  }

  const pathOutputs: Path[] = [];
  const stepOutputs: Path[] = [];
  for (const [i, entry] of paths.entries()) {
    const resolving = back ? entry.slice(0, -1) : entry;
    // TODO: consider passing without scalar true to refactor stuff
    const base = root.getIn(resolving, true);
    const [path, step] = collectPaths(
      main,
      root,
      base,
      anchors,
      handledAnchors,
      index + 1,
      resolving,
      steps[i],
    );
    pathOutputs.push(...path);
    stepOutputs.push(...step);
  }

  return [pathOutputs, stepOutputs];
}

export function extractWildcards(patchPath: Path, paths: Path[]): unknown[][] {
  if (!paths.length) {
    return [];
  }
  let back = 0;
  let wildcard = false;
  const wildcards: unknown[][] = [];

  for (let begin = 0; begin < patchPath.length; begin += 1) {
    const segment = patchPath[begin];
    if (segment === '*') {
      wildcard = true;
      continue;
    }
    if (segment === '<') {
      back += 1;
      continue;
    }
    if (back) {
      if (wildcard) {
        wildcard = false;
      }
      begin += back - 1;
      back = 0;
      continue;
    }
    for (const path of paths) {
      // Oh no bug, slice array first :]
      let end = path.indexOf(segment);
      let resolvedSegment;
      if (end < 0 && typeof segment === 'string') {
        end = path.findIndex((value) => isMatch(value, segment));
        resolvedSegment = path[end];
      }
      end -= 1;
      if (wildcard) {
        wildcards.push([path.slice(begin, end)]);
      }
      if (resolvedSegment) {
        wildcards.push([resolvedSegment]);
      }
    }
    wildcard = false;
  }

  return wildcards;
}

export async function applyPatch(
  patch: Patch,
  document: Document,
  transaction: Transaction,
): Promise<boolean> {
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
        // For key value pairs the value must be `{ mykey: ..., myvalue: ... }`
        // For collections the value must be `new YAMLSeq()`
        // see https://eemeli.org/yaml/#collections
        document.addIn(path, value);
      } else {
        document.setIn(path, value);
      }
    }
  }

  return Boolean(paths.length);
}

/**
 * @param definitions to be patched.
 * @param patches to be applied.
 * @param db the database, to use when applying a patch
 * @returns a list of patched definitions, if the definition is null, then there's nothing to apply.
 */
export async function migrateAppDefinitions(
  definitions: string[],
  patches: Patch[],
  db: Sequelize,
): Promise<(string | null)[]> {
  const patchedDefinitions: (string | null)[] = [];
  for (const yaml of definitions) {
    const transaction = await db.transaction();
    try {
      const applied = [];
      const document = parseDocument(yaml);
      logger.info(`Applying patches for app: ${document.get('name')}`);
      for (const patch of patches) {
        applied.push(await applyPatch(patch, document, transaction));
      }
      if (applied.some(Boolean)) {
        patchedDefinitions.push(String(document));
        await transaction.commit();
      } else {
        patchedDefinitions.push(null);
        await transaction.rollback();
      }
    } catch (error) {
      logger.error(error);
      patchedDefinitions.push(null);
      await transaction.rollback();
    }
  }
  return patchedDefinitions;
}

// TODO: add batch size option that is used to fetch X amount of apps for each run
export async function handler({
  dryRun,
  paths,
  validate,
}: AdditionalArguments = {}): Promise<void> {
  let db;
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
    handleDBError(error as Error);
  }

  let apps: App[];
  const definitions: string[] = [];
  if (paths?.length) {
    for (const path of paths) {
      definitions.push(String(readFileSync(path)));
    }
  } else {
    // TODO: limit this to a max number of definitions. Limit the fetching of definitions by the
    // definition size. If a definition is higher than X (calc from 10k line) megs dump from fetch.
    apps = await App.findAll({
      attributes: ['id', 'definition'],
      include: [{ model: AppSnapshot, as: 'AppSnapshots', order: [['created', 'DESC']], limit: 1 }],
      order: [['created', 'ASC']],
    });
    definitions.push(
      ...apps.map((app) => app.AppSnapshots?.[0]?.yaml || stringify(app.definition)),
    );
  }

  logger.info(`Checking ${definitions.length} app(s) to patch.`);
  const patchedDefinitions = await migrateAppDefinitions(
    definitions,
    migrations.at(-1).appPatches,
    db,
  );

  logger.info(`Patched ${patchedDefinitions.filter((d) => d != null).length} app(s).`);

  let validator: Validator;
  if (validate) {
    validator = new Validator();
    Object.entries(schemas).map(([name, schema]) =>
      validator.addSchema(schema, `/#/components/schemas/${name}`),
    );
  }

  for (const [index, yaml] of patchedDefinitions.entries()) {
    if (yaml == null) {
      logger.silly('Not saving definition, nothing changed.');
      continue;
    }

    // TODO: if any of these throw an error then big problem...
    if (validate) {
      // TODO: combine validation logic with playground, controllers, etc.
      const document = parseDocument(yaml);
      const appId = apps?.[index]?.id ? ` with app id: ${apps[index].id}` : '';
      logger.info(`Validating ${document.get('name')} app definition${appId}.`);
      const definition = document.toJS({ maxAliasCount: 10_000 }) as AppDefinitionType;
      const schemaValidationResult = validator.validate(definition, schemas.AppDefinition, {
        throwError: false,
        throwFirst: false,
        throwAll: false,
      });
      if (schemaValidationResult.errors.length > 0) {
        logger.error('Schema definition validation failed');
        continue;
      }
      const customValidationResult = await validateAppDefinition(definition, getBlockVersions);
      if (customValidationResult.errors.length > 0) {
        logger.error('Custom validation failed');
        continue;
      }
      logger.info('Successfully validated definition.');
    }

    if (dryRun) {
      continue;
    }

    if (paths?.length) {
      const filePath = paths[index];
      logger.info(`Writing patched definition to ${filePath}`);
      await writeFile(filePath, yaml);
    } else {
      const app = apps[index];
      logger.info(`Saving definition to new app snapshot for app: ${app.id}`);
      // TODO: add properties to inform the user about the patched definition
      // TODO: maybe a command line option to adjust what apps will use the patched definition
      // for the published version based on a supplied list of apps and or orgs
      await AppSnapshot.create({ yaml, AppId: app.id });
    }
  }

  await db.close();
}
