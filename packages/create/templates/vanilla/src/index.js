import { bootstrap } from '@appsemble/sdk';

bootstrap(({ actions }) => {
  const button = document.createElement('button');
  button.type = button;
  button.classList.add('fas', 'fa-plus');
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
