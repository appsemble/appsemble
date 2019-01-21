import { attach } from '@appsemble/sdk';

import style from './index.css';

attach(async ({ actions, block }) => {
  const data = await actions.load.dispatch();
  const list = document.createElement('ul');

  data.forEach(item => {
    const li = document.createElement('li');
    li.classList.add(style.listBlockItem);

    const button = document.createElement('button');
    button.classList.add('button');
    button.innerText = item[block.parameters.title];
    button.onclick = event => {
      event.preventDefault();
      actions.click.dispatch(item);
    };

    li.appendChild(button);
    list.appendChild(li);
  });

  return list;
});
