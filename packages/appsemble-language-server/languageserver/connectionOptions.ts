import { type ConnectionOptions, LSPErrorCodes, type RequestMessage } from 'vscode-languageserver';

import { countingMessageStrategy } from './utils/handleWaitingMessages.js';

export const connectionOptions: ConnectionOptions = {
  // Answer a request the editor cancels while it still waits in the queue without running its
  // handler, because the handler's work would be thrown away.
  connectionStrategy: {
    cancelUndispatched: (message) => ({
      jsonrpc: '2.0',
      id: (message as RequestMessage).id,
      error: { code: LSPErrorCodes.RequestCancelled, message: 'The request was cancelled' },
    }),
  },
  messageStrategy: countingMessageStrategy,
};
