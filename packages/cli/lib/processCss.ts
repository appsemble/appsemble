import { readFile } from 'node:fs/promises';

import postcss from 'postcss';
import postcssImport from 'postcss-import';
import postcssrc from 'postcss-load-config';
import postcssUrl from 'postcss-url';

/**
 * Verifies and processes a CSS file using PostCSS.
 *
 * @param path Filepath of the CSS file
 * @returns Processed CSS files concatenated into a single value.
 */
export async function processCss(path: string): Promise<string> {
  const data = await readFile(path, 'utf8');

  const postcssConfig = await postcssrc();
  const postCss = postcss(postcssConfig.plugins);
  postCss.use(postcssUrl({ url: 'inline' }));
  postCss.use(postcssImport({ plugins: postCss.plugins }));

  const { css } = await postCss.process(data, { from: path, to: undefined });
  return css;
}
