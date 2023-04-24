import {
  BlockMessages as BlockMessagesInterface,
  GetBlockMessagesParams,
} from '@appsemble/node-utils/server/types';

export const getBlockMessages = ({
  context,
}: GetBlockMessagesParams): Promise<BlockMessagesInterface[]> => Promise.resolve(context.appBlocks);
