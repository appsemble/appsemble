import { basename, join } from 'node:path';

import { opendirSafe } from '@appsemble/node-utils';
import {
  AppBlockStyle as AppBlockStyleInterface,
  GetAppBlockStylesParams,
} from '@appsemble/node-utils/types';

import { processCss } from '../../../lib/processCss.js';

export const getAppBlockStyles = async ({
  context,
  name,
}: GetAppBlockStylesParams): Promise<AppBlockStyleInterface[]> => {
  const { blockConfigs } = context;
  const blockConfig = blockConfigs.find((config) => config.name === name);

  let stylePath = '';
  await opendirSafe(
    join(blockConfig.dir, blockConfig.output),
    (fullPath, stat) => {
      if (!stat.isFile()) {
        return;
      }
      const filename = basename(fullPath);

      if (filename.endsWith('.css')) {
        stylePath = filename;
      }
    },
    { recursive: true },
  );

  const style = await processCss(stylePath);
  return [{ style }];
};
