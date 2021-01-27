import { Action, LinkAction } from '@appsemble/sdk';
import { JSX, VNode } from 'preact';

type ButtonWrapperProps = Omit<
  JSX.HTMLAttributes<HTMLAnchorElement> | JSX.HTMLAttributes<HTMLButtonElement>,
  'action'
> & {
  action: Action;
};

export function ButtonWrapper({ action, children, ...props }: ButtonWrapperProps): VNode {
  return action.type === 'link' ? (
    <a href={(action as LinkAction).href()} {...(props as JSX.HTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ) : (
    <button type="button" {...(props as JSX.HTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
