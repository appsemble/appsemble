import path from 'path';

import readFileOrString from './readFileOrString';

it('should return file content if it resolves to a file', async () => {
  const result = await readFileOrString(path.join(__dirname, '__fixtures__', 'hello.txt'));
  expect(Buffer.from('Hello world!\n').equals(result)).toBe(true);
});

it('should return the input if it doesn’t resolve to a file', async () => {
  const result = await readFileOrString('hello.txt');
  expect(result).toBe('hello.txt');
});
