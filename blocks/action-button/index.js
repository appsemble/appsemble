import '@fortawesome/fontawesome-free/css/all.css';
import { attach } from '@appsemble/sdk';
import './index.css';
import './amsterdam.css';

attach(({ actions }) => {
  let node;
  if (actions.click.type === 'link') {
    node = document.createElement('a');
    node.href = actions.click.href();
  } else {
    node = document.createElement('button');
    node.type = 'button';
  }
  // Add the svg icon instead auto size.
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
