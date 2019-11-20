import './index.css';

import { attach } from '@appsemble/sdk';

import { Actions, Parameters } from '../block';

attach<Parameters, Actions>(({ actions, data, block }) => {
  let node;
  if (actions.onClick.type === 'link') {
    node = document.createElement('a');
    node.href = actions.onClick.href(data);
  } else {
    node = document.createElement('button');
    node.type = 'button';
  }
  node.classList.add('fas', `fa-${block.parameters.icon}`);
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
