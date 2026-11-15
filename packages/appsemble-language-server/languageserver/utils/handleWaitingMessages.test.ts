import { setTimeout as nextTurn } from 'node:timers/promises';

import { describe, expect, it } from 'vitest';

import {
  answerRequest,
  answerWaitingRequests,
  countingMessageStrategy,
  handleWaitingMessages,
} from './handleWaitingMessages.js';

describe('handleWaitingMessages', () => {
  it('waits until the connection stops dispatching messages', async () => {
    const events: string[] = [];
    const waiting = handleWaitingMessages().then(() => events.push('done'));

    for (let message = 0; message < 10; message += 1) {
      countingMessageStrategy.handleMessage({ jsonrpc: '2.0' }, () => events.push('dispatched'));
      await nextTurn(0);
    }
    await waiting;

    expect(events).toStrictEqual([...Array.from({ length: 10 }, () => 'dispatched'), 'done']);
  });
});

describe('answerWaitingRequests', () => {
  it('waits until every request in progress is answered', async () => {
    let answer!: (value: string) => void;
    const request = answerRequest(
      () =>
        new Promise<string>((resolve) => {
          answer = resolve;
        }),
    );
    let waited = false;
    const waiting = answerWaitingRequests().then(() => {
      waited = true;
    });

    await nextTurn(20);
    expect(waited).toBe(false);

    answer('folding ranges');
    await waiting;
    expect(await request).toBe('folding ranges');
  });
});
