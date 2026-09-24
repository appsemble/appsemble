import { type BulmaColor } from '@appsemble/types';
import { getMessageIcon } from '@appsemble/web-utils';
import classNames from 'classnames';
import { type ReactNode } from 'react';

import styles from './index.module.css';
import { Icon } from '../index.js';

interface MessageProps {
  /**
   * The message content.
   */
  readonly children: ReactNode;

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
  readonly header?: ReactNode;

  /**
   * The live region role, so assistive technology announces the message.
   *
   * `alert` interrupts the user and is announced when the message is inserted. `status` is
   * announced politely when the content of an already rendered message changes.
   */
  readonly role?: 'alert' | 'status';
}

export function Message({ children, className, color, header, role }: MessageProps): ReactNode {
  const icon = getMessageIcon(color);

  return (
    <div className={classNames('message', className, { [`is-${color}`]: color })} role={role}>
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
