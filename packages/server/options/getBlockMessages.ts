import {
  type BlockMessages as BlockMessagesInterface,
  type GetBlockMessagesParams,
} from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import { Op } from 'sequelize';

import { BlockMessages, BlockVersion } from '../models/index.js';

export async function getBlockMessages({
  baseLang,
  blockQuery,
  lang,
}: GetBlockMessagesParams): Promise<BlockMessagesInterface[]> {
  const blockVersions = await BlockVersion.findAll({
    attributes: ['name', 'version', 'OrganizationId', 'id'],
    where: {
      [Op.or]: blockQuery,
    },
    include: [
      {
        model: BlockMessages,
        where: {
          language: baseLang ? [lang, baseLang, defaultLocale] : [lang, defaultLocale],
        },
      },
    ],
  });

  return blockVersions.map((blockVersion) => {
    const messages = {} as Record<string, Record<string, any>>;

    for (const blockMessage of blockVersion.BlockMessages) {
      messages[blockMessage.language] = blockMessage.messages;
    }

    return {
      name: `@${blockVersion.OrganizationId}/${blockVersion.name}`,
      version: blockVersion.version,
      messages,
    };
  });
}
