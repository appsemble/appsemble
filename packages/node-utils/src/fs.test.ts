import { AppsembleError, isErrno, opendirSafe, readYaml, resolveFixture } from '.';

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

describe('readYaml', () => {
  it('should read and parse a YAML file', async () => {
    const content = await readYaml(resolveFixture('yaml.yaml'));
    expect(content).toStrictEqual([{ yaml: 'yaml' }, 'yaml: yaml\n']);
  });

  it('should throw an Appsemble error if the file can’t be read', async () => {
    await expect(readYaml('non-existent.yaml')).rejects.toThrow(
      new AppsembleError('Error reading file non-existent.yaml'),
    );
  });

  it('should throw an Appsemble error if the file can’t be parsed', async () => {
    const path = resolveFixture('invalid-yaml.txt');
    await expect(readYaml(path)).rejects.toThrow(
      new AppsembleError(`Error parsing ${path}
end of the stream or a document separator is expected at line 2, column 1:
    - indentation
    ^`),
    );
  });
});

describe('opendirSafe', () => {
  it('should read a directory', async () => {
    const onFile = jest.fn();
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
    const onFile = jest.fn();
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
    await expect(opendirSafe(path, jest.fn())).rejects.toThrow(
      new AppsembleError(`Expected ${path} to be a directory`),
    );
  });

  it('should throw if the path doesn’t exist', async () => {
    const path = resolveFixture('non-existent');
    await expect(opendirSafe(path, jest.fn())).rejects.toThrow(
      new AppsembleError(`Expected ${path} to be a directory`),
    );
  });

  it('should not throw if the path doesn’t exist and allwoMissing is true', async () => {
    const path = resolveFixture('non-existent');
    await expect(opendirSafe(path, jest.fn(), { allowMissing: true })).resolves.toBeUndefined();
  });
});
