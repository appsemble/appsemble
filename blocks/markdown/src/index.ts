import { bootstrap, Remapper } from '@appsemble/sdk';
import marked from 'marked';

import style from './index.module.css';

function populateNode(
  node: HTMLDivElement,
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
  data: any,
  content: Remapper,
): void {
  // eslint-disable-next-line no-param-reassign
  node.className = 'content px-3 py-3';
  const value = remap(content, data);
  if (typeof value === 'string') {
    // eslint-disable-next-line no-param-reassign
    node.innerHTML = marked(value);
  } else if (value != null) {
    // eslint-disable-next-line no-param-reassign
    node.innerHTML = JSON.stringify(value);
  }
}

/**
 * @param {Object} block - The block as it was specified by the app creator.
 */
bootstrap(({ data, events, parameters: { content }, utils }) => {
  const node = document.createElement('div');
  const shouldWait = events.on.data((d) => {
    populateNode(node, utils.remap, d, content);
  });

  if (shouldWait) {
    node.classList.add(style.loader, 'appsemble-loader');
  } else {
    populateNode(node, utils.remap, data, content);
  }

  return node;
});
