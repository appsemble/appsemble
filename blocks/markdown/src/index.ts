import { bootstrap } from '@appsemble/sdk';
import marked from 'marked';

/**
 * @param {Object} block - The block as it was specified by the app creator.
 */
bootstrap(({ parameters: { content }, utils }) => {
  const markdown = document.createElement('div');
  markdown.classList.add('content', 'px-3', 'py-3');
  markdown.innerHTML = marked(utils.remap(content, {}));

  return markdown;
});
