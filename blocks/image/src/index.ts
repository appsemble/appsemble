import { bootstrap } from '@appsemble/sdk';

bootstrap(
  ({ data, events, parameters: { alignment, alt, height, rounded, url, width }, utils }) => {
    const node = document.createElement('figure');
    const image = document.createElement('img');
    node.append(image);

    node.classList.add('image');

    if (rounded) {
      image.classList.add('is-rounded');
    }

    function setImage(d: unknown): void {
      const src = utils.remap(url, d);
      const img = src as string;

      image.alt = utils.remap(alt, data) as string;

      try {
        image.src = /^(https?:)?\/\//.test(img) ? img : utils.asset(img);
      } catch (error) {
        if (error instanceof TypeError || error instanceof DOMException) {
          image.src = img;
        }
      }
    }

    setImage(data);

    events.on.data((d) => {
      setImage(d);
    });

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
  },
);
