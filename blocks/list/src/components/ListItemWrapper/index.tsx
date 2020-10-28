import { BootstrapParams } from '@appsemble/sdk';
import { h, VNode } from 'preact';

import { Item } from '../../../block';

type ListItemWrapperProps = (
  | h.JSX.HTMLAttributes<HTMLButtonElement>
  | h.JSX.HTMLAttributes<HTMLAnchorElement>
) & {
  actions: BootstrapParams['actions'];
  item: Item;
};

export function ListItemWrapper({
  actions,
  children,
  item,
  ...props
}: ListItemWrapperProps): VNode {
  return actions.onClick.type === 'link' ? (
    <a href={actions.onClick.href(item)} {...(props as h.JSX.HTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ) : (
    <button type="button" {...(props as h.JSX.HTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
