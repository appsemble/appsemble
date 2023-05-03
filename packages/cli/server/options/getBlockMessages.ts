import {
  type BlockMessages as BlockMessagesInterface,
  type GetBlockMessagesParams,
} from '@appsemble/node-utils';

export function getBlockMessages({
  context,
}: GetBlockMessagesParams): Promise<BlockMessagesInterface[]> {
  return Promise.resolve(context.appBlocks);
}
