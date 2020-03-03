// eslint-disable-next-line filenames/match-exported
import { Block } from '@appsemble/sdk';
import { AppDefinition } from '@appsemble/types';

export default function getAppBlocks(definition: AppDefinition): { [path: string]: Block };
