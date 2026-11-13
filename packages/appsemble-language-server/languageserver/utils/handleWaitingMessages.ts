/**
 * Wait until the connection has read and handled the messages that arrived meanwhile, so that work
 * for an outdated version of a document can notice a newer edit and stop. Reading a message and
 * handling it take a turn of the event loop each. `setTimeout` exists in Node.js and in web workers
 * alike.
 */
export async function handleWaitingMessages(): Promise<void> {
  for (let turn = 0; turn < 2; turn += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
}
