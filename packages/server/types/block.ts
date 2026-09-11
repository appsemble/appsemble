import { type TempFile } from '@appsemble/node-utils';
import { type BlockManifest } from '@appsemble/types';

export interface PublishBlockBody extends Omit<BlockManifest, 'fileUrls' | 'files'> {
  files: TempFile[];
  icon: TempFile;
  examples: string[];
}
