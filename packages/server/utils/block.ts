import { logger } from '@appsemble/node-utils';
import { type BlockManifest } from '@appsemble/types';
import {
  compareStrings,
  getAppBlocks,
  type IdentifiableBlock,
  parseBlockName,
} from '@appsemble/utils';
import axios from 'axios';
import { Op } from 'sequelize';

import { argv } from './argv.js';
import { App, BlockAsset, BlockMessages, BlockVersion, transactional } from '../models/index.js';

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
  // Call blockVersionToJson with a blockVersion that includes an Organization
  const blockName = `@${OrganizationId || Organization!.id}/${name}`;
  let iconUrl = null;
  if (blockVersion.icon || blockVersion.get('hasIcon')) {
    iconUrl = `/api/blocks/${blockName}/versions/${version}/icon`;
  } else if (blockVersion.Organization?.icon || blockVersion.Organization?.get('hasIcon')) {
    iconUrl = `/api/organizations/${Organization!.id}/icon?${new URLSearchParams({
      updated: blockVersion.Organization?.updated.toISOString(),
    })}`;
  }
  return {
    actions,
    description,
    events,
    examples,
    files: BlockAssets?.map((f) => f.filename).sort(compareStrings),
    iconUrl: iconUrl ?? null,
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
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      logger.warn(`Failed to synchronize block from ${blockUrl}`);
      return;
    }
    throw error;
  }
}

export async function getBlockVersions(blocks: IdentifiableBlock[]): Promise<BlockManifest[]> {
  const uniqueBlocks = blocks.map(({ type, version }) => {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore 2488 [...] | undefined must have a '[Symbol.iterator]()'
    const [OrganizationId, name] = parseBlockName(type);
    return {
      name,
      OrganizationId,
      version,
    };
  });
  const blockVersions = await BlockVersion.findAll({
    attributes: { exclude: ['id'] },
    where: { [Op.or]: uniqueBlocks },
  });
  const result: BlockManifest[] = blockVersions.map(blockVersionToJson);

  if (argv.remote) {
    const knownIdentifiers = new Set(
      blockVersions.map((block) => `@${block.OrganizationId}/${block.name}@${block.version}`),
    );
    const unknownBlocks = uniqueBlocks.filter(
      (block) => !knownIdentifiers.has(`@${block.OrganizationId}/${block.name}@${block.version}`),
    );
    const syncedBlocks = await Promise.all(unknownBlocks.map(syncBlock));
    result.push(...syncedBlocks.filter((block) => block !== undefined));
  }

  return result;
}

export async function findBlockInApps(
  blockName: string,
  blockVersion: string,
  organizationId: string,
): Promise<boolean> {
  const apps: App[] = await App.findAll({
    attributes: ['definition'],
  });
  for (const app of apps) {
    const blocks = getAppBlocks(app.definition);
    const usedBlocks = blocks.some(
      (block) => block.version === blockVersion && block.type === `@${organizationId}/${blockName}`,
    );
    if (usedBlocks) {
      return true;
    }
  }
  return false;
}
