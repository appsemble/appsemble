import { describe, expect, it } from 'vitest';

import { createFormData } from './formData.js';

describe('createFormData', () => {
  it('should handle strings', () => {
    const form = createFormData({ foo: 'bar' });
    const boundary = form.getBoundary();
    expect(String(form.getBuffer())).toBe(
      `--${boundary}\r
Content-Disposition: form-data; name="foo"\r
\r
bar\r
--${boundary}--\r
`,
    );
  });

  it('should handle numbers', () => {
    const form = createFormData({ answer: 42 });
    const boundary = form.getBoundary();
    expect(String(form.getBuffer())).toBe(
      `--${boundary}\r
Content-Disposition: form-data; name="answer"\r
\r
42\r
--${boundary}--\r
`,
    );
  });

  it('should handle booleans', () => {
    const form = createFormData({ really: true });
    const boundary = form.getBoundary();
    expect(String(form.getBuffer())).toBe(
      `--${boundary}\r
Content-Disposition: form-data; name="really"\r
\r
true\r
--${boundary}--\r
`,
    );
  });

  it('should handle buffers', () => {
    const form = createFormData({ buf: Buffer.from('fer') });
    const boundary = form.getBoundary();
    expect(String(form.getBuffer())).toBe(
      `--${boundary}\r
Content-Disposition: form-data; name="buf"\r
Content-Type: application/octet-stream\r
\r
fer\r
--${boundary}--\r
`,
    );
  });

  it('should handle null', () => {
    const form = createFormData({ really: true });
    const boundary = form.getBoundary();
    expect(String(form.getBuffer())).toBe(
      `--${boundary}\r
Content-Disposition: form-data; name="really"\r
\r
true\r
--${boundary}--\r
`,
    );
  });

  it('should ignore undefined', () => {
    const form = createFormData({ defined: undefined });
    const boundary = form.getBoundary();
    expect(String(form.getBuffer())).toBe(`--${boundary}--\r\n`);
  });

  it('should convert objects to JSON', () => {
    const form = createFormData({ deeply: { nested: 'data' } });
    const boundary = form.getBoundary();
    expect(String(form.getBuffer())).toBe(
      `--${boundary}\r
Content-Disposition: form-data; name="deeply"\r
\r
{"nested":"data"}\r
--${boundary}--\r
`,
    );
  });

  it('should append multiple entries if the input is an array', () => {
    const form = createFormData({ array: [42, 'bananas', null, { fruit: true }] });
    const boundary = form.getBoundary();
    expect(String(form.getBuffer())).toBe(
      `--${boundary}\r
Content-Disposition: form-data; name="array"\r
\r
42\r
--${boundary}\r
Content-Disposition: form-data; name="array"\r
\r
bananas\r
--${boundary}\r
Content-Disposition: form-data; name="array"\r
\r
null\r
--${boundary}\r
Content-Disposition: form-data; name="array"\r
\r
{"fruit":true}\r
--${boundary}--\r
`,
    );
  });
});
