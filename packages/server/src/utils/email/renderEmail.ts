import yaml from 'js-yaml';
import type { InlineCode, Link, Parent } from 'mdast';
import rehypeDocument from 'rehype-document';
import rehypeStringify from 'rehype-stringify';
import frontmatter, { YamlNode } from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkStringify from 'remark-stringify';
import unified from 'unified';
import visit from 'unist-util-visit';

const remark = unified().use(remarkParse).use(frontmatter).use(remarkStringify).freeze();

const rehype = unified().use(remarkRehype).use(rehypeDocument).use(rehypeStringify).freeze();

interface Email {
  html: string;
  subject: string;
  text: string;
}

/**
 * Render a markdown email.
 *
 * @param template The body of the template to render.
 * @param values Values to pass to the template for rendering.
 * @param sub - The subject of the email to send. If omitted, this is extracted from the markdown
 * email body.
 * @returns An email object that may be sent.
 */
export default async function renderEmail(
  template: string,
  values: { [key: string]: string },
  sub?: string,
): Promise<Email> {
  let subject = sub;
  const mdast = await remark.parse(template);

  function replace(_match: string, key: string): string {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return values[key];
    }
    throw new Error(`Unknown template value: ${key}`);
  }

  visit<Link>(mdast, 'link', (node) => {
    // eslint-disable-next-line no-param-reassign
    node.url = node.url.replace(/\/{{(\w+)}}/, replace);
  });
  visit<InlineCode>(mdast, 'inlineCode', (node, index, parent: Parent) => {
    parent.children.splice(index, 1, {
      type: 'text',
      value: node.value.replace(/{{(\w+)}}/, replace),
    });
  });

  if (!sub) {
    visit<YamlNode>(mdast, 'yaml', (node, index, parent: Parent) => {
      ({ subject } = yaml.safeLoad(node.value) as Email);
      parent.children.splice(index, 1);
    });
  }

  const text = await remark.stringify(mdast);
  const html = await rehype.stringify(await rehype.run(mdast, { stem: subject }));
  return { html, subject, text };
}
