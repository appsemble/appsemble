import { type BaseMessage } from '@appsemble/types';
import { createContext, type ReactNode, useCallback, useContext, useRef } from 'react';
import { useIntl } from 'react-intl';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import styles from './index.module.css';
import { messages } from './messages.js';
import { Message, useForceUpdate } from '../index.js';

export interface Msg extends BaseMessage {
  /**
   * The content of the message to display.
   */
  body: string;
}

export type ShowMessage = (message: Msg | string) => void;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const Context = createContext<ShowMessage>(() => {});

interface MessagesProviderProps {
  /**
   * Children to which {@link useMessages} will be available.
   */
  readonly children: ReactNode;
}

interface UniqueMessage extends Msg {
  id: number;

  dismiss?: () => void;
}

/**
 * Render messages that may be pushed using {@link useMessages}.
 */
export function MessagesProvider({ children }: MessagesProviderProps): ReactNode {
  const { formatMessage } = useIntl();
  const forceUpdate = useForceUpdate();

  // The counter is used as a key of messages.
  const counter = useRef(0);
  // Updating messages should not redefine the push callback.
  const msgs = useRef<UniqueMessage[]>([]);

  const push = useCallback(
    (message: Msg | string) => {
      const id = counter.current;
      counter.current += 1;
      const uniqueMessage: UniqueMessage =
        typeof message === 'string' ? { id, body: message } : { id, ...message };

      const dismiss = (): void => {
        const index = msgs.current.indexOf(uniqueMessage);
        if (index !== -1) {
          msgs.current.splice(index, 1);
          forceUpdate();
        }
      };
      uniqueMessage.dismiss = dismiss;
      msgs.current.push(uniqueMessage);
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
    <Context.Provider value={push}>
      {children}
      <div className={`${styles.root} mx-3`}>
        <TransitionGroup>
          {msgs.current.map((message) => (
            <CSSTransition
              classNames={{
                enter: styles.messageEnter,
                enterActive: styles.messageEnterActive,
                exit: styles.messageExit,
                exitActive: styles.messageExitActive,
              }}
              key={message.id}
              timeout={300}
            >
              <Message
                className={`${styles.content} ${styles[message.layout || 'bottom']}`}
                color={message.color || 'danger'}
              >
                <span>{message?.body}</span>
                {message.dismissable ? (
                  <button
                    aria-label={formatMessage(messages.dismiss)}
                    className={`delete ${styles.deleteButton}`}
                    onClick={message.dismiss}
                    type="button"
                  />
                ) : null}
              </Message>
            </CSSTransition>
          ))}
        </TransitionGroup>
      </div>
    </Context.Provider>
  );
}

export function useMessages(): ShowMessage {
  return useContext(Context);
}
