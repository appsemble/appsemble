import * as React from 'react';
import { useIntl } from 'react-intl';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import useCounter from '../hooks/useCounter';
import { Message as Msg, MessagesContext } from '../hooks/useMessages';
import Message from '../Message/Message';
import msgs from './messages';
import styles from './Messages.css';

interface MessagesProviderProps {
  children: React.ReactNode;
}

interface UniqueMessage extends Msg {
  id: number;
}

export default function MessagesProvider({ children }: MessagesProviderProps): React.ReactElement {
  const intl = useIntl();

  const counter = useCounter();
  const [messages, setMessages] = React.useState<UniqueMessage[]>([]);
  // When messages are dismissed, the dismiss callback needs a reference to the latest messages
  // state. This is stored in the messagesRef.
  const messagesRef = React.useRef<UniqueMessage[]>();
  messagesRef.current = messages;

  const dismiss = React.useCallback((message: UniqueMessage) => {
    setMessages(messagesRef.current.filter(m => m !== message));
  }, []);

  const push = React.useCallback(
    (message: Msg | string) => {
      const uniqueMessage: UniqueMessage =
        typeof message === 'string'
          ? { id: counter(), body: message }
          : { id: counter(), ...message };
      setMessages([...messages, uniqueMessage]);
      const { dismissable, timeout = dismissable ? undefined : 5e3 } = uniqueMessage;

      if (timeout) {
        setTimeout(() => {
          dismiss(uniqueMessage);
        }, timeout);
      }
    },
    [counter, dismiss, messages],
  );

  return (
    <MessagesContext.Provider value={push}>
      {children}
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
              <Message className={styles.content} color={message.color || 'danger'}>
                <span>{message && message.body}</span>
                {message.dismissable && (
                  <button
                    aria-label={intl.formatMessage(msgs.dismiss)}
                    className={`delete ${styles.deleteButton}`}
                    onClick={() => dismiss(message)}
                    type="button"
                  />
                )}
              </Message>
            </CSSTransition>
          ))}
        </TransitionGroup>
      </div>
    </MessagesContext.Provider>
  );
}
