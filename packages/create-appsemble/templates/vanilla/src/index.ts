import { bootstrap } from '@appsemble/sdk';

/**
 * @param {Object} actions Prepared actions the block can dispatch.
 * @param {Object} data The data that was somehow passed into the block. I.e. data passed in from
 * another block.
 * @param {Object} events Event related functions and constants.
 * @param {Object} pageParameters Parameters that the app creator defined in the app definition.
 * @param {Object} utils Some utility functions provided by the Appsemble framework.
 */
bootstrap(({ actions, data, events, pageParameters, shadowRoot, utils }) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Click me!';
  button.classList.add('button');
  button.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      actions.onClick();
    },
    true,
  );
  return button;
});
