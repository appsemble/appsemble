import { readFileOrString } from './readFileOrString';
import { resolveFixture } from './testFixtures';

it('should return file content if it resolves to a file', async () => {
  const result = await readFileOrString(resolveFixture('hello.txt'));
  expect(Buffer.from('Hello world!\n').equals(result as Buffer)).toBe(true);
});

it('should return the input if it doesn’t resolve to a file', async () => {
  const result = await readFileOrString('hello.txt');
  expect(result).toBe('hello.txt');
});
