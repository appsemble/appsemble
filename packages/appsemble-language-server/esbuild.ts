// eslint-disable-next-line import/no-extraneous-dependencies
import { build } from 'esbuild';
// eslint-disable-next-line import/no-extraneous-dependencies
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill';
// eslint-disable-next-line import/no-extraneous-dependencies
import esbuildShimPlugin from 'esbuild-shim-plugin';

console.log('Building appsemble-language-server webworker bundle ...');
await build({
  entryPoints: ['webworker/yamlServerMain.ts'],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  outfile: './build/worker.js',
  sourcemap: true,
  plugins: [nodeModulesPolyfillPlugin()],
  alias: {
    'vscode-json-languageservice/lib/umd': 'vscode-json-languageservice/lib/esm/',
  },
});
console.log('Built appsemble-language-server webworker bundle.');

console.log('Building appsemble-language-server node bundle ...');
await build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: './build/server.js',
  sourcemap: true,
  alias: {
    'vscode-json-languageservice/lib/umd': 'vscode-json-languageservice/lib/esm/',
  },
  mainFields: ['module', 'main'],
  plugins: [esbuildShimPlugin()],
});

console.log('Built appsemble-language-server node bundle.');
