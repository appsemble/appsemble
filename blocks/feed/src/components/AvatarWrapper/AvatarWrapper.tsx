/** @jsx h */
import { Action } from '@appsemble/sdk';
import { ComponentChildren, h, VNode } from 'preact';

import styles from './AvatarWrapper.css';

export interface CardProps {
  onAvatarClick: (event: Event) => void;
  action: Action;
  children: ComponentChildren;
}

export default function AvatarWrapper({ action, children, onAvatarClick }: CardProps): VNode {
  return action.type === 'link' ? (
    <a className={`media-left ${styles.avatar}`} href={action.href()} onClick={onAvatarClick}>
      {children}
    </a>
  ) : (
    <button className={`media-left ${styles.avatar}`} onClick={onAvatarClick} type="button">
      {children}
    </button>
  );
}
