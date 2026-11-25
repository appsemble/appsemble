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
    parameters: { content, placeholders, styles = {} },
    shadowRoot,
    utils: { asset, remap },
  }) => {
    const { body, head } = parser.parseFromString(content, 'text/html');

    const contentNodes = body.querySelectorAll<HTMLElement>('[data-content]');
    const assetNodes = body.querySelectorAll<HTMLElement>('[data-asset]');
    const clickNodes = body.querySelectorAll<HTMLElement>('[data-click]');
    const styleNodes = body.querySelectorAll<HTMLElement>('[data-style]');

    function updateData(value: any): void {
      // @ts-expect-error strictNullCheck
      populateContentNodes(contentNodes, value, placeholders, remap);
      for (const styleNode of styleNodes) {
        const styleName = styleNode.dataset.style;
        if (styleName && has(styles, styleName)) {
          for (const [property, mapper] of Object.entries(styles[styleName])) {
            styleNode.style.setProperty(property, String(remap(mapper, value) ?? ''));
          }
        }
      }
    }

    events.on.data(updateData);
    updateData(data);

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
