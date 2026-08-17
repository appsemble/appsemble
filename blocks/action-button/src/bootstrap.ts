import { type BootstrapParams } from '@appsemble/sdk';

export function ActionButton({
  actions,
  data,
  parameters: { icon, title },
  utils: { fa, remap },
}: BootstrapParams): HTMLAnchorElement | HTMLButtonElement {
  let node;
  const iconNode = document.createElement('i');
  iconNode.className = fa(icon);
  if (actions.onClick.type === 'link') {
    node = document.createElement('a');
    node.href = actions.onClick.href(data);
  } else {
    node = document.createElement('button');
    node.type = 'button';
  }
  node.classList.add('button', 'is-paddingless', 'is-primary', 'is-rounded');
  node.title = (remap(title, data) as string) ?? '';
  node.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      actions.onClick(data);
    },
    true,
  );
  node.append(iconNode);
  return node;
}
