import { attach } from '@appsemble/sdk';

/**
 * @param {Object} actions Prepared actions the block can dispatch.
 * @param {Object} block The block as it was specified by the app creator.
 * @param {Object} data The data that was somehow passed into the block. I.e. data passed in from
 *   another block.
 * @param {Object} pageParameters Parameters that the app creator defined in the app definition.
 * @param {Object} utils Some utility functions provided by the Appsemble framework.
 */
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
