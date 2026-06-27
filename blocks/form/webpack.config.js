import { fileURLToPath } from 'node:url';

import createWebpackConfig from '@appsemble/webpack-config';

export default function createFormWebpackConfig(buildConfig, options) {
  const config = createWebpackConfig(buildConfig, options);

  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve?.alias,
      '@codemirror/language-data': fileURLToPath(
        new URL('src/components/MarkdownInput/emptyLanguageData.ts', import.meta.url),
      ),
    },
  };

  return config;
}
