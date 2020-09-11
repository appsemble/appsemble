import { basename, dirname, join, relative } from 'path';

import { getWorkspaces, logger, opendirSafe } from '@appsemble/node-utils';
import type { Config } from '@jest/types';
import extractReactIntlMessages from 'extract-react-intl-messages/dist/extract-react-intl/index';
import { readJson } from 'fs-extra';
import { isEqual } from 'lodash';
import semver from 'semver';
import type { PackageJson } from 'type-fest';

export const command = 'validate';
export const description = 'Validate all workspaces have a proper configuration';

/**
 * A list of packages that are released without a scoped package name.
 */
const unscopedPackageNames = new Set(['appsemble', 'create-appsemble']);

/**
 * A representation of a yarn workspace.
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
 * @param assertion - Whether the assertion passed.
 * @param filename - On which file name the assertion applies.
 * @param message - A description of the assertion that was run.
 */
type Assert = (assertion: boolean, filename: string, message: string, workspace?: string) => void;

async function validateTranslations(assert: Assert): Promise<void> {
  const workspaces = ['app', 'react-components'];
  const locales = ['nl', 'en-US'];
  const defaultLocale = 'en-US';

  for (const workspace of workspaces) {
    const translatedMessages = await extractReactIntlMessages(
      locales,
      `./packages/${workspace}/src/**/messages.ts`,
      {
        format: 'json',
        flat: true,
        defaultLocale,
        overwriteDefault: true,
      },
    );

    const translated: string[] = [];

    await opendirSafe(`./packages/${workspace}/translations`, async (filepath, stat) => {
      if (stat.name === 'index.tsx') {
        return;
      }

      if (!stat.isFile() || !filepath.endsWith('.json')) {
        assert(false, filepath, 'should be a json file');
        return;
      }

      const [language] = stat.name.split('.json');

      if (!locales.includes(language)) {
        assert(false, filepath, `Language ${language} should be supported.`);
        return;
      }

      translated.push(language);
      const messages = await readJson(filepath);
      if (stat.name === `${defaultLocale}.json`) {
        assert(
          isEqual(messages, translatedMessages[language]),
          filepath,
          `${defaultLocale} messages should be equal when extracted`,
        );
      } else {
        assert(
          isEqual(Object.keys(messages), Object.keys(translatedMessages[language]).sort()),
          filepath,
          'Keys should be the same',
        );
        const untranslatedMessages = Object.values(messages).filter((message) => message === '');
        assert(untranslatedMessages.length === 0, filepath, 'Messages should be translated');
      }
    });

    assert(
      isEqual(locales.sort(), translated.sort()),
      '',
      'should have translations for each supported language',
      `packages\\${workspace}`,
    );
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
  const pkgNameMatch = pkg.name.match(/^(@(?<scope>[a-z-]+)\/)?(?<name>[a-z-]+)$/);
  assert(
    basename(dir) === pkgNameMatch?.groups.name,
    '',
    'Base directory should match package name',
  );
  assert(
    pkgNameMatch?.groups.scope === 'appsemble' ||
      unscopedPackageNames.has(pkgNameMatch?.groups.name),
    'package.json',
    'Name should use the @appsemble scope',
  );
  if (basename(dirname(dir)) !== 'blocks') {
    ['app', 'apps', 'framework', 'low-code', 'lowcode'].forEach((keyword) => {
      assert(
        pkg.keywords.includes(keyword),
        'package.json',
        `Keywords should at least contain ${keyword}`,
      );
    });
    assert(
      pkg.keywords.every((keyword, i) => !i || pkg.keywords[i - 1].localeCompare(keyword) < 0),
      'package.json',
      'Keywords should be sorted alphabetically',
    );
  }
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
    pkg.bugs === 'https://gitlab.com/appsemble/appsemble/issues',
    'package.json',
    'Bugs should be "https://gitlab.com/appsemble/appsemble/issues"',
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
    (pkg?.repository as any)?.directory === relative(process.cwd(), dir),
    'package.json',
    `Repository directory should be "${relative(process.cwd(), dir)}"`,
  );
  assert(
    pkg.license === 'LGPL-3.0-or-later',
    'package.json',
    'License should be "LGPL-3.0-or-later"',
  );
  assert(
    pkg.author === 'Appsemble <info@appsemble.com> (https://appsemble.com)',
    'package.json',
    'Author should be "Appsemble <info@appsemble.com> (https://appsemble.com)"',
  );
  assert(pkg.scripts?.test === 'jest', 'package.json', 'Test script should be "jest"');
  Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })
    .filter(([dep]) => dep.startsWith('@appsemble/'))
    .forEach(([, version]) => {
      assert(
        version === latestVersion,
        'package.json',
        `Dependencies on Appsemble packages should depend on exactly "${latestVersion}"`,
      );
    });

  /**
   * Validate tsconfig.json
   */
  const tsConfig = await readJson(join(dir, 'tsconfig.json')).catch(() => null);
  assert(tsConfig, 'tsconfig.json', 'The workspace should have a TypeScript configuration');
  if (tsConfig) {
    assert(
      tsConfig.extends === '../../tsconfig',
      'tsconfig.json',
      'Should extend "../../tsconfig"',
    );
    assert(
      isEqual(Object.keys(tsConfig), ['extends', 'compilerOptions']),
      'tsconfig.json',
      'Only specifies "extends" and "compilerOptions" with "extends" first',
    );
  }

  /**
   * Validate tsconfig.build.json
   */
  const tsConfigBuild = await readJson(join(dir, 'tsconfig.build.json')).catch(() => null);
  if (!pkg.private) {
    assert(tsConfigBuild, 'tsconfig.build.json', 'Public projects should have tsconfig.build.json');
  }
  if (tsConfigBuild) {
    assert(
      tsConfigBuild.extends === '../../tsconfig.build',
      'tsconfig.build.json',
      'Should extend "../../tsconfig.build"',
    );
    assert(
      tsConfigBuild.compilerOptions?.rootDir === 'src',
      'tsconfig.build.json',
      'Root dir should be set to "src"',
    );
    assert(
      isEqual(Object.keys(tsConfigBuild), ['extends', 'compilerOptions']),
      'tsconfig.build.json',
      'Only specifies "extends" and "compilerOptions" with "extends" first',
    );
  }

  /**
   * Validate jest.config.js
   */
  const jestConfig: Config.InitialOptions = await import(join(dir, 'jest.config')).catch(
    () => null,
  );
  assert(Boolean(jestConfig), 'jest.config.js', 'Projects should have a Jest configuration');
  if (jestConfig) {
    assert(jestConfig.clearMocks === true, 'jest.config.js', 'clearMocks should be true');
    assert(jestConfig.displayName === pkg.name, 'jest.config.js', `Display name be '${pkg.name}'`);
    assert(
      (jestConfig.globals?.['ts-jest'] as any).isolatedModules,
      'jest.config.js',
      "Global 'ts-jest'.isolatedModules should be true",
    );
    assert(
      jestConfig.moduleNameMapper?.[/@appsemble\/([\w-]+)/.source] === '@appsemble/$1/src',
      'jest.config.js',
      "Module name mapper [/@appsemble\\/([\\w-]+)/.source] should map to '@appsemble/$1/src'",
    );
    assert(jestConfig.preset === 'ts-jest', 'jest.config.js', "Preset should be 'ts-jest'");
    assert(jestConfig.resetMocks === true, 'jest.config.js', 'resetMocks should be true');
    assert(jestConfig.restoreMocks === true, 'jest.config.js', 'restoreMocks should be true');
  }
}

export async function handler(): Promise<void> {
  const results: Result[] = [];
  const paths = await getWorkspaces(process.cwd());
  const allWorkspaces: Workspace[] = await Promise.all(
    paths.map(async (dir) => ({
      dir,
      pkg: await readJson(join(dir, 'package.json')),
    })),
  );

  const workspaces = allWorkspaces
    .filter(({ pkg }) => !pkg.name.startsWith('@types/'))
    .sort((a, b) => a.dir.localeCompare(b.dir));

  const latestVersion = semver.maxSatisfying(
    workspaces.map(({ pkg }) => pkg.version),
    '*',
  );

  for (const workspace of workspaces) {
    await validate(
      (pass, filename, message) => results.push({ filename, message, pass, workspace }),
      workspace,
      latestVersion,
    );
  }

  await validateTranslations((pass, filename, message, workspace = '') =>
    results.push({
      filename,
      message,
      pass,
      workspace: { dir: workspace, pkg: ('' as unknown) as PackageJson },
    }),
  );

  const valid = results.filter(({ pass }) => pass);
  const invalid = results.filter(({ pass }) => !pass);

  valid.forEach(({ filename, message, workspace: { dir } }) => {
    logger.info(`✔️  ${relative(process.cwd(), join(dir, filename))}: ${message}`);
  });
  invalid.forEach(({ filename, message, workspace: { dir } }) => {
    logger.error(`❌ ${relative(process.cwd(), join(dir, filename))}: ${message}`);
    process.exitCode = 1;
  });
}
