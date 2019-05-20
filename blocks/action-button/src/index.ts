import { attach } from '@appsemble/sdk';
import './index.css';

interface BlockActions {
  click: {};
}

attach<{}, BlockActions>(({ actions }) => {
  let node;
  if (actions.click.type === 'link') {
    node = document.createElement('a');
    node.href = actions.click.href();
  } else {
    node = document.createElement('button');
    node.type = 'button';
  }
  node.classList.add('fas', 'fa-plus');
  node.addEventListener(
    'click',
    event => {
      event.preventDefault();
      actions.click.dispatch();
    },
    true,
  );
  return node;
});
