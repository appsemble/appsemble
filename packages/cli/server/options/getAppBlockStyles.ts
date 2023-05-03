import {
  type AppBlockStyle as AppBlockStyleInterface,
  type GetAppBlockStylesParams,
} from '@appsemble/node-utils';

import { processCss } from '../../lib/processCss.js';

export async function getAppBlockStyles({
  context,
  name,
}: GetAppBlockStylesParams): Promise<AppBlockStyleInterface[]> {
  const { appBlocks, blockConfigs } = context;

  const block = appBlocks.find((appBlock) => appBlock.name === name);
  const blockConfig = blockConfigs.find((config) => config.name === name);

  const filename = block.files.find((file) => file.endsWith('.css'));
  const stylePath = `${blockConfig.dir}/${blockConfig.output}/${filename}`;

  const style = filename ? await processCss(stylePath) : null;
  return [...(filename ? [{ style }] : [])];
}
