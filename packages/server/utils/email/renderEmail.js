import fs from 'fs-extra';
import yaml from 'js-yaml';
import path from 'path';
import rehypeDocument from 'rehype-document';
import rehypeStringify from 'rehype-stringify';
import frontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkStringify from 'remark-stringify';
import unified from 'unified';
import visit from 'unist-util-visit';

export const templateDir = path.resolve(__dirname, '../../templates/email');

const remark = unified()
  .use(remarkParse)
  .use(frontmatter)
  .use(remarkStringify)
  .freeze();

const rehype = unified()
  .use(remarkRehype)
  .use(rehypeDocument)
  .use(rehypeStringify)
  .freeze();

/**
 * Render a markdown email template.
 *
 * @param {string} templateName The name of the template to render.
 * @param {Object} values Values to pass to the template for rendering.
 *
 * @returns {Object} An object which consists of the following properties:
 *
 * - `text`: The (markdown) text content of the email.
 * - `html`: The markdown content rendered to HTML.
 * - `subject`: The subject of the email.
 */
export default async function renderEmail(templateName, values) {
  const template = await fs.readFile(path.join(templateDir, `${templateName}.md`), 'utf-8');
  let subject;
  const mdast = await remark.parse(template);

  function replace(match, key) {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return values[key];
    }
    throw new Error(`Unknown template value: ${key}`);
  }

  visit(mdast, 'link', node => {
    // eslint-disable-next-line no-param-reassign
    node.url = node.url.replace(/{{(\w+)}}/, replace);
  });
  visit(mdast, 'inlineCode', (node, index, parent) => {
    parent.children.splice(index, 1, {
      type: 'text',
      value: node.value.replace(/{{(\w+)}}/, replace),
    });
  });
  visit(mdast, 'yaml', (node, index, parent) => {
    ({ subject } = yaml.safeLoad(node.value));
    parent.children.splice(index, 1);
  });

  const text = await remark.stringify(mdast);
  const html = await rehype.stringify(await rehype.run(mdast, { stem: subject }));
  return { html, subject, text };
}
