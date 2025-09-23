import { type IconName } from '@fortawesome/fontawesome-common-types';

export enum MimeTypeCategory {
  Image = 'image',
  Video = 'video',
  PDF = 'pdf',
  Wordprocessing = 'wordprocessing',
  Spreadsheet = 'spreadsheet',
  Presentation = 'presentation',
  Archive = 'archive',
}

const mimeTypeCategories: Record<MimeTypeCategory, string[]> = {
  [MimeTypeCategory.Image]: ['image/jpeg', 'image/png', 'image/gif', 'image/*'],
  [MimeTypeCategory.Video]: ['video/mp4', 'video/webm', 'video/ogg', 'video/*'],
  [MimeTypeCategory.PDF]: ['application/pdf'],
  [MimeTypeCategory.Wordprocessing]: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  [MimeTypeCategory.Spreadsheet]: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  [MimeTypeCategory.Presentation]: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  [MimeTypeCategory.Archive]: ['application/zip'],
};

/**
 * Puts a mimetype into one of the predefined categories.
 *
 * Wildcard behavior is supported.
 *
 * @param mimeType A mimetype to categorize
 * @returns A category that the mimetype falls into or null if no category is found
 */
export function getMimeTypeCategory(mimeType: string): MimeTypeCategory | null {
  const [mimeBaseType, mimeSubType] = mimeType.split('/');

  const [category] = Object.entries(mimeTypeCategories).find(([, types]) =>
    types.some((type) => {
      const [baseType, subType] = type.split('/');
      return baseType === mimeBaseType && (subType === '*' || subType === mimeSubType);
    }),
  ) ?? [null];

  return category as MimeTypeCategory;
}

export function getMimeTypeCategories(mimeTypes: string[]): (MimeTypeCategory | null)[] {
  return Array.from(new Set(mimeTypes.map(getMimeTypeCategory).filter((cat) => cat != null)));
}

export type FileIconName = IconName | `file-${string}`;

export function getMimeTypeIcon(category: MimeTypeCategory | null): FileIconName {
  switch (category) {
    case MimeTypeCategory.Image:
    case MimeTypeCategory.Video:
    case MimeTypeCategory.PDF:
      return `file-${category}`;
    case MimeTypeCategory.Wordprocessing:
      return 'file-word';
    case MimeTypeCategory.Spreadsheet:
      return 'file-excel';
    case MimeTypeCategory.Presentation:
      return 'file-powerpoint';
    case MimeTypeCategory.Archive:
      return 'file-zipper';
    default:
      return 'file';
  }
}

/**
 * Extracts the filename from a Content-Disposition header string.
 *
 * @param contentDisposition The Content-Disposition header string
 * @returns The name of the file or null if it's not present
 */
export function getFilenameFromContentDisposition(contentDisposition: string): string | null {
  const filenameRegex = /filename="([^"]+)"/;
  const matches = filenameRegex.exec(contentDisposition);

  if (matches != null && matches[1]) {
    return matches[1].replaceAll(/["']/g, '');
  }

  return null;
}
