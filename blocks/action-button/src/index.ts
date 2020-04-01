import './index.css';

import { attach } from '@appsemble/sdk';

attach(({ actions, data, parameters: { icon } }) => {
  let node;
  if (actions.onClick.type === 'link') {
    node = document.createElement('a');
    node.href = actions.onClick.href(data);
  } else {
    node = document.createElement('button');
    node.type = 'button';
  }
  node.classList.add('fas', `fa-${icon}`);
  node.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      actions.onClick.dispatch(data);
    },
    true,
  );
  return node;
});
