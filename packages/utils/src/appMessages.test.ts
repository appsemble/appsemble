import { extractAppMessages, findMessageIds } from './appMessages';

describe('findMessageIds', () => {
  it('should ignore null', () => {
    const result = findMessageIds(null);
    expect(result).toStrictEqual([]);
  });

  it('should ignore non-object values', () => {
    const result = findMessageIds('A string');
    expect(result).toStrictEqual([]);
  });

  it('should find message ids from a string.format remapper', () => {
    const result = findMessageIds({ 'string.format': { messageId: 'foo' } });
    expect(result).toStrictEqual(['foo']);
  });

  it('should ignore non-string message ids', () => {
    const result = findMessageIds({ 'string.format': { messageId: 12 } });
    expect(result).toStrictEqual([]);
  });

  it('should missing message ids', () => {
    const result = findMessageIds({ 'string.format': {} });
    expect(result).toStrictEqual([]);
  });

  it('should recurse into arrays', () => {
    const result = findMessageIds([
      { 'string.format': { messageId: 'foo' } },
      { 'string.format': { messageId: 'bar' } },
    ]);
    expect(result).toStrictEqual(['foo', 'bar']);
  });

  it('should recurse into objects', () => {
    const result = findMessageIds({
      foo: { 'string.format': { messageId: 'fooz' } },
      bar: { 'string.format': { messageId: 'baz' } },
    });
    expect(result).toStrictEqual(['fooz', 'baz']);
  });
});

describe('extractAppMessages', () => {
  it('should extract page prefixes', () => {
    const result = extractAppMessages({
      defaultPage: '',
      pages: [
        { name: '', blocks: [] },
        { name: '', blocks: [] },
      ],
    });
    expect(result).toStrictEqual(['pages.0', 'pages.1']);
  });

  it('should extract block header remappers', () => {
    const result = extractAppMessages({
      defaultPage: '',
      pages: [
        {
          name: '',
          blocks: [
            { type: 'test', version: '1.2.3', header: { 'string.format': { messageId: 'foo' } } },
          ],
        },
      ],
    });
    expect(result).toStrictEqual(['foo', 'pages.0']);
  });

  it('should extract remappers from block parameters', () => {
    const result = extractAppMessages({
      defaultPage: '',
      pages: [
        {
          name: '',
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
    expect(result).toStrictEqual(['foo', 'pages.0']);
  });

  it('should extract remappers from actions', () => {
    const result = extractAppMessages({
      defaultPage: '',
      pages: [
        {
          name: '',
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
    expect(result).toStrictEqual([
      'onClickMessageId',
      'onErrorMessageId',
      'onSuccessMessageId',
      'pages.0',
    ]);
  });

  it('should extract names from tabs pages', () => {
    const result = extractAppMessages({
      defaultPage: '',
      pages: [
        {
          name: '',
          type: 'tabs',
          subPages: [{ name: '', blocks: [] }],
        },
      ],
    });
    expect(result).toStrictEqual(['pages.0', 'pages.0.subPages.0']);
  });

  it('should append any messages returned by onBlock', () => {
    const onBlock = jest.fn().mockReturnValue(['foo']);
    const result = extractAppMessages(
      {
        defaultPage: '',
        pages: [{ name: '', blocks: [{ type: '', version: '' }] }],
      },
      onBlock,
    );
    expect(onBlock).toHaveBeenCalledWith({ type: '', version: '' }, ['pages', 0, 'blocks', 0]);
    expect(result).toStrictEqual(['foo', 'pages.0']);
  });
});
