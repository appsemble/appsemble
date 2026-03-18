// CSpell:words bmff matroska theora
import { open, stat } from 'node:fs/promises';

import { MimeTypeCategory, getMimeTypeCategory } from '@appsemble/utils';
import { lookup } from 'mime-types';
import sharp from 'sharp';

interface UploadedFileLike {
  filename?: string | null;
  mime: string;
  path: string;
}

const headerLength = 4096;

const isoBmffImageBrands = new Set([
  'avif',
  'avis',
  'heic',
  'heif',
  'heim',
  'heis',
  'heix',
  'hevc',
  'hevx',
  'mif1',
  'msf1',
]);

const isoBmffThreeGppBrands = new Set([
  '3ge6',
  '3ge7',
  '3gg6',
  '3gp1',
  '3gp2',
  '3gp3',
  '3gp4',
  '3gp5',
  '3gp6',
  '3gr6',
  '3gs6',
  '3gs7',
]);

const isoBmffThreeGpp2Brands = new Set(['3g2a', '3g2b']);

const isoBmffVideoBrands = new Set([
  ...isoBmffThreeGppBrands,
  ...isoBmffThreeGpp2Brands,
  'avc1',
  'dash',
  'f4v ',
  'F4V ',
  'iso2',
  'iso3',
  'iso4',
  'iso5',
  'iso6',
  'iso7',
  'iso8',
  'isom',
  'M4V ',
  'M4VH',
  'M4VP',
  'mmp4',
  'mp41',
  'mp42',
  'mp4v',
  'mp71',
  'MSNV',
  'piff',
  'qt  ',
]);

export class AssetUploadValidationError extends Error {
  readonly Category: MimeTypeCategory.Image | MimeTypeCategory.Video;

  constructor(message: string, category: MimeTypeCategory.Image | MimeTypeCategory.Video) {
    super(message);
    this.name = 'AssetUploadValidationError';
    this.Category = category;
  }
}

function getIsoBmffBrands(buffer: Buffer): string[] {
  if (buffer.length < 16 || buffer.toString('ascii', 4, 8) !== 'ftyp') {
    return [];
  }

  const brands = [buffer.toString('ascii', 8, 12)];
  const limit = Math.min(buffer.length, 64);

  for (let offset = 16; offset + 4 <= limit; offset += 4) {
    brands.push(buffer.toString('ascii', offset, offset + 4));
  }

  return brands;
}

function detectSvgMime(buffer: Buffer): string | null {
  const content = buffer
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .trimStart();

  if (!content.startsWith('<')) {
    return null;
  }

  return /<svg[\s>]/i.test(content) ? 'image/svg+xml' : null;
}

function detectIsoBmffMime(buffer: Buffer, declaredMime: string): string | null {
  const declaredCategory = getMimeTypeCategory(declaredMime);
  const brands = getIsoBmffBrands(buffer);

  if (!brands.length) {
    return null;
  }

  for (const brand of brands) {
    if (isoBmffImageBrands.has(brand)) {
      return ['avif', 'avis'].includes(brand) ? 'image/avif' : 'image/heif';
    }
  }

  for (const brand of brands) {
    if (!isoBmffVideoBrands.has(brand)) {
      continue;
    }

    if (brand === 'qt  ') {
      return 'video/quicktime';
    }

    if (isoBmffThreeGppBrands.has(brand)) {
      return 'video/3gpp';
    }

    if (isoBmffThreeGpp2Brands.has(brand)) {
      return 'video/3gpp2';
    }

    return 'video/mp4';
  }

  if (declaredCategory === MimeTypeCategory.Image) {
    return declaredMime;
  }

  if (declaredCategory === MimeTypeCategory.Video) {
    return declaredMime || 'video/mp4';
  }

  return null;
}

function detectImageMime(buffer: Buffer, declaredMime: string): string | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (buffer.length >= 6) {
    const gifSignature = buffer.toString('ascii', 0, 6);
    if (gifSignature === 'GIF87a' || gifSignature === 'GIF89a') {
      return 'image/gif';
    }
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  if (
    buffer.length >= 4 &&
    ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
      (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a))
  ) {
    return 'image/tiff';
  }

  if (buffer.length >= 2 && buffer.toString('ascii', 0, 2) === 'BM') {
    return 'image/bmp';
  }

  return detectSvgMime(buffer) ?? detectIsoBmffMime(buffer, declaredMime);
}

function detectVideoMime(buffer: Buffer, declaredMime: string): string | null {
  const isoBmffMime = detectIsoBmffMime(buffer, declaredMime);
  if (isoBmffMime?.startsWith('video/')) {
    return isoBmffMime;
  }

  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    const content = buffer.toString('ascii').toLowerCase();

    if (content.includes('webm')) {
      return 'video/webm';
    }

    if (content.includes('matroska')) {
      return 'video/x-matroska';
    }
  }

  if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'OggS') {
    const content = buffer.toString('ascii').toLowerCase();
    if (content.includes('theora') || declaredMime === 'video/ogg') {
      return 'video/ogg';
    }
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'AVI '
  ) {
    return 'video/x-msvideo';
  }

  return null;
}

function normalizeImageMime(format: string): string | null {
  const mime = lookup(format);

  if (mime) {
    return mime;
  }

  if (format === 'heif') {
    return 'image/heif';
  }

  return null;
}

async function readHeader(path: string): Promise<Buffer> {
  const file = await open(path, 'r');

  try {
    const { size } = await file.stat();
    const buffer = Buffer.alloc(Math.min(size, headerLength));

    if (buffer.length) {
      await file.read(buffer, 0, buffer.length, 0);
    }

    return buffer;
  } finally {
    await file.close();
  }
}

export async function validateUploadedFile({ mime, path }: UploadedFileLike): Promise<string> {
  const declaredCategory = getMimeTypeCategory(mime);
  const { size } = await stat(path);
  const buffer = await readHeader(path);
  const detectedMime = detectImageMime(buffer, mime) ?? detectVideoMime(buffer, mime);
  const detectedCategory = detectedMime ? getMimeTypeCategory(detectedMime) : null;
  const category = detectedCategory ?? declaredCategory;

  if (category !== MimeTypeCategory.Image && category !== MimeTypeCategory.Video) {
    return mime;
  }

  if (size === 0) {
    throw new AssetUploadValidationError(
      `${category === MimeTypeCategory.Image ? 'Image' : 'Video'} uploads cannot be empty`,
      category,
    );
  }

  if (
    declaredCategory &&
    detectedCategory &&
    declaredCategory !== detectedCategory &&
    [MimeTypeCategory.Image, MimeTypeCategory.Video].includes(declaredCategory)
  ) {
    throw new AssetUploadValidationError(
      declaredCategory === MimeTypeCategory.Image
        ? 'Image uploads must contain a valid image'
        : 'Video uploads must contain a supported video container',
      declaredCategory as MimeTypeCategory.Image | MimeTypeCategory.Video,
    );
  }

  if (declaredCategory === MimeTypeCategory.Image || detectedCategory === MimeTypeCategory.Image) {
    try {
      const metadata = await sharp(path).metadata();

      if (!metadata.format) {
        throw new Error('Missing image format');
      }

      const normalizedMime = normalizeImageMime(metadata.format);

      if (!normalizedMime) {
        throw new Error(`Unsupported image format: ${metadata.format}`);
      }

      return normalizedMime;
    } catch {
      throw new AssetUploadValidationError(
        'Image uploads must contain a valid image',
        MimeTypeCategory.Image,
      );
    }
  }

  if (declaredCategory === MimeTypeCategory.Video || detectedCategory === MimeTypeCategory.Video) {
    if (detectedCategory !== MimeTypeCategory.Video || !detectedMime) {
      throw new AssetUploadValidationError(
        'Video uploads must contain a supported video container',
        MimeTypeCategory.Video,
      );
    }

    return detectedMime;
  }

  return mime;
}
