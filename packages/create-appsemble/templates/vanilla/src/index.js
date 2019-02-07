import { attach } from '@appsemble/sdk';

attach(({ actions, block, data, pageParameters, shadowRoot, utils }) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.innerText = 'Click me!';
  button.classList.add('button');
  button.addEventListener(
    'click',
    event => {
      event.preventDefault();
      actions.click.dispatch();
    },
    true,
  );
  return button;
});
