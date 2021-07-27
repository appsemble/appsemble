import { bootstrap } from '@appsemble/sdk';
import marked from 'marked';

/**
 * @param {Object} block - The block as it was specified by the app creator.
 */
bootstrap(({ data, parameters: { content }, utils }) => {
  const markdown = document.createElement('div');
  markdown.classList.add('content', 'px-3', 'py-3');
  const value = utils.remap(content, data);

  if (typeof value === 'string') {
    markdown.textContent = marked(value);
  } else if (value != null) {
    markdown.textContent = JSON.stringify(value);
  }

  return markdown;
});
