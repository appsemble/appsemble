import extractBlobs, { placeholder } from './extractBlobs';

describe('extractBlobs', () => {
  it('should extract files from an object', () => {
    const bar = new Blob();
    const baz = new Blob();
    const [result, files] = extractBlobs({
      foo: 1,
      bar,
      baz,
    });
    expect(files).toContain(bar);
    expect(files).toContain(baz);
    expect(result).toStrictEqual({
      foo: 1,
      bar: placeholder,
      baz: placeholder,
    });
  });

  it('should extract files from nested objects', () => {
    const bar = new Blob();
    const baz = new Blob();
    const [result, files] = extractBlobs({
      foo: 1,
      bar,
      nested: {
        baz,
      },
    });
    expect(files).toContain(bar);
    expect(files).toContain(baz);
    expect(result).toStrictEqual({
      foo: 1,
      bar: placeholder,
      nested: {
        baz: placeholder,
      },
    });
  });

  it('should extract files from arrays', () => {
    const bar = new Blob();
    const baz = new Blob();
    const [result, files] = extractBlobs({
      foo: 1,
      bar,
      nested: [baz],
    });
    expect(files).toContain(bar);
    expect(files).toContain(baz);
    expect(result).toStrictEqual({
      foo: 1,
      bar: placeholder,
      nested: [placeholder],
    });
  });
});
