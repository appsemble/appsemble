import { Message as IncomingMessage } from '@appsemble/types';
import classNames from 'classnames';
import * as React from 'react';
import { WrappedComponentProps } from 'react-intl';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import styles from './Message.css';
import msgs from './messages';

export interface UniqueMessage extends IncomingMessage {
  id: number;
}

export interface MessageProps extends WrappedComponentProps {
  messages: UniqueMessage[];
  remove: (message: UniqueMessage) => void;
}

export default class Message extends React.Component<MessageProps> {
  static defaultProps: Partial<MessageProps> = {
    messages: [],
  };

  componentDidUpdate(prevProps: MessageProps): void {
    const { messages, remove } = this.props;

    if (messages.length > prevProps.messages.length) {
      const message = messages[messages.length - 1];
      let { timeout } = message;

      if (!timeout && !message.dismissable) {
        timeout = 5e3;
      }

      if (timeout) {
        setTimeout(() => {
          remove(message);
        }, timeout);
      }
    }
  }

  onDismiss(message: UniqueMessage): void {
    const { remove } = this.props;

    remove(message);
  }

  render(): React.ReactNode {
    const { intl, messages } = this.props;

    return (
      <div className={styles.root}>
        <TransitionGroup>
          {messages.map(message => (
            <CSSTransition
              key={message.id}
              classNames={{
                enter: styles.messageEnter,
                enterActive: styles.messageEnterActive,
                exit: styles.messageExit,
                exitActive: styles.messageExitActive,
              }}
              timeout={300}
            >
              <article
                className={classNames(
                  'message',
                  message && message.color ? `is-${message.color}` : 'is-danger',
                )}
              >
                <div className={classNames('message-body', styles.content)}>
                  <span>{message && message.body}</span>
                  {message.dismissable && (
                    <button
                      aria-label={intl.formatMessage(msgs.dismiss)}
                      className={`delete ${styles.deleteButton}`}
                      onClick={() => this.onDismiss(message)}
                      type="button"
                    />
                  )}
                </div>
              </article>
            </CSSTransition>
          ))}
        </TransitionGroup>
      </div>
    );
  }
}
