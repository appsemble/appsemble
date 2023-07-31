import { type Action } from '@appsemble/sdk';
import { type ComponentChildren, type VNode } from 'preact';

import styles from './index.module.css';

export interface CardProps {
  readonly onAvatarClick: (event: Event) => void;
  readonly action: Action;
  readonly children: ComponentChildren;
}

export function AvatarWrapper({ action, children, onAvatarClick }: CardProps): VNode {
  return action.type === 'link' ? (
    <a
      className={`media-left px-0 py-0 ${styles.avatar}`}
      href={action.href()}
      onClick={onAvatarClick}
    >
      {children}
    </a>
  ) : (
    <button
      className={`media-left px-0 py-0 ${styles.avatar}`}
      onClick={onAvatarClick}
      type="button"
    >
      {children}
    </button>
  );
}
