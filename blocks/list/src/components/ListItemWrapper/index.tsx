import { type BootstrapParams } from '@appsemble/sdk';
import { type JSX, type VNode } from 'preact';

import { type Item } from '../../../block.js';

type ListItemWrapperProps = {
  readonly actions: BootstrapParams['actions'];
  readonly item: Item;
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
