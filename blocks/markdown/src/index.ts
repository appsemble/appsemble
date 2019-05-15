import { attach } from '@appsemble/sdk';
import marked from 'marked';

import styles from './style.css';

interface BlockParameters {
  content: string;
}

/**
 * @param {Object} block The block as it was specified by the app creator.
 */
attach(({ block }) => {
  const { content } = block.parameters as BlockParameters;

  const markdown = document.createElement('div');
  markdown.classList.add('content', styles.markdownContainer);
  markdown.innerHTML = marked(content);

  return markdown;
});
