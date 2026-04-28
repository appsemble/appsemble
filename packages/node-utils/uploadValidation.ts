// CSpell:words theora
import { open, stat } from 'node:fs/promises';

import { MimeTypeCategory, getMimeTypeCategory } from '@appsemble/utils';
import { fileTypeFromBuffer } from 'file-type';
import { lookup } from 'mime-types';
import sharp from 'sharp';

interface UploadedFileLike {
  filename?: string | null;
  mime: string;
  path: string;
}

const headerLength = 4096;

export class AssetUploadValidationError extends Error {
  readonly Category: MimeTypeCategory.Image | MimeTypeCategory.Video;

  constructor(message: string, category: MimeTypeCategory.Image | MimeTypeCategory.Video) {
    super(message);
    this.name = 'AssetUploadValidationError';
    this.Category = category;
  }
}

function detectSvgMime(buffer: Buffer): string | null {
  const content = buffer
    .toString('utf8')
    .replace(/^\uFEFF/u, '')
    .trimStart();

  if (!content.startsWith('<')) {
    return null;
  }

  return /<svg[\s>]/i.test(content) ? 'image/svg+xml' : null;
}

function detectOggVideoMime(buffer: Buffer, declaredMime: string): string | null {
  if (buffer.length < 4 || buffer.toString('ascii', 0, 4) !== 'OggS') {
    return null;
  }

  const content = buffer.toString('ascii').toLowerCase();

  if (content.includes('theora') || declaredMime === 'video/ogg') {
    return 'video/ogg';
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

function normalizeDetectedMime(mime: string): string {
  if (mime === 'video/vnd.avi') {
    return 'video/x-msvideo';
  }

  return mime;
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

async function detectMime(buffer: Buffer, declaredMime: string): Promise<string | null> {
  const svgMime = detectSvgMime(buffer);
  if (svgMime) {
    return svgMime;
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (detected) {
    return normalizeDetectedMime(detected.mime);
  }

  return detectOggVideoMime(buffer, declaredMime);
}

export async function validateUploadedFile({ mime, path }: UploadedFileLike): Promise<string> {
  const declaredCategory = getMimeTypeCategory(mime);
  const { size } = await stat(path);
  const buffer = await readHeader(path);
  const detectedMime = await detectMime(buffer, mime);
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
