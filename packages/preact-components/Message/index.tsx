import { type BulmaColor } from '@appsemble/types';
import classNames from 'classnames';
import { type VNode } from 'preact';

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
  return (
    <div
      className={classNames('message', className, { [`is-${color}`]: color })}
      data-testid="message-comp"
    >
      {header ? <h6 className="message-header">{header}</h6> : null}
      <div className="message-body">{children}</div>
    </div>
  );
}
