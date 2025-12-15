import { describe, expect, it, vi } from 'vitest';

import { AppsembleError, isErrno, opendirSafe, readData, resolveFixture } from './index.js';

describe('isErrno', () => {
  it('should return false for null', () => {
    expect(isErrno(null)).toBe(false);
  });

  it('should return false for miscellaneous objects', () => {
    expect(isErrno({})).toBe(false);
  });

  it('should return true if the object has a string property named code', () => {
    expect(isErrno({ code: 'foo' })).toBe(true);
  });

  it('should return false if the object has a non-string property named code', () => {
    expect(isErrno({ code: 42 })).toBe(false);
  });

  it('should allow to narrow down a specific code', () => {
    expect(isErrno({ code: 'ENOENT' }, 'ENOENT')).toBe(true);
    expect(isErrno({ code: 'invalid' }, 'ENOENT')).toBe(false);
  });
});

describe('readData', () => {
  it('should read and parse a JSON file', async () => {
    const content = await readData(resolveFixture('json.json'));
    expect(content).toStrictEqual([{ json: 'json' }, '{ "json": "json" }\n']);
  });

  it('should read and parse a YAML file', async () => {
    const content = await readData(resolveFixture('yaml.yaml'));
    expect(content).toStrictEqual([{ yaml: 'yaml' }, 'yaml: yaml\n']);
  });

  it('should throw an Appsemble error if file extension is unknown', async () => {
    const path = resolveFixture('hello.txt');
    await expect(readData(path)).rejects.toThrowError(
      new AppsembleError(`Unknown file extension: ${path}`),
    );
  });

  it('should throw an Appsemble error if the file can’t be read', async () => {
    await expect(readData('non-existent.yaml')).rejects.toThrowError(
      new AppsembleError('Error reading file non-existent.yaml'),
    );
  });

  it('should throw an Appsemble error if the file can’t be parsed', async () => {
    const path = resolveFixture('invalid-json.json');
    await expect(readData(path)).rejects.toThrowError(AppsembleError);
  });
});

describe('opendirSafe', () => {
  it('should read a directory', async () => {
    const onFile = vi.fn();
    await opendirSafe(resolveFixture('test'), onFile);
    expect(onFile).toHaveBeenCalledTimes(3);
    expect(onFile).toHaveBeenCalledWith(
      resolveFixture('test/bar.txt'),
      expect.objectContaining({ name: 'bar.txt' }),
    );
    expect(onFile).toHaveBeenCalledWith(
      resolveFixture('test/foo.txt'),
      expect.objectContaining({ name: 'foo.txt' }),
    );
    expect(onFile).toHaveBeenCalledWith(
      resolveFixture('test/z'),
      expect.objectContaining({ name: 'z' }),
    );
  });

  it('should read a directory recursively if specified', async () => {
    const onFile = vi.fn();
    await opendirSafe(resolveFixture('test'), onFile, { recursive: true });
    expect(onFile).toHaveBeenCalledTimes(5);
    expect(onFile).toHaveBeenCalledWith(
      resolveFixture('test/bar.txt'),
      expect.objectContaining({ name: 'bar.txt' }),
    );
    expect(onFile).toHaveBeenCalledWith(
      resolveFixture('test/foo.txt'),
      expect.objectContaining({ name: 'foo.txt' }),
    );
    expect(onFile).toHaveBeenCalledWith(
      resolveFixture('test/z'),
      expect.objectContaining({ name: 'z' }),
    );
    expect(onFile).toHaveBeenCalledWith(
      resolveFixture('test/z/baz.txt'),
      expect.objectContaining({ name: 'baz.txt' }),
    );
    expect(onFile).toHaveBeenCalledWith(
      resolveFixture('test/z/fooz.txt'),
      expect.objectContaining({ name: 'fooz.txt' }),
    );
  });

  it('should throw if the path is not a directory', async () => {
    const path = resolveFixture('hello.txt');
    await expect(opendirSafe(path, vi.fn())).rejects.toThrowError(
      new AppsembleError(`Expected ${path} to be a directory`),
    );
  });

  it('should throw if the path doesn’t exist', async () => {
    const path = resolveFixture('non-existent');
    await expect(opendirSafe(path, vi.fn())).rejects.toThrowError(
      new AppsembleError(`Expected ${path} to be a directory`),
    );
  });

  it('should not throw if the path doesn’t exist and allowMissing is true', async () => {
    const path = resolveFixture('non-existent');
    const result = await opendirSafe(path, vi.fn(), { allowMissing: true });
    expect(result).toBeUndefined();
  });
});
