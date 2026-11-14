import { type MessageStrategy } from 'vscode-languageserver';

let dispatchedMessages = 0;
let requestsInProgress = 0;

/**
 * Counts the messages the connection dispatches, so that waiting code can tell whether messages
 * were still waiting in the queue.
 */
export const countingMessageStrategy: MessageStrategy = {
  handleMessage(message, next) {
    dispatchedMessages += 1;
    return next(message);
  },
};

/**
 * Wait one turn of the event loop. `setTimeout` exists in Node.js and in web workers alike.
 *
 * @returns A promise that resolves on the next turn.
 */
function nextTurn(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Wait until the connection has handled every message that was waiting in its queue, so that work
 * for an outdated version of a document can notice a newer edit and stop. Dispatching a message and
 * handling it take a turn of the event loop each.
 */
export async function handleWaitingMessages(): Promise<void> {
  let dispatched: number;
  do {
    dispatched = dispatchedMessages;
    await nextTurn();
    await nextTurn();
  } while (dispatchedMessages !== dispatched);
}

/**
 * Count a request as in progress until its answer is computed.
 *
 * @param work Computes the answer.
 * @returns The answer.
 */
export async function answerRequest<T>(work: () => Promise<T>): Promise<T> {
  requestsInProgress += 1;
  try {
    return await work();
  } finally {
    requestsInProgress -= 1;
  }
}

/**
 * Wait until waiting messages are handled and every request in progress is answered. Background
 * work such as validation that holds the thread for long runs after the requests an editor waits
 * for.
 */
export async function answerWaitingRequests(): Promise<void> {
  do {
    await handleWaitingMessages();
  } while (requestsInProgress > 0);
}
