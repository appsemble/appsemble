import { type BulmaColor } from '@appsemble/types';
import { messageIcons } from '@appsemble/web-utils';
import classNames from 'classnames';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { Icon } from '../index.js';

interface MessageProps {
  /**
   * The message content.
   */
  readonly children: VNode;

  /**
   * Additional class names to assign to the message element.
   */
  readonly className?: string;

  /**
   * The message type.
   */
  readonly color?: BulmaColor;

  /**
   * An optional header for the message.
   */
  readonly header?: VNode;
}

export function Message({ children, className, color, header }: MessageProps): VNode {
  const icon = color ? messageIcons[color] : undefined;

  return (
    <div
      className={classNames('message', className, { [`is-${color}`]: color })}
      data-testid="message-comp"
    >
      {header ? <h6 className="message-header">{header}</h6> : null}
      <div className={classNames('message-body', { [styles.body]: icon })}>
        {icon ? (
          <>
            <Icon className={styles.icon} icon={icon} />
            <div className={styles.content}>{children}</div>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
