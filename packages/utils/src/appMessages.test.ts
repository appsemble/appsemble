import { extractAppMessages, findMessageIds } from './appMessages';

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
});

describe('extractAppMessages', () => {
  it('should extract page prefixes', () => {
    const result = extractAppMessages({
      defaultPage: '',
      pages: [
        { name: 'First Page', blocks: [] },
        { name: 'Second Page', blocks: [] },
      ],
    });
    expect(result).toMatchObject({ app: { 'pages.0': 'First Page', 'pages.1': 'Second Page' } });
  });

  it('should extract block header remappers', () => {
    const result = extractAppMessages({
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
    expect(result).toMatchObject({ messageIds: { foo: '' }, app: { 'pages.0': 'Page' } });
  });

  it('should extract remappers from block parameters', () => {
    const result = extractAppMessages({
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
    expect(result).toMatchObject({ messageIds: { foo: '' }, app: { 'pages.0': 'Page' } });
  });

  it('should extract remappers from actions', () => {
    const result = extractAppMessages({
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
                  remap: { 'string.format': { messageId: 'onClickMessageId' } },
                  onError: {
                    type: 'noop',
                    remap: { 'string.format': { messageId: 'onErrorMessageId' } },
                  },
                  onSuccess: {
                    type: 'noop',
                    remap: { 'string.format': { messageId: 'onSuccessMessageId' } },
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
      app: { 'pages.0': 'Page' },
    });
  });

  it('should extract names from tabs pages', () => {
    const result = extractAppMessages({
      defaultPage: '',
      pages: [
        {
          name: 'Tabs',
          type: 'tabs',
          subPages: [{ name: 'Tab', blocks: [] }],
        },
      ],
    });
    expect(result).toMatchObject({ app: { 'pages.0': 'Tabs', 'pages.0.subPages.0': 'Tab' } });
  });

  it('should append any messages returned by onBlock', () => {
    const onBlock = jest.fn().mockReturnValue({ foo: 'bar' });
    const result = extractAppMessages(
      {
        defaultPage: '',
        pages: [{ name: 'Page', blocks: [{ type: '', version: '' }] }],
      },
      onBlock,
    );
    expect(onBlock).toHaveBeenCalledWith({ type: '', version: '' }, ['pages', 0, 'blocks', 0]);
    expect(result).toMatchObject({ app: { 'pages.0': 'Page' } });
  });
});
