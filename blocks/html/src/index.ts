import { bootstrap, type Remapper } from '@appsemble/sdk';
import { has } from '@appsemble/utils';

const parser = new DOMParser();

function populateContentNodes(
  nodes: NodeListOf<HTMLElement>,
  data: any,
  placeholders: Record<string, Remapper>,
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
): void {
  for (const contentNode of nodes) {
    const placeholderName = contentNode.dataset.content;
    if (placeholderName && has(placeholders, placeholderName)) {
      contentNode.textContent = remap(placeholders[placeholderName], data);
    }
  }
}

bootstrap(
  ({
    actions,
    data,
    events,
    parameters: { content, placeholders },
    shadowRoot,
    utils: { asset, remap },
  }) => {
    const { body, head } = parser.parseFromString(content, 'text/html');

    const contentNodes = body.querySelectorAll<HTMLElement>('[data-content]');
    const assetNodes = body.querySelectorAll<HTMLElement>('[data-asset]');
    const clickNodes = body.querySelectorAll<HTMLElement>('[data-click]');

    // @ts-expect-error strictNullCheck
    events.on.data((d) => populateContentNodes(contentNodes, d, placeholders, remap));
    // @ts-expect-error strictNullCheck
    populateContentNodes(contentNodes, data, placeholders, remap);

    for (const assetNode of assetNodes) {
      const assetId = assetNode.dataset.asset;
      assetNode.setAttribute('src', assetId ? asset(assetId) : '#');
    }

    for (const clickNode of clickNodes) {
      const { click } = clickNode.dataset;
      if (!click || !has(actions, click)) {
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
