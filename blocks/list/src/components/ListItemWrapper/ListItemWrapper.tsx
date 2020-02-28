/** @jsx h */
import { Actions } from '@appsemble/sdk';
import { Actions as BlockActions, Item } from 'blocks/list/block';
import { h, VNode } from 'preact';

type ListItemWrapperProps = (
  | h.JSX.HTMLAttributes<HTMLButtonElement>
  | h.JSX.HTMLAttributes<HTMLAnchorElement>
) & {
  actions: Actions<BlockActions>;
  item: Item;
};

export default function ListItemWrapper({
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
