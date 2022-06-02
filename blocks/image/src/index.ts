import { bootstrap } from '@appsemble/sdk';

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
