import { Action } from '@appsemble/sdk';
import React from 'react';

import styles from './AvatarWrapper.css';

export interface CardProps {
  onAvatarClick: React.MouseEventHandler<HTMLElement>;
  action: Action;
}

export default class AvatarWrapper extends React.Component<CardProps> {
  render(): React.ReactNode {
    const { action, children, onAvatarClick } = this.props;

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
}
