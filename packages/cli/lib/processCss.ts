import { readFile } from 'node:fs/promises';

import postcss, { type AcceptedPlugin } from 'postcss';
import postcssImport from 'postcss-import';
import postcssrc from 'postcss-load-config';
import postcssPresetEnv from 'postcss-preset-env';
import postcssUrl from 'postcss-url';

/**
 * Load the PostCSS plugins to process app CSS with.
 *
 * The PostCSS config of the project is used if it has one. Otherwise the CSS is processed with the
 * Appsemble CLI's default PostCSS preset.
 *
 * @returns The PostCSS plugins to use.
 */
async function loadPlugins(): Promise<AcceptedPlugin[]> {
  try {
    const { plugins } = await postcssrc();
    return plugins;
  } catch (error: unknown) {
    if (!(error as Error).message?.startsWith('No PostCSS Config found')) {
      throw error;
    }
    return [postcssPresetEnv({ stage: 0 })];
  }
}

/**
 * Verifies and processes a CSS file using PostCSS.
 *
 * @param path Filepath of the CSS file
 * @returns Processed CSS files concatenated into a single value.
 */
export async function processCss(path: string): Promise<string> {
  const data = await readFile(path, 'utf8');

  const postCss = postcss(await loadPlugins());
  postCss.use(postcssUrl({ url: 'inline' }));
  postCss.use(postcssImport({ plugins: postCss.plugins }));

  const { css } = await postCss.process(data, { from: path, to: undefined });
  return css;
}
