import { bootstrap, Parameters, Remapper } from '@appsemble/sdk';
import marked from 'marked';

import style from './index.module.css';

function populateNode(
  node: HTMLDivElement,
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
  data: any,
  { centered, content }: Parameters,
): void {
  // eslint-disable-next-line no-param-reassign
  node.className = `content px-3 py-3 ${centered ? 'has-text-centered mx-auto' : ''}`;
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
bootstrap(({ data, events, parameters, utils }) => {
  const node = document.createElement('div');
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
