import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill';
import esbuildShimPlugin from 'esbuild-shim-plugin';

const packageDir = dirname(fileURLToPath(import.meta.url));

console.log('Building appsemble-language-server webworker bundle ...');
await build({
  entryPoints: [join(packageDir, 'webworker/yamlServerMain.ts')],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  outfile: join(packageDir, 'build/worker.js'),
  sourcemap: true,
  plugins: [nodeModulesPolyfillPlugin()],
  alias: {
    'vscode-json-languageservice/lib/umd': 'vscode-json-languageservice/lib/esm/',
  },
});
console.log('Built appsemble-language-server webworker bundle.');

console.log('Building appsemble-language-server node bundle ...');
await build({
  entryPoints: [join(packageDir, 'server.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: join(packageDir, 'build/server.js'),
  sourcemap: true,
  alias: {
    'vscode-json-languageservice/lib/umd': 'vscode-json-languageservice/lib/esm/',
  },
  mainFields: ['module', 'main'],
  plugins: [esbuildShimPlugin()],
});

console.log('Built appsemble-language-server node bundle.');
