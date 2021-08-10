import { bootstrap } from '@appsemble/sdk';

bootstrap(({ actions, data, parameters: { content, placeholders }, utils: { asset, remap } }) => {
  const parser = new DOMParser();
  const node = parser.parseFromString(content, 'text/html');

  const contentNodes = node.querySelectorAll('[data-content]');
  const assetNodes = node.querySelectorAll(
    'img[data-asset], source[data-asset], video[data-asset], audio[data-asset]',
  );
  const clickNodes = node.querySelectorAll('a[data-click], input[data-click], button[data-click]');

  for (const contentNode of contentNodes) {
    const placeholderName = contentNode.getAttribute('data-content');
    contentNode.textContent = remap(placeholders[placeholderName], data);
  }

  for (const assetNode of assetNodes) {
    const assetId = assetNode.getAttribute('data-asset');
    assetNode.setAttribute('src', asset(assetId));
  }

  for (const clickNode of clickNodes) {
    const action = actions[clickNode.getAttribute('data-click')];
    (clickNode as HTMLButtonElement).onclick = () => action(data);
  }

  const result = document.createElement('div');
  // Returns <html> -> <body> -> children
  result.append(...node.firstElementChild.lastElementChild.children);
  return result;
});
