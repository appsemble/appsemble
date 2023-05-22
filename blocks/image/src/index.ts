import { bootstrap } from '@appsemble/sdk';

bootstrap(({ data, parameters: { alignment, alt, height, rounded, url, width }, utils }) => {
  const node = document.createElement('figure');
  const image = document.createElement('img');
  node.append(image);

  node.classList.add('image');

  if (rounded) {
    image.classList.add('is-rounded');
  }
  image.alt = utils.remap(alt, data) as string;
  image.src = utils.remap(url, data) as string;

  if (height) {
    image.style.height = `${height}px`;
  }

  if (width) {
    image.style.width = `${width}px`;
  }

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
