import { logger } from '@appsemble/node-utils';
import { BlockManifest } from '@appsemble/types';
import { compareStrings } from '@appsemble/utils';
import axios from 'axios';

import { BlockAsset, BlockMessages, BlockVersion, transactional } from '../models/index.js';
import { argv } from './argv.js';

export function blockVersionToJson(blockVersion: BlockVersion): BlockManifest {
  const {
    BlockAssets,
    Organization,
    OrganizationId,
    actions,
    description,
    events,
    examples,
    layout,
    longDescription,
    name,
    parameters,
    version,
    wildcardActions,
  } = blockVersion;
  const blockName = `@${OrganizationId || Organization.id}/${name}`;
  let iconUrl = null;
  if (blockVersion.icon || blockVersion.get('hasIcon')) {
    iconUrl = `/api/blocks/${blockName}/versions/${version}/icon`;
  } else if (blockVersion.Organization?.icon || blockVersion.Organization?.get('hasIcon')) {
    iconUrl = `/api/organizations/${Organization.id}/icon?${new URLSearchParams({
      updated: blockVersion.Organization?.updated.toISOString(),
    })}`;
  }
  return {
    actions,
    description,
    events,
    examples,
    files: BlockAssets?.map((f) => f.filename).sort(compareStrings),
    iconUrl,
    layout,
    longDescription,
    name: blockName,
    parameters,
    version,
    wildcardActions,
    languages: blockVersion.BlockMessages?.length
      ? blockVersion.BlockMessages.map((m) => m.language).sort(compareStrings)
      : null,
  };
}

export async function syncBlock({
  OrganizationId,
  name,
  version,
}: Pick<BlockVersion, 'name' | 'OrganizationId' | 'version'>): Promise<BlockManifest | undefined> {
  const id = `@${OrganizationId}/${name}`;
  const blockUrl = String(new URL(`/api/blocks/${id}/versions/${version}`, argv.remote));
  logger.info(`Synchronizing block from ${blockUrl}`);
  try {
    const { data: block } = await axios.get<BlockManifest>(blockUrl);
    if (block.name !== id) {
      return;
    }
    if (block.version !== version) {
      return;
    }
    await transactional(async (transaction) => {
      const { id: BlockVersionId } = await BlockVersion.create(
        { ...block, OrganizationId, name, version },
        { transaction },
      );

      const promises = block.files.map(async (filename) => {
        const { data: content, headers } = await axios.get(`${blockUrl}/asset`, {
          params: { filename },
          responseType: 'arraybuffer',
        });
        const [mime] = headers['content-type'].split(';');
        await BlockAsset.create({ BlockVersionId, content, mime, filename }, { transaction });
      });

      if (block.languages) {
        promises.push(
          ...block.languages.map(async (language) => {
            const { data: messages } = await axios.get(`${blockUrl}/messages/${language}`);
            await BlockMessages.create({ BlockVersionId, language, messages }, { transaction });
          }),
        );
      }

      await Promise.all(promises);
    });
    logger.info(`Synchronized block from ${blockUrl}`);
    return block;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response.status === 404) {
      logger.warn(`Failed to synchronize block from ${blockUrl}`);
      return;
    }
    throw error;
  }
}
