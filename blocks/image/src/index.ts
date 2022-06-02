import { bootstrap } from '@appsemble/sdk';

/**
 * @param {Object} actions - Prepared actions the block can dispatch.
 * @param {Object} data - The data that was somehow passed into the block. I.e. data passed in from
 * another block.
 * @param {Object} events - Event related functions and constants.
 * @param {Object} pageParameters - Parameters that the app creator defined in the app definition.
 * @param {Object} utils - Some utility functions provided by the Appsemble framework.
 */

bootstrap(({ data, parameters: { alignment, alt, rounded, url }, utils }) => {
  const node = document.createElement('figure');
  const image = document.createElement('img');
  node.append(image);

  node.classList.add('image');

  if (rounded) {
    image.classList.add('is-rounded');
  }
  image.alt = utils.remap(alt, data) as string;
  image.src = utils.remap(url, data) as string;

  const wrapper = document.createElement('div');
  wrapper.append(node);
  wrapper.classList.add('is-flex');

  if (alignment) {
    wrapper.classList.add(`is-justify-content-${alignment}`);
  } else {
    wrapper.classList.add('is-justify-content-left');
  }

  return wrapper;
});
