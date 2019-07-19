import './index.css';

import { attach } from '@appsemble/sdk';

interface BlockActions {
  onClick: {};
}

attach<{}, BlockActions>(({ actions, data }) => {
  let node;
  if (actions.onClick.type === 'link') {
    node = document.createElement('a');
    node.href = actions.onClick.href();
  } else {
    node = document.createElement('button');
    node.type = 'button';
  }
  node.classList.add('fas', 'fa-plus');
  node.addEventListener(
    'click',
    event => {
      event.preventDefault();
      actions.onClick.dispatch(data);
    },
    true,
  );
  return node;
});
