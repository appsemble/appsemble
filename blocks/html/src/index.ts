import { bootstrap } from '@appsemble/sdk';
import { has } from '@appsemble/utils';

const parser = new DOMParser();

bootstrap(
  ({
    actions,
    data,
    parameters: { content, placeholders },
    shadowRoot,
    utils: { asset, remap },
  }) => {
    const { body, head } = parser.parseFromString(content, 'text/html');

    const contentNodes = body.querySelectorAll<HTMLElement>('[data-content]');
    const assetNodes = body.querySelectorAll<HTMLElement>('[data-asset]');
    const clickNodes = body.querySelectorAll<HTMLElement>('[data-click]');

    for (const contentNode of contentNodes) {
      const placeholderName = contentNode.dataset.content;
      if (has(placeholders, placeholderName)) {
        contentNode.textContent = remap(placeholders[placeholderName], data);
      }
    }

    for (const assetNode of assetNodes) {
      const assetId = assetNode.dataset.asset;
      assetNode.setAttribute('src', asset(assetId));
    }

    for (const clickNode of clickNodes) {
      const { click } = clickNode.dataset;
      if (!has(actions, click)) {
        continue;
      }

      const action = actions[click];
      if (clickNode.tagName === 'A' && action.type === 'link') {
        (clickNode as HTMLAnchorElement).href = action.href(data);
      }

      clickNode.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          action(data);
        },
        false,
      );
    }

    shadowRoot.append(...head.getElementsByTagName('style'), ...body.children);
  },
);
