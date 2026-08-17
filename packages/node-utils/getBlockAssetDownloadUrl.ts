import { type BlockManifest } from '@appsemble/types';

const blockAssetUnsafePathPattern = /(^|\/)\.{1,2}(\/|$)|^\/|\\/;

export function isValidBlockAssetFilename(filename: string): boolean {
  if (!filename || blockAssetUnsafePathPattern.test(filename)) {
    return false;
  }

  for (let i = 0; i < filename.length; i += 1) {
    if (filename.charCodeAt(i) < 0x20) {
      return false;
    }
  }

  return true;
}

export function getBlockAssetDownloadUrl(
  blockUrl: string,
  fileUrls: BlockManifest['fileUrls'],
  filename: string,
): string {
  const fileUrl = fileUrls && Object.hasOwn(fileUrls, filename) ? fileUrls[filename] : undefined;

  if (fileUrl) {
    return fileUrl;
  }

  const fallbackUrl = new URL(`${blockUrl.replace(/\/+$/, '')}/asset`);
  fallbackUrl.searchParams.set('filename', filename);
  return String(fallbackUrl);
}
