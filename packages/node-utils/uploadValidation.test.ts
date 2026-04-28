// CSpell:words bmff isom
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { validateUploadedFile } from './uploadValidation.js';

async function withTempFile(contents: Buffer, fn: (path: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'upload-validation-'));
  const path = join(dir, 'upload.bin');

  try {
    await writeFile(path, contents);
    await fn(path);
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
}

function createIsoBmffHeader(majorBrand: string, compatibleBrands = [majorBrand]): Buffer {
  const size = 16 + compatibleBrands.length * 4;
  const buffer = Buffer.alloc(size);

  buffer.writeUInt32BE(size, 0);
  buffer.write('ftyp', 4, 'ascii');
  buffer.write(majorBrand, 8, 'ascii');
  buffer.writeUInt32BE(0x00_00_02_00, 12);

  for (const [index, brand] of compatibleBrands.entries()) {
    buffer.write(brand, 16 + index * 4, 'ascii');
  }

  return buffer;
}

describe('validateUploadedFile', () => {
  it('should detect image mime from content', async () => {
    const image = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await withTempFile(image, async (path) => {
      expect(
        await validateUploadedFile({
          filename: 'test.bin',
          mime: 'application/octet-stream',
          path,
        }),
      ).toBe('image/png');
    });
  });

  it('should reject invalid image uploads', async () => {
    await withTempFile(Buffer.from('not an image'), async (path) => {
      await expect(
        validateUploadedFile({ filename: 'broken.png', mime: 'image/png', path }),
      ).rejects.toMatchObject({
        message: 'Image uploads must contain a valid image',
        name: 'AssetUploadValidationError',
      });
    });
  });

  it('should accept supported video containers', async () => {
    await withTempFile(createIsoBmffHeader('isom', ['isom', 'mp41']), async (path) => {
      expect(
        await validateUploadedFile({
          filename: 'clip.mp4',
          mime: 'application/octet-stream',
          path,
        }),
      ).toBe('video/mp4');
    });
  });

  it('should detect 3gpp uploads from content', async () => {
    await withTempFile(createIsoBmffHeader('3gp4', ['3gp4', 'isom']), async (path) => {
      expect(
        await validateUploadedFile({
          filename: 'clip.3gp',
          mime: 'application/octet-stream',
          path,
        }),
      ).toBe('video/3gpp');
    });
  });

  it('should detect 3gpp2 uploads from content', async () => {
    await withTempFile(createIsoBmffHeader('3g2a', ['3g2a', 'isom']), async (path) => {
      expect(
        await validateUploadedFile({
          filename: 'clip.3g2',
          mime: 'application/octet-stream',
          path,
        }),
      ).toBe('video/3gpp2');
    });
  });

  it('should detect quicktime uploads from content', async () => {
    await withTempFile(createIsoBmffHeader('qt  ', ['qt  ']), async (path) => {
      expect(
        await validateUploadedFile({
          filename: 'clip.mov',
          mime: 'application/octet-stream',
          path,
        }),
      ).toBe('video/quicktime');
    });
  });

  it('should reject invalid video uploads', async () => {
    await withTempFile(Buffer.from('not a video'), async (path) => {
      await expect(
        validateUploadedFile({ filename: 'broken.mp4', mime: 'video/mp4', path }),
      ).rejects.toMatchObject({
        message: 'Video uploads must contain a supported video container',
        name: 'AssetUploadValidationError',
      });
    });
  });
});
