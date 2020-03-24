import * as fs from 'fs-extra';
import * as postcss from 'postcss';
import * as postcssImport from 'postcss-import';
import * as postcssrc from 'postcss-load-config';
import * as postcssUrl from 'postcss-url';

/**
 * Verifies and processes a CSS file using PostCSS.
 *
 * @param path Filepath of the CSS file
 */
export default async function processCss(path: string): Promise<string> {
  const data = await fs.readFile(path, 'utf8');

  const postcssConfig = await postcssrc();
  const postCss = postcss(postcssConfig.plugins);
  postCss.use(postcssUrl({ url: 'inline' }));
  postCss.use(postcssImport({ plugins: postCss.plugins }));

  const { css } = await postCss.process(data, { from: path, to: null });
  return css;
}
