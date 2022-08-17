import { BootstrapParams } from '@appsemble/sdk';
import { JSX, VNode } from 'preact';

import { Item } from '../../../block.js';

type ListItemWrapperProps = {
  actions: BootstrapParams['actions'];
  item: Item;
} & (JSX.HTMLAttributes<HTMLAnchorElement> | JSX.HTMLAttributes<HTMLButtonElement>);

export function ListItemWrapper({
  actions,
  children,
  item,
  ...props
}: ListItemWrapperProps): VNode {
  return actions.onClick.type === 'link' ? (
    <a href={actions.onClick.href(item)} {...(props as JSX.HTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ) : (
    <button type="button" {...(props as JSX.HTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
