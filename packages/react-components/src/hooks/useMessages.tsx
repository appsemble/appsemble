import type { BulmaColor } from '@appsemble/sdk';
import { createContext, useContext } from 'react';

export interface Message {
  /**
   * The content of the message to display.
   */
  body: string;

  /**
   * The color to use for the message.
   *
   * @default 'danger'
   */
  color?: BulmaColor;

  /**
   * The timeout period for this message (in milliseconds).
   *
   * Defaults to 5 seconds.
   */
  timeout?: number;

  /**
   * Whether or not to show the dismiss button.
   *
   * @default true
   */
  dismissable?: boolean;
}

export type MessagesContext = (message: Message | string) => void;

export const MessagesContext = createContext<MessagesContext>(null);

export default function useMessages(): MessagesContext {
  return useContext(MessagesContext);
}
