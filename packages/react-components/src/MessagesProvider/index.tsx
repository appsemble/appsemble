import React, { ReactElement, ReactNode, useCallback, useRef } from 'react';
import { useIntl } from 'react-intl';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import Message from '../Message';
import useForceUpdate from '../useForceUpdate';
import { Message as Msg, MessagesContext } from '../useMessages';
import styles from './index.css';
import msgs from './messages';

interface MessagesProviderProps {
  /**
   * Children to which {@link useMessages} will be available.
   */
  children: ReactNode;
}

interface UniqueMessage extends Msg {
  id: number;

  dismiss?: () => void;
}

/**
 * Render messages that may be pushed using {@link useMessages}.
 */
export default function MessagesProvider({ children }: MessagesProviderProps): ReactElement {
  const { formatMessage } = useIntl();
  const forceUpdate = useForceUpdate();

  // The counter is used as a key of messages.
  const counter = useRef(0);
  // Updating messages should not redefine the push callback.
  const messages = useRef<UniqueMessage[]>([]);

  const push = useCallback(
    (message: Msg | string) => {
      const id = counter.current;
      counter.current += 1;
      const uniqueMessage: UniqueMessage =
        typeof message === 'string' ? { id, body: message } : { id, ...message };

      const dismiss = (): void => {
        const index = messages.current.indexOf(uniqueMessage);
        if (index !== -1) {
          messages.current.splice(index, 1);
          forceUpdate();
        }
      };
      uniqueMessage.dismiss = dismiss;
      messages.current.push(uniqueMessage);
      // Since messages are in a ref, pushing a message won’t trigger a rerender.
      forceUpdate();
      const { dismissable, timeout = dismissable ? undefined : 5e3 } = uniqueMessage;

      if (timeout) {
        setTimeout(dismiss, timeout);
      }
    },
    [forceUpdate],
  );

  return (
    <MessagesContext.Provider value={push}>
      {children}
      <div className={`${styles.root} mx-3`}>
        <TransitionGroup>
          {messages.current.map((message) => (
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
                <span>{message?.body}</span>
                {message.dismissable && (
                  <button
                    aria-label={formatMessage(msgs.dismiss)}
                    className={`delete ${styles.deleteButton}`}
                    onClick={message.dismiss}
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
