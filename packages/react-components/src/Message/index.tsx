import { BulmaColor } from '@appsemble/sdk';
import classNames from 'classnames';
import { ReactElement, ReactNode } from 'react';

interface MessageProps {
  /**
   * The message content.
   */
  children: ReactNode;

  /**
   * Additional class names to assign to the message element.
   */
  className?: string;

  /**
   * The message type.
   */
  color?: BulmaColor;

  /**
   * An optional header for the message.
   */
  header?: ReactNode;
}

export function Message({ children, className, color, header }: MessageProps): ReactElement {
  return (
    <div className={classNames('message', className, { [`is-${color}`]: color })}>
      {header ? <h6 className="message-header">{header}</h6> : null}
      <div className="message-body">{children}</div>
    </div>
  );
}
