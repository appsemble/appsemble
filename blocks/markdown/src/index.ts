import { attach } from '@appsemble/sdk';
import marked from 'marked';

import styles from './style.css';

/**
 * @param {Object} block The block as it was specified by the app creator.
 */
attach(({ parameters: { content } }) => {
  const markdown = document.createElement('div');
  markdown.classList.add('content', styles.markdownContainer);
  markdown.innerHTML = marked(content);

  return markdown;
});
