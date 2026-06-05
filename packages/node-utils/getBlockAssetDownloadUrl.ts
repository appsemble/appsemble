import { type BlockManifest } from '@appsemble/types';

export function getBlockAssetDownloadUrl(
  blockUrl: string,
  fileUrls: BlockManifest['fileUrls'],
  filename: string,
): string {
  const fileUrl = fileUrls?.[filename];

  if (fileUrl) {
    return fileUrl;
  }

  const fallbackUrl = new URL(`${blockUrl.replace(/\/+$/, '')}/asset`);
  fallbackUrl.searchParams.set('filename', filename);
  return String(fallbackUrl);
}
