import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { validateUploadedFile } from '../../packages/node-utils/uploadValidation.js';

test('HEIC uploads produce correctly sized and colored JPEG images', async () => {
  const path = fileURLToPath(new URL('../assets/image-pattern.heic', import.meta.url));
  assert.equal(await validateUploadedFile({ mime: 'image/heic', path }), 'image/heif');

  // The fixture contains a red left half and a blue right half, encoded with HEVC.
  const jpeg = await sharp(path)
    .rotate()
    .resize(32, 16, { fit: 'inside' })
    .jpeg({ chromaSubsampling: '4:4:4' })
    .toBuffer();
  const { data, info } = await sharp(jpeg).raw().toBuffer({ resolveWithObject: true });

  assert.equal(info.width, 32);
  assert.equal(info.height, 16);
  assert.equal(info.channels, 3);
  const left = (8 * info.width + 8) * info.channels;
  const right = (8 * info.width + 24) * info.channels;
  assert.ok(data[left] > 240);
  assert.ok(data[left + 2] < 15);
  assert.ok(data[right] < 15);
  assert.ok(data[right + 2] > 240);
});

for (const format of ['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif']) {
  test(`${format} images can be encoded and decoded`, async () => {
    const encoded = await sharp({
      create: { width: 8, height: 6, channels: 3, background: { r: 200, g: 50, b: 25 } },
    })
      .toFormat(format)
      .toBuffer();
    const { data, info } = await sharp(encoded)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    assert.equal(info.width, 8);
    assert.equal(info.height, 6);
    assert.ok(Math.abs(data[0] - 200) <= 10);
    assert.ok(Math.abs(data[1] - 50) <= 10);
    assert.ok(Math.abs(data[2] - 25) <= 10);
  });
}

test('PNG transparency survives WebP conversion', async () => {
  const png = await sharp({
    create: { width: 8, height: 6, channels: 4, background: { r: 200, g: 50, b: 25, alpha: 0.5 } },
  })
    .png()
    .toBuffer();
  const webp = await sharp(png).webp().toBuffer();
  const { data, info } = await sharp(webp).raw().toBuffer({ resolveWithObject: true });

  assert.equal(info.channels, 4);
  assert.equal(data[3], 128);
});

test('SVG images can be rasterized', async () => {
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"><rect width="8" height="6" fill="red"/></svg>',
  );
  const { data, info } = await sharp(svg).raw().toBuffer({ resolveWithObject: true });

  assert.equal(info.width, 8);
  assert.equal(info.height, 6);
  assert.equal(data[0], 255);
  assert.equal(data[1], 0);
  assert.equal(data[2], 0);
});
