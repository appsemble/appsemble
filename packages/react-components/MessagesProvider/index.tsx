import { type BaseMessage } from '@appsemble/lang-sdk';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import styles from './index.module.css';
import { messages } from './messages.js';
import { Message, useForceUpdate } from '../index.js';
import { type ModalDialog, useModalDialogs } from '../useModalDialog/index.js';

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
 * The keys of the live regions messages finished transitioning in.
 */
const messageRegions = new WeakMap<UniqueMessage, string>();

/**
 * The keys of the live regions rendered inside modal dialogs.
 */
const regionKeys = new WeakMap<ModalDialog, string>();
const pageRegionKey = 'page';
let regionCount = 0;

function getRegionKey(modalDialog: ModalDialog): string {
  if (!regionKeys.has(modalDialog)) {
    regionCount += 1;
    regionKeys.set(modalDialog, String(regionCount));
  }
  return regionKeys.get(modalDialog)!;
}

interface LiveRegionProps {
  /**
   * Whether the messages are rendered in this live region.
   */
  readonly active: boolean;

  readonly children: ReactNode;

  /**
   * The modal dialogs. The active live region is raised to the top when they change, so it's
   * rendered on top of them.
   */
  readonly modalDialogs: readonly ModalDialog[];

  /**
   * The name of the slot of a dialog in a shadow root to render the live region in.
   */
  readonly slot?: string;
}

/**
 * Render a live region on top of the page.
 *
 * The live region is shown as a popover, so it's rendered on top of a dialog that transitions out.
 */
function LiveRegion({ active, children, modalDialogs, slot }: LiveRegionProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const region = ref.current!;
    if (!('showPopover' in region)) {
      return;
    }
    region.setAttribute('popover', 'manual');
    if (active) {
      region.hidePopover();
    }
    region.showPopover();
  }, [active, modalDialogs]);

  return (
    <div aria-live="polite" className={`${styles.root} mx-3`} ref={ref} slot={slot}>
      {children}
    </div>
  );
}

/**
 * Render messages that may be pushed using {@link useMessages}.
 *
 * While a modal dialog is open, the messages are rendered inside the topmost dialog, because
 * everything outside of it is blocked. Every modal dialog has its own live region, which is rendered
 * as long as the dialog is shown, because screen readers only announce content that is added to an
 * existing live region.
 */
export function MessagesProvider({ children }: MessagesProviderProps): ReactNode {
  const { formatMessage } = useIntl();
  const forceUpdate = useForceUpdate();
  const modalDialogs = useModalDialogs();

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

  const renderRegion = (key: string, active: boolean, slot?: string): ReactNode => (
    <LiveRegion active={active} modalDialogs={modalDialogs} slot={slot}>
      <TransitionGroup>
        {(active ? msgs.current : []).map((message) => {
          // A message that was shown in another live region before a modal dialog opened or closed
          // is not transitioned in or announced assertively again.
          const region = messageRegions.get(message);
          const moved = region != null && region !== key;
          return (
            <CSSTransition
              classNames={{
                enter: styles.messageEnter,
                enterActive: styles.messageEnterActive,
                exit: styles.messageExit,
                exitActive: styles.messageExitActive,
              }}
              enter={!moved}
              key={message.id}
              onEntered={() => {
                if (!messageRegions.has(message)) {
                  messageRegions.set(message, key);
                }
              }}
              timeout={300}
            >
              <Message
                className={`${styles.content} ${styles[message.layout || 'bottom']}`}
                color={message.color || 'danger'}
              >
                <span
                  className={styles.body}
                  role={(message.color || 'danger') === 'danger' && !moved ? 'alert' : undefined}
                >
                  {message.body}
                </span>
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
          );
        })}
      </TransitionGroup>
    </LiveRegion>
  );

  return (
    <Context.Provider value={push}>
      {children}
      {renderRegion(pageRegionKey, !modalDialogs.length)}
      {modalDialogs.map((modalDialog, index) => {
        const root = modalDialog.dialog.getRootNode();
        // The shadow host renders content inside a dialog in its shadow root using a slot.
        return createPortal(
          renderRegion(
            getRegionKey(modalDialog),
            index === modalDialogs.length - 1,
            modalDialog.slot,
          ),
          root instanceof ShadowRoot ? root.host : modalDialog.dialog,
          getRegionKey(modalDialog),
        );
      })}
    </Context.Provider>
  );
}

export function useMessages(): ShowMessage {
  return useContext(Context);
}
