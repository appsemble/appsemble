import type { Action, LinkAction } from '@appsemble/sdk';
import { h, VNode } from 'preact';

type ButtonWrapperProps = Omit<
  h.JSX.HTMLAttributes<HTMLButtonElement> | h.JSX.HTMLAttributes<HTMLAnchorElement>,
  'action'
> & {
  action: Action;
};

export function ButtonWrapper({ action, children, ...props }: ButtonWrapperProps): VNode {
  return action.type === 'link' ? (
    <a href={(action as LinkAction).href()} {...(props as h.JSX.HTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ) : (
    <button type="button" {...(props as h.JSX.HTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
