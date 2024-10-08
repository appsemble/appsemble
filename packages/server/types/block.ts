import { type BlockManifest } from '@appsemble/types';
import { type File } from 'koas-body-parser';

export interface PublishBlockBody extends Omit<BlockManifest, 'files'> {
  files: File[];
  icon: File;
  examples: string[];
}
