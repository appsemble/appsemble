import './index.css';

import { bootstrap } from '@appsemble/sdk';

bootstrap(({ actions, data, parameters: { icon }, utils: { fa } }) => {
  let node;
  const iconNode = document.createElement('i');
  iconNode.className = fa(icon);
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
      actions.onClick(data);
    },
    true,
  );

  node.append(iconNode);
  return node;
});
