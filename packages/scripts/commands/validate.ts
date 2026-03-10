import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, dirname, join, relative } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { getWorkspaces, logger, opendirSafe, readData } from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import fsExtra from 'fs-extra';
import normalizePath from 'normalize-path';
import semver from 'semver';
import { type PackageJson } from 'type-fest';
import ts from 'typescript';

import { extractMessages } from '../lib/i18n.js';

export const command = 'validate';
export const description = 'Validate all workspaces have a proper configuration';

/**
 * A list of packages that are released without a scoped package name.
 */
const unscopedPackageNames = new Set(['appsemble', 'create-appsemble']);

/**
 * The license in the project root.
 */
const projectLicense = await readFile('LICENSE.md', 'utf8');

/**
 * A representation of an npm workspace.
 */
interface Workspace {
  /**
   * The absolute path to the workspace directory.
   */
  dir: string;

  /**
   * The contents of the package.json file in the workspace.
   */
  pkg: PackageJson;
}

/**
 * A validation result
 */
interface Result {
  /**
   * The filename to which the result applies.
   */
  filename: string;

  /**
   * The validation message.
   */
  message: string;

  /**
   * Checked on truthiness to see if the result is a pass or fail.
   */
  pass: any;

  /**
   * The workspace on which the result applies.
   */
  workspace: Workspace;
}

/**
 * Assert if a check fails or passes.
 *
 * @param assertion Whether the assertion passed.
 * @param filename On which file name the assertion applies.
 * @param message A description of the assertion that was run.
 */
type Assert = (assertion: boolean, filename: string, message: string, workspace?: string) => void;

async function validateTranslations(assert: Assert): Promise<void> {
  const developerLocales = [defaultLocale].sort();
  const translations: Record<string, Record<string, string>> = {};

  await opendirSafe('./i18n', async (filepath, stat) => {
    if (stat.name === 'index.ts') {
      return;
    }

    if (!stat.isFile() || !filepath.endsWith('.json')) {
      assert(false, filepath, 'should be a json file');
      return;
    }

    const [language] = stat.name.split('.json');
    const [messages] = await readData<Record<string, string>>(filepath);
    translations[language] = messages;
  });

  const allLocales = [...new Set([...developerLocales, ...Object.keys(translations)])].sort();
  const translatedMessages = await extractMessages();

  for (const language of allLocales) {
    const path = `i18n/${language}.json`;
    const messages = translations[language];
    if (language === defaultLocale) {
      assert(
        isDeepStrictEqual(messages, translatedMessages[language]),
        path,
        `${defaultLocale} messages should be equal when extracted`,
      );
    }

    if (developerLocales.includes(language)) {
      const untranslatedMessages = Object.values(messages).filter((message) => !message);
      assert(untranslatedMessages.length === 0, path, 'Messages should be translated');
    } else {
      assert(
        isDeepStrictEqual(
          Object.keys(messages).sort(),
          Object.keys(translatedMessages[language]).sort(),
        ),
        path,
        'Keys should be the same',
      );
    }
  }
}

async function validate(
  assert: Assert,
  { dir, pkg }: Workspace,
  latestVersion: string,
): Promise<void> {
  /**
   * Validate package.json
   */
  const pkgNameMatch = pkg.name!.match(/^(@(?<scope>[a-z-]+)\/)?(?<name>[a-z-]+[\da-z-]+)$/);
  const isBlock = basename(dirname(dir)) === 'blocks';
  const isController = basename(dir) === 'controller';

  assert(
    basename(dir) === pkgNameMatch?.groups?.name,
    '',
    'Base directory should match package name',
  );
  assert(
    pkgNameMatch?.groups?.scope === 'appsemble' ||
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      unscopedPackageNames.has(pkgNameMatch?.groups?.name),
    'package.json',
    'Name should use the @appsemble scope',
  );
  if (!isBlock && !isController) {
    for (const keyword of ['app', 'apps', 'framework', 'low-code', 'lowcode']) {
      assert(
        (pkg.keywords ?? []).includes(keyword),
        'package.json',
        `Keywords should at least contain ${keyword}`,
      );
    }
    assert(
      (pkg.keywords ?? []).every(
        (keyword, i) => !i || pkg.keywords![i - 1].localeCompare(keyword) < 0,
      ),
      'package.json',
      'Keywords should be sorted alphabetically',
    );
  }
  assert(
    pkg.type === 'module' || pkg.type === 'commonjs',
    'package.json',
    'Type should be explicitly set to “commonjs” or “module”',
  );
  assert(
    pkg.version === latestVersion,
    'package.json',
    `Version should match latest version "${latestVersion}"`,
  );
  assert(typeof pkg.description === 'string', 'package.json', 'Description should be valid');
  assert(
    pkg.homepage === 'https://appsemble.app',
    'package.json',
    'Homepage should be "https://appsemble.app"',
  );
  assert(
    pkg.bugs === 'https://gitlab.com/appsemble/appsemble/-/issues',
    'package.json',
    'Bugs should be "https://gitlab.com/appsemble/appsemble/-/issues"',
  );
  assert(
    (pkg?.repository as any)?.type === 'git',
    'package.json',
    'Repository type should be "git"',
  );
  assert(
    (pkg?.repository as any)?.url === 'https://gitlab.com/appsemble/appsemble.git',
    'package.json',
    'Repository url should be "https://gitlab.com/appsemble/appsemble.git"',
  );
  assert(
    (pkg?.repository as any)?.directory === normalizePath(relative(process.cwd(), dir)),
    'package.json',
    `Repository directory should be "${normalizePath(relative(process.cwd(), dir))}"`,
  );
  assert(pkg.license === 'LGPL-3.0-only', 'package.json', 'License should be "LGPL-3.0-only"');
  assert(
    pkg.author === 'Appsemble <info@appsemble.com> (https://appsemble.com)',
    'package.json',
    'Author should be "Appsemble <info@appsemble.com> (https://appsemble.com)"',
  );
  assert(pkg.scripts?.test === 'vitest', 'package.json', 'Test script should be "vitest"');
  for (const version of Object.values({ ...pkg.dependencies, ...pkg.devDependencies })) {
    if ((version ?? '').startsWith('@appsemnle/')) {
      assert(
        version === latestVersion,
        'package.json',
        `Dependencies on Appsemble packages should depend on exactly "${latestVersion}"`,
      );
    }
  }

  /**
   * Validate tsconfig.json
   */
  const tsConfig = await fsExtra.readJson(join(dir, 'tsconfig.json')).catch((): null => null);
  assert(tsConfig, 'tsconfig.json', 'The workspace should have a TypeScript configuration');
  if (tsConfig) {
    if (isBlock || isController) {
      assert(
        tsConfig.extends?.startsWith('@appsemble/tsconfig'),
        'tsconfig.json',
        'Should extend "@appsemble/tsconfig"',
      );
    } else {
      assert(
        tsConfig.extends === '../../tsconfig',
        'tsconfig.json',
        'Should extend "../../tsconfig"',
      );
      assert(
        tsConfig.compilerOptions?.rootDir === '.',
        'tsconfig.json',
        'compilerOptions.rootDir should be "."',
      );
    }
  }

  /**
   * Validate vitest.config.js exists
   */
  assert(
    existsSync(join(dir, 'vitest.config.js')) || existsSync(join(dir, 'vitest.config.mjs')),
    'vitest.config.js',
    'Projects should have a vitest configuration',
  );

  /**
   * Validate the license matches the Appsemble license.
   */
  const license = await readFile(join(dir, 'LICENSE.md'), 'utf8').catch((): null => null);
  assert(Boolean(license), 'LICENSE.md', 'The workspace should have a license');
  assert(
    license === projectLicense,
    'LICENSE.md',
    'The workspace license should match the project license',
  );
}

/**
 * Validates Appsemble RC context properties and descriptions between the schema and type definition
 *
 * @param assert The assert function used.
 * @param types The path to the `@appsemble/types` package.
 * @param cli The path to the `@appsemble/cli` package.
 */
async function validateContext(assert: Assert, types: string, cli: string): Promise<void> {
  const cliFile = join(types, 'cli.ts');
  const rcFile = join(cli, 'assets', 'appsemblerc.schema.json');
  const cliContent = await readFile(cliFile, 'utf8');
  const [rcContent] = await readData(rcFile);
  const file = ts.createSourceFile('temp.ts', cliContent, ts.ScriptTarget.ES2019);
  // @ts-expect-error 2532 Object is possibly undefined
  const props = file.statements
    .find(ts.isInterfaceDeclaration)
    .members.filter(ts.isPropertySignature);

  // TODO: validate recursively
  const interfaceProps = props?.map((p) => ({
    name: p.name.getText(file),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    comment: p.jsDoc[0].comment,
    // TODO: validate if types match as well
    // type: ts.SyntaxKind[p.type.kind].replace(/Keyword|Type/, '').toLowerCase(),
    // TODO: validate if default value matches as well
  }));

  const schemaProps = (rcContent as any).properties.context.additionalProperties.properties;

  const schemaKeys = Object.keys(schemaProps);
  const interfaceKeys = new Set(interfaceProps.map((p) => p.name));

  const missingSchemaKeys = schemaKeys.filter((p) => !interfaceKeys.has(p));
  const missingInterfaceKeys = interfaceProps.filter((p) => !schemaKeys.includes(p.name));

  for (const key of missingSchemaKeys) {
    assert(false, 'cli.ts', `is missing \`${key}\``, 'packages/types');
  }
  for (const key of missingInterfaceKeys) {
    assert(false, 'assets/appsemblerc.schema.json', `is missing \`${key}\``, 'packages/cli');
  }

  const ignoredChars = /`|\*/g;
  const newLinePattern = /(?<!\n)\n(?!\n|-)/g;

  for (const interfaceProp of interfaceProps) {
    assert(
      schemaProps[interfaceProp.name]?.description.replaceAll(ignoredChars, '') ===
        interfaceProp.comment.replaceAll(ignoredChars, '').replaceAll(newLinePattern, ' '),
      'assets/appsemblerc.schema.json',
      `\`${interfaceProp.name}\` description should be the same as in \`packages/types/cli.ts\``,
      'packages/cli',
    );
  }
}

export async function handler(): Promise<void> {
  const results: Result[] = [];
  const paths = await getWorkspaces(process.cwd());
  const allWorkspaces: Workspace[] = await Promise.all(
    paths.map(async (dir) => ({
      dir,
      pkg: await fsExtra.readJson(join(dir, 'package.json')),
    })),
  );

  await validateContext(
    (pass, filename, message, workspace) =>
      results.push({
        filename,
        message,
        pass,
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        workspace: { dir: workspace, pkg: '' as unknown as PackageJson },
      }),
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    paths.find((path) => path.endsWith('types')),
    paths.find((path) => path.endsWith('cli')),
  );

  const workspaces = allWorkspaces
    .filter(({ pkg }) => !(pkg.name ?? '').startsWith('@types/'))
    .sort((a, b) => a.dir.localeCompare(b.dir));

  const latestVersion = semver.maxSatisfying(
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    workspaces.map(({ pkg }) => pkg.version),
    '*',
    { includePrerelease: true },
  );

  for (const workspace of workspaces) {
    await validate(
      (pass, filename, message) => results.push({ filename, message, pass, workspace }),
      workspace,
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      latestVersion,
    );
  }

  await validateTranslations((pass, filename, message, workspace = '') =>
    results.push({
      filename,
      message,
      pass,
      workspace: { dir: workspace, pkg: '' as unknown as PackageJson },
    }),
  );

  const valid = results.filter(({ pass }) => pass);
  const invalid = results.filter(({ pass }) => !pass);

  for (const { filename, message, workspace } of valid) {
    logger.info(`✔️  ${relative(process.cwd(), join(workspace.dir, filename))}: ${message}`);
  }
  for (const { filename, message, workspace } of invalid) {
    logger.error(`❌ ${relative(process.cwd(), join(workspace.dir, filename))}: ${message}`);
    process.exitCode = 1;
  }

  if (invalid.some((r) => r.filename.startsWith('i18n'))) {
    logger.info('Please use `npm run scripts -- extract-messages` to resolve the issue(s).');
  }
}
