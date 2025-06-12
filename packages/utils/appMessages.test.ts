import { describe, expect, it, vi } from 'vitest';

import { extractAppMessages, findMessageIds } from './appMessages.js';

describe('findMessageIds', () => {
  it('should ignore null', () => {
    const result = findMessageIds(null);
    expect(result).toStrictEqual({});
  });

  it('should ignore non-object values', () => {
    const result = findMessageIds('A string');
    expect(result).toStrictEqual({});
  });

  it('should find message ids from a string.format remapper', () => {
    const result = findMessageIds({ 'string.format': { messageId: 'foo' } });
    expect(result).toStrictEqual({ foo: '' });
  });

  it('should return the message template', () => {
    const result = findMessageIds({ 'string.format': { messageId: 'foo', template: 'bar' } });
    expect(result).toStrictEqual({ foo: 'bar' });
  });

  it('should ignore non-string message ids', () => {
    const result = findMessageIds({ 'string.format': { messageId: 12 } });
    expect(result).toStrictEqual({});
  });

  it('should missing message ids', () => {
    const result = findMessageIds({ 'string.format': {} });
    expect(result).toStrictEqual({});
  });

  it('should recurse into arrays', () => {
    const result = findMessageIds([
      { 'string.format': { messageId: 'foo' } },
      { 'string.format': { messageId: 'bar' } },
    ]);
    expect(result).toStrictEqual({ foo: '', bar: '' });
  });

  it('should recurse into objects', () => {
    const result = findMessageIds({
      foo: { 'string.format': { messageId: 'fooz' } },
      bar: { 'string.format': { messageId: 'baz' } },
    });
    expect(result).toStrictEqual({ fooz: '', baz: '' });
  });

  it('should extract string.format remapper values', () => {
    const result = findMessageIds({
      'string.format': { messageId: 'foo', values: { translate: 'bar' } },
    });
    expect(result).toStrictEqual({ foo: '', bar: '' });
  });
});

describe('extractAppMessages', () => {
  it('should extract page prefixes', () => {
    const result = extractAppMessages({
      name: 'Test app',
      defaultPage: '',
      pages: [
        { name: 'First Page', blocks: [] },
        { name: 'Second Page', blocks: [] },
      ],
    });
    expect(result).toMatchObject({
      app: { 'pages.first-page': 'First Page', 'pages.second-page': 'Second Page' },
    });
  });

  it('should extract block header remappers', () => {
    const result = extractAppMessages({
      name: 'Test app',
      defaultPage: '',
      pages: [
        {
          name: 'Page',
          blocks: [
            { type: 'test', version: '1.2.3', header: { 'string.format': { messageId: 'foo' } } },
          ],
        },
      ],
    });
    expect(result).toMatchObject({ messageIds: { foo: '' }, app: { 'pages.page': 'Page' } });
  });

  it('should extract remappers from block parameters', () => {
    const result = extractAppMessages({
      name: 'Test app',
      defaultPage: '',
      pages: [
        {
          name: 'Page',
          blocks: [
            {
              type: 'test',
              version: '1.2.3',
              parameters: { foo: { 'string.format': { messageId: 'foo' } } },
            },
          ],
        },
      ],
    });
    expect(result).toMatchObject({ messageIds: { foo: '' }, app: { 'pages.page': 'Page' } });
  });

  it('should extract action remapBefore and remapAfter', () => {
    const result = extractAppMessages({
      name: 'Test app',
      defaultPage: '',
      pages: [
        {
          name: 'Page',
          blocks: [
            {
              type: 'test',
              version: '1.2.3',
              actions: {
                onClick: {
                  type: 'noop',
                  remapBefore: { 'string.format': { messageId: 'onClickMessageId' } },
                  onError: {
                    type: 'noop',
                    remapBefore: { 'string.format': { messageId: 'onErrorMessageId' } },
                  },
                  onSuccess: {
                    type: 'noop',
                    remapAfter: { 'string.format': { messageId: 'onSuccessMessageId' } },
                  },
                },
              },
            },
          ],
        },
      ],
    });
    expect(result).toMatchObject({
      messageIds: { onClickMessageId: '', onErrorMessageId: '', onSuccessMessageId: '' },
      app: { 'pages.page': 'Page' },
    });
  });

  it('should extract condition action if then and else', () => {
    const result = extractAppMessages({
      name: 'Test app',
      defaultPage: '',
      pages: [
        {
          name: 'Page',
          blocks: [
            {
              type: 'test',
              version: '1.2.3',
              actions: {
                onClick: {
                  type: 'condition',
                  if: { translate: 'ifCondition' },
                  then: { type: 'message', body: { translate: 'thenCondition' } },
                  else: { type: 'message', body: { translate: 'elseCondition' } },
                },
              },
            },
          ],
        },
      ],
    });
    expect(result).toMatchObject({
      messageIds: { ifCondition: '', thenCondition: '', elseCondition: '' },
      app: { 'pages.page': 'Page' },
    });
  });

  it('should extract dialog action title', () => {
    const result = extractAppMessages({
      name: 'Test app',
      defaultPage: '',
      pages: [
        {
          name: 'Page',
          blocks: [
            {
              type: 'test',
              version: '1.2.3',
              actions: {
                onClick: {
                  type: 'dialog',
                  title: { translate: 'dialogTitle' },
                  blocks: [],
                },
              },
            },
          ],
        },
      ],
    });
    expect(result).toMatchObject({
      messageIds: { dialogTitle: '' },
      app: { 'pages.page': 'Page' },
    });
  });

  it('should extract email action remappers', () => {
    const result = extractAppMessages({
      name: 'Test app',
      defaultPage: '',
      pages: [
        {
          name: 'Page',
          blocks: [
            {
              type: 'test',
              version: '1.2.3',
              actions: {
                onClick: {
                  type: 'email',
                  attachments: { translate: 'attachments' },
                  bcc: { translate: 'bcc' },
                  body: { translate: 'body' },
                  cc: { translate: 'cc' },
                  subject: { translate: 'subject' },
                  to: { translate: 'to' },
                },
              },
            },
          ],
        },
      ],
    });
    expect(result).toMatchObject({
      messageIds: { attachments: '', bcc: '', body: '', cc: '', subject: '', to: '' },
      app: { 'pages.page': 'Page' },
    });
  });

  it('should extract flow.to action step', () => {
    const result = extractAppMessages({
      name: 'Test app',
      defaultPage: '',
      pages: [
        {
          name: 'Page',
          blocks: [
            {
              type: 'test',
              version: '1.2.3',
              actions: {
                onClick: {
                  type: 'flow.to',
                  step: { translate: 'toPage' },
                },
              },
            },
          ],
        },
      ],
    });
    expect(result).toMatchObject({
      messageIds: { toPage: '' },
      app: { 'pages.page': 'Page' },
    });
  });

  it('should extract message action body', () => {
    const result = extractAppMessages({
      name: 'Test app',
      defaultPage: '',
      pages: [
        {
          name: 'Page',
          blocks: [
            {
              type: 'test',
              version: '1.2.3',
              actions: {
                onClick: {
                  type: 'message',
                  body: { translate: 'messageBody' },
                },
              },
            },
          ],
        },
      ],
    });
    expect(result).toMatchObject({
      messageIds: { messageBody: '' },
      app: { 'pages.page': 'Page' },
    });
  });

  it('should extract request action remappers', () => {
    const result = extractAppMessages({
      name: 'Test app',
      defaultPage: '',
      pages: [
        {
          name: 'Page',
          blocks: [
            {
              type: 'test',
              version: '1.2.3',
              actions: {
                onRequest: {
                  type: 'request',
                  body: { translate: 'requestBody' },
                  query: { translate: 'requestQuery' },
                  url: { translate: 'requestUrl' },
                },
                onResourceCount: {
                  type: 'resource.count',
                  resource: 'test',
                  body: { translate: 'resourceCountBody' },
                  query: { translate: 'resourceCountQuery' },
                  url: { translate: 'resourceCountUrl' },
                },
                onResourceCreate: {
                  type: 'resource.create',
                  resource: 'test',
                  body: { translate: 'resourceCreateBody' },
                  query: { translate: 'resourceCreateQuery' },
                  url: { translate: 'resourceCreateUrl' },
                },
                onResourceDelete: {
                  type: 'resource.delete',
                  resource: 'test',
                  body: { translate: 'resourceDeleteBody' },
                  query: { translate: 'resourceDeleteQuery' },
                  url: { translate: 'resourceDeleteUrl' },
                },
                onResourceGet: {
                  type: 'resource.get',
                  resource: 'test',
                  body: { translate: 'resourceGetBody' },
                  query: { translate: 'resourceGetQuery' },
                  url: { translate: 'resourceGetUrl' },
                },
                onResourceQuery: {
                  type: 'resource.query',
                  resource: 'test',
                  body: { translate: 'resourceQueryBody' },
                  query: { translate: 'resourceQueryQuery' },
                  url: { translate: 'resourceQueryUrl' },
                },
                onResourceUpdate: {
                  type: 'resource.update',
                  resource: 'test',
                  body: { translate: 'resourceUpdateBody' },
                  query: { translate: 'resourceUpdateQuery' },
                  url: { translate: 'resourceUpdateUrl' },
                },
              },
            },
          ],
        },
      ],
    });
    expect(result).toMatchObject({
      messageIds: {
        requestBody: '',
        requestQuery: '',
        requestUrl: '',
        resourceCountBody: '',
        resourceCountQuery: '',
        resourceCountUrl: '',
        resourceCreateBody: '',
        resourceCreateQuery: '',
        resourceCreateUrl: '',
        resourceDeleteBody: '',
        resourceDeleteQuery: '',
        resourceDeleteUrl: '',
        resourceGetBody: '',
        resourceGetQuery: '',
        resourceGetUrl: '',
        resourceQueryBody: '',
        resourceQueryQuery: '',
        resourceQueryUrl: '',
        resourceUpdateBody: '',
        resourceUpdateQuery: '',
        resourceUpdateUrl: '',
      },
      app: { 'pages.page': 'Page' },
    });
  });

  it('should extract share action remappers', () => {
    const result = extractAppMessages({
      name: 'Test app',
      defaultPage: '',
      pages: [
        {
          name: 'Page',
          blocks: [
            {
              type: 'test',
              version: '1.2.3',
              actions: {
                onClick: {
                  type: 'share',
                  text: { translate: 'shareText' },
                  title: { translate: 'shareTitle' },
                  url: { translate: 'shareUrl' },
                },
              },
            },
          ],
        },
      ],
    });
    expect(result).toMatchObject({
      messageIds: { shareText: '', shareTitle: '', shareUrl: '' },
      app: { 'pages.page': 'Page' },
    });
  });

  it('should extract names from tabs pages', () => {
    const result = extractAppMessages({
      name: 'Test app',
      defaultPage: '',
      pages: [
        {
          name: 'Tabs',
          type: 'tabs',
          tabs: [{ name: 'Tab', blocks: [] }],
        },
      ],
    });
    expect(result).toMatchObject({ app: { 'pages.tabs': 'Tabs', 'pages.tabs.tabs.0': 'Tab' } });
  });

  it('should append any messages returned by onBlock', () => {
    const onBlock = vi.fn().mockReturnValue({ foo: 'bar' });
    const result = extractAppMessages(
      {
        name: 'Test app',
        defaultPage: '',
        pages: [{ name: 'Page', blocks: [{ type: '', version: '' }] }],
      },
      onBlock,
    );
    expect(onBlock).toHaveBeenCalledWith({ type: '', version: '' }, ['pages', 'page', 'blocks', 0]);
    expect(result).toMatchObject({ app: { 'pages.page': 'Page' } });
  });
});
