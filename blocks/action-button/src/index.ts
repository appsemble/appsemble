import './index.css';

import { attach } from '@appsemble/sdk';

attach(({ actions, data, parameters: { icon } }) => {
  let node;
  const iconNode = document.createElement('i');
  iconNode.classList.add('fas', `fa-${icon}`);
  if (actions.onClick.type === 'link') {
    node = document.createElement('a');
    node.href = actions.onClick.href(data);
  } else {
    node = document.createElement('button');
    node.type = 'button';
  }
  node.classList.add('button', 'is-paddingless', 'is-primary', 'is-rounded');
  node.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      actions.onClick.dispatch(data);
    },
    true,
  );
  node.append(iconNode);
  return node;
});
