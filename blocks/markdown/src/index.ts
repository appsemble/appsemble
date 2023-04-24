import { bootstrap, type Parameters, type Utils } from '@appsemble/sdk';
import rehypeDomStringify from 'rehype-dom-stringify';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import style from './index.module.css';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize)
  .use(rehypeDomStringify);

function populateNode(
  node: HTMLDivElement,
  remap: Utils['remap'],
  data: any,
  { alignment = 'left', centered, content }: Parameters,
): void {
  // eslint-disable-next-line no-param-reassign
  node.className = 'content px-3 py-3';
  if (centered) {
    node.classList.add('mx-auto');
  }
  switch (alignment) {
    case 'center':
      node.classList.add('has-text-centered');
      break;
    case 'right':
      node.classList.add('has-text-right');
      break;
    default:
      node.classList.add('has-text-left');
  }
  const value = remap(content, data);
  if (typeof value === 'string') {
    // eslint-disable-next-line no-param-reassign
    node.innerHTML = String(processor.processSync(value));
  } else if (value != null) {
    // eslint-disable-next-line no-param-reassign
    node.innerHTML = JSON.stringify(value);
  }
}

bootstrap(({ data, events, parameters, path, utils }) => {
  const node = document.createElement('div');
  node.dataset.path = path;
  const shouldWait = events.on.data((d) => {
    populateNode(node, utils.remap, d, parameters);
  });

  if (shouldWait) {
    node.classList.add(style.loader, 'appsemble-loader');
  } else {
    populateNode(node, utils.remap, data, parameters);
  }

  return node;
});
