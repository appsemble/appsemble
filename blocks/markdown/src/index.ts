import { attach } from '@appsemble/sdk';
import marked from 'marked';

/**
 * @param {Object} block The block as it was specified by the app creator.
 */
attach(({ parameters: { content }, utils }) => {
  const markdown = document.createElement('div');
  markdown.classList.add('content', 'mx-3', 'my-3');
  markdown.innerHTML = marked(utils.remap(content, {}));

  return markdown;
});
