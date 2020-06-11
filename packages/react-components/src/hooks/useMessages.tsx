import type { BaseMessage } from '@appsemble/sdk';
import { createContext, useContext } from 'react';

export interface Message extends BaseMessage {
  /**
   * The content of the message to display.
   */
  body: string;
}

export type MessagesContext = (message: Message | string) => void;

export const MessagesContext = createContext<MessagesContext>(null);

export default function useMessages(): MessagesContext {
  return useContext(MessagesContext);
}
