import { describe, expect, it, vi } from 'vitest';

import { processResourceBody } from './resource.js';
import * as uploadValidation from './uploadValidation.js';

describe('processResourceBody', () => {
  it('should rethrow unexpected upload validation errors', async () => {
    vi.spyOn(uploadValidation, 'validateUploadedFile').mockRejectedValue(new Error('boom'));

    await expect(
      processResourceBody(
        { request: { method: 'POST' } } as any,
        {
          schema: {
            type: 'object',
            properties: {
              file: { type: 'string', format: 'binary' },
            },
            required: ['file'],
          },
        } as any,
        [],
        undefined,
        [],
        false,
        {
          resource: { file: '0' },
          assets: [{ filename: 'asset.bin', mime: 'application/octet-stream', path: '/tmp/asset' }],
        },
      ),
    ).rejects.toThrow('boom');
  });
});
