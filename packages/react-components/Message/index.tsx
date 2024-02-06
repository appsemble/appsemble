import { type BulmaColor } from '@appsemble/types';
import classNames from 'classnames';
import { type ReactNode } from 'react';

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
}

export function Message({ children, className, color, header }: MessageProps): ReactNode {
  return (
    <div className={classNames('message', className, { [`is-${color}`]: color })}>
      {header ? <h6 className="message-header">{header}</h6> : null}
      <div className="message-body">{children}</div>
    </div>
  );
}
