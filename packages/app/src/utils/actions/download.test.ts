import { downloadBlob } from '@appsemble/web-utils';

import { createTestAction } from '../makeActions';

jest.mock('@appsemble/web-utils', () => ({
  downloadBlob: jest.fn(),
}));

describe('download', () => {
  it('should download string data as-is', async () => {
    const action = createTestAction({
      definition: { type: 'download', filename: 'data.txt' },
    });
    const result = await action('This is a string');
    expect(result).toBe('This is a string');
    expect(downloadBlob).toHaveBeenCalledWith('This is a string', 'data.txt');
  });

  it('should download a Blob as-is', async () => {
    const blob = new Blob(['PNG']);
    const action = createTestAction({
      definition: { type: 'download', filename: 'data.png' },
    });
    const result = await action(blob);
    expect(result).toBe(blob);
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'data.png');
  });

  it('should download objects as JSON', async () => {
    const data = { hello: 'world' };
    const action = createTestAction({
      definition: { type: 'download', filename: 'hello.json' },
    });
    const result = await action(data);
    expect(result).toBe(data);
    expect(downloadBlob).toHaveBeenCalledWith('{\n  "hello": "world"\n}\n', 'hello.json');
  });
});
