import fs from 'fs-extra';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import postcssrc from 'postcss-load-config';
import postcssUrl from 'postcss-url';

/**
 * Verifies and processes a CSS file using PostCSS.
 *
 * @param {string} path Filepath of the CSS file
 */
export default async function processCss(path) {
  const data = await fs.readFile(path, 'utf8');

  const postcssConfig = await postcssrc();
  const postCss = postcss(postcssConfig);
  postCss.use(postcssUrl({ url: 'inline' }));
  postCss.use(postcssImport({ plugins: postCss.plugins }));

  const { css } = await postCss.process(data, { from: path, to: null });
  return css;
}
