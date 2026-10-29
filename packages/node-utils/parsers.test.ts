import { Readable } from 'node:stream';

import FormData from 'form-data';
import { describe, expect, it } from 'vitest';

import { streamParser } from './parsers.js';
import { TempFile } from './server/types.js';

/**
 * Run `streamParser` against real multipart content.
 *
 * @param form The multipart form data to parse.
 * @returns The parsed body, containing a `TempFile` for every file field.
 */
function parseMultipart(form: FormData): Promise<Record<string, any>> {
  const req = Readable.from(form.getBuffer()) as any;
  req.headers = form.getHeaders();

  return streamParser(
    req,
    { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } },
    { resolveRef: (schema: any) => schema } as any,
    { req, openApi: { validate: () => ({ valid: true }) } } as any,
  ) as Promise<Record<string, any>>;
}

describe('streamParser', () => {
  it('should use the filename of a part that supplies one', async () => {
    const form = new FormData();
    form.append('file', Buffer.from('test'), { filename: 'test.bin' });

    const body = await parseMultipart(form);

    expect(body.file).toBeInstanceOf(TempFile);
    expect(body.file.filename).toBe('test.bin');
  });

  it('should leave the filename undefined for a part that supplies none', async () => {
    const form = new FormData();
    form.append('file', Buffer.from('test'));

    const body = await parseMultipart(form);

    expect(body.file).toBeInstanceOf(TempFile);
    expect(body.file.filename).toBeUndefined();
  });
});
