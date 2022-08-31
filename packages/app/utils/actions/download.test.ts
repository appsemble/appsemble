import { createTestAction } from '../makeActions.js';

let anchor: HTMLAnchorElement;

beforeEach(() => {
  import.meta.jest
    .spyOn(URL, 'createObjectURL')
    .mockReturnValue(`blob:${window.location.origin}/12345678-90ab-cdef-1234-567890abcdef`);
  import.meta.jest.spyOn(URL, 'revokeObjectURL');
  import.meta.jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
    anchor = {
      tagName: tagName.toUpperCase(),
      click: import.meta.jest.fn(),
    } as Partial<HTMLElement> as HTMLAnchorElement;
    return anchor;
  });
});

describe('download', () => {
  it('should download string data as-is', async () => {
    const action = createTestAction({
      definition: { type: 'download', filename: 'data.txt' },
    });
    const result = await action('This is a string');
    expect(result).toBe('This is a string');
    expect(URL.createObjectURL).toHaveBeenCalledWith(new Blob(['This is a string']));
    expect(anchor.tagName).toBe('A');
    expect(anchor.href).toBe('blob:http://localhost/12345678-90ab-cdef-1234-567890abcdef');
    expect(anchor.download).toBe('data.txt');
    expect(anchor.click).toHaveBeenCalledWith();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      'blob:http://localhost/12345678-90ab-cdef-1234-567890abcdef',
    );
  });

  it('should download a Blob as-is', async () => {
    const blob = new Blob(['PNG']);
    const action = createTestAction({
      definition: { type: 'download', filename: 'data.png' },
    });
    const result = await action(blob);
    expect(result).toBe(blob);
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(anchor.tagName).toBe('A');
    expect(anchor.href).toBe('blob:http://localhost/12345678-90ab-cdef-1234-567890abcdef');
    expect(anchor.download).toBe('data.png');
    expect(anchor.click).toHaveBeenCalledWith();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      'blob:http://localhost/12345678-90ab-cdef-1234-567890abcdef',
    );
  });

  it('should download objects as JSON', async () => {
    const data = { hello: 'world' };
    const action = createTestAction({
      definition: { type: 'download', filename: 'hello.json' },
    });
    const result = await action(data);
    expect(result).toBe(data);
    expect(URL.createObjectURL).toHaveBeenCalledWith(new Blob(['{\n  "hello": "world"\n}\n']));
    expect(anchor.tagName).toBe('A');
    expect(anchor.href).toBe('blob:http://localhost/12345678-90ab-cdef-1234-567890abcdef');
    expect(anchor.download).toBe('hello.json');
    expect(anchor.click).toHaveBeenCalledWith();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      'blob:http://localhost/12345678-90ab-cdef-1234-567890abcdef',
    );
  });
});
