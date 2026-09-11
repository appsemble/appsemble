import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ensureDir } from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyAppVariant } from './app.js';

describe('applyAppVariant', () => {
  let dir: string;
  let appPath: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'appsemble-variant-'));
    appPath = join(dir, 'app');
    await ensureDir(join(appPath, 'theme', 'core'));
    await ensureDir(join(appPath, 'variants', 'tux', 'patches'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('should apply style patches that carry !important as a declaration flag', async () => {
    await writeFile(
      join(appPath, 'theme', 'core', 'index.css'),
      `.flagged { color: rgb(0 0 0) !important; }
.plain { color: rgb(0 0 0); }
.kept { color: rgb(0 0 0) !important; }
.commented { color: rgb(0 0 0) !important; }
.escaped { --value: initial; }
`,
    );
    await writeFile(
      join(appPath, 'variants', 'tux', 'patches', 'styles.json'),
      JSON.stringify({
        core: {
          'index.css': [
            { selector: '.flagged', property: 'color', value: 'rgb(1 2 3) !important' },
            { selector: '.plain', property: 'color', value: 'rgb(4 5 6) !important;' },
            { selector: '.kept', property: 'color', value: 'rgb(7 8 9)' },
            {
              selector: '.commented',
              property: 'color',
              value: 'rgb(10 11 12) !important /* Preserve priority */;',
            },
            { selector: '.escaped', property: '--value', value: String.raw`foo\;;` },
          ],
        },
      }),
    );

    await applyAppVariant(appPath, 'tux');

    const css = await readFile(join(dir, 'app-tux', 'theme', 'core', 'index.css'), 'utf8');
    expect(css).toBe(
      '.flagged{color:rgb(1 2 3)!important}.plain{color:rgb(4 5 6)!important}.kept{color:rgb(7 8 9)!important}.commented{color:rgb(10 11 12)!important}.escaped{--value:foo\\;}',
    );
  });
});
