import classNames from 'classnames';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import styles from './Message.css';

interface IncomingMessage {
  body: string;
  color?: 'danger' | 'dark' | 'info' | 'link' | 'primary' | 'success' | 'warning';
  id: number;
}

export interface MessageProps {
  messages: IncomingMessage[];
  remove: (message: IncomingMessage) => void;
}

export default class Message extends React.Component<MessageProps> {
  static propTypes = {
    messages: PropTypes.arrayOf(PropTypes.shape({})),
    remove: PropTypes.func.isRequired,
  };

  static defaultProps: Partial<MessageProps> = {
    messages: [],
  };

  componentDidUpdate(prevProps: MessageProps): void {
    const { messages, remove } = this.props;

    if (messages.length > prevProps.messages.length) {
      const message = messages[messages.length - 1];

      setTimeout(() => {
        remove(message);
      }, 5e3);
    }
  }

  render(): React.ReactNode {
    const { messages } = this.props;

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
                  {message && message.body}
                </div>
              </article>
            </CSSTransition>
          ))}
        </TransitionGroup>
      </div>
    );
  }
}
