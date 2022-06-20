import { BulmaColor } from '@appsemble/sdk';
import classNames from 'classnames';
import { VNode } from 'preact';

interface MessageProps {
  /**
   * The message content.
   */
  children: VNode;

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
  header?: VNode;
}

export function Message({ children, className, color, header }: MessageProps): VNode {
  return (
    <div className={classNames('message', className, { [`is-${color}`]: color })}>
      {header ? <h6 className="message-header">{header}</h6> : null}
      <div className="message-body">{children}</div>
    </div>
  );
}
