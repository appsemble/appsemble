import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { processCss } from './processCss.js';

let tmpDir: string;
let originalCwd: string;

async function createProject(): Promise<string> {
  tmpDir = await mkdtemp(join(tmpdir(), 'appsemble-process-css-'));
  originalCwd = process.cwd();
  process.chdir(tmpDir);
  return tmpDir;
}

describe('processCss', () => {
  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tmpDir, { force: true, recursive: true });
  });

  it('should process CSS without a project PostCSS config', async () => {
    const dir = await createProject();
    const stylePath = join(dir, 'index.css');
    await writeFile(stylePath, 'a { color: oklch(40% 0.268735435 34.568626); }');

    const css = await processCss(stylePath);

    expect(css).toContain('color: rgb(');
    expect(css).toContain('@media (color-gamut: p3)');
  });

  it('should throw PostCSS config errors other than missing config', async () => {
    const dir = await createProject();
    const stylePath = join(dir, 'index.css');
    await writeFile(stylePath, 'a { color: red; }');
    await writeFile(
      join(dir, 'postcss.config.cjs'),
      'module.exports = () => { throw new Error("Invalid PostCSS config") }',
    );

    await expect(processCss(stylePath)).rejects.toThrow('Invalid PostCSS config');
  });
});
