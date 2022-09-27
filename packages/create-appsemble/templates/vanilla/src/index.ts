// `src/index.ts` is the initial entry poinf of the block source code run. For small blocks this
// often contains the entire logic of the block. Bigger blocks are often split into smaller modules.
import { bootstrap } from '@appsemble/sdk';

// The bootstrap function injects various properties that can be destructured. You can use your
// editor’s autocomplete to see which variables are available.
bootstrap(({ actions, utils }) => {
  const button = document.createElement('button');
  button.type = 'button';

  // Using utils.formatMessage we can provide internationalized messages.
  button.textContent = utils.formatMessage('label');

  // Bulma classes are supported. See https://bulma.io/documentation
  button.classList.add('button');

  button.addEventListener('click', (event) => {
    event.preventDefault();
    // This dispatches a user defined action.
    actions.onClick();
  });

  // If a DOM node is returned by the bootstrap function, it will be rendered in the shadow root.
  return button;
});
