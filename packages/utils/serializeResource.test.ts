import { describe, expect, it } from 'vitest';

import { deserializeResource, serializeResource } from './serializeResource.js';

describe('serializeResource', () => {
  it('should serialize nested blobs using the resource upload envelope', () => {
    const attachment = new Blob(['attachment'], { type: 'application/pdf' });
    const image = new Blob(['image'], { type: 'image/png' });

    const result = serializeResource({
      itemId: 123,
      metadata: {
        attachment,
        images: [image],
      },
    }) as FormData;

    expect(result).toBeInstanceOf(FormData);
    expect(result.get('resource')).toBe(
      '{"itemId":123,"metadata":{"attachment":"0","images":["1"]}}',
    );
    expect(result.getAll('assets')).toStrictEqual([
      expect.objectContaining({ size: attachment.size, type: attachment.type }),
      expect.objectContaining({ size: image.size, type: image.type }),
    ]);
  });
});

describe('deserializeResource', () => {
  it('should restore nested assets from the resource upload envelope', () => {
    const attachment = { filename: 'attachment.pdf' };
    const image = { filename: 'image.png' };

    expect(
      deserializeResource({
        assets: [attachment, image],
        resource: '{"itemId":123,"metadata":{"attachment":"0","images":["1"]}}',
      }),
    ).toStrictEqual({
      itemId: 123,
      metadata: {
        attachment,
        images: [image],
      },
    });
  });
});
