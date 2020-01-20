import { BulmaColor } from '@appsemble/types';
import classNames from 'classnames';
import * as React from 'react';

interface MessageProps {
  /**
   * The message content.
   */
  children: React.ReactNode;

  /**
   * Additional class names to assign to the message element.
   */
  className?: string;

  /**
   * The message type.
   */
  color?: BulmaColor;
}

export default function Message({ children, className, color }: MessageProps): React.ReactElement {
  return (
    <div className={classNames('message', className, { [`is-${color}`]: color })}>
      <div className="message-body">{children}</div>
    </div>
  );
}
