import {
  getAppBlocks,
  normalizeBlockName,
  parseBlockName,
  type AppDefinition,
  type IdentifiableBlock,
} from '@appsemble/lang-sdk';
import { type BlockManifest } from '@appsemble/types';
import { compareStrings } from '@appsemble/utils';
import { Op, type Transaction } from 'sequelize';

import { AppBuildSnapshot, AppSnapshot, BlockAsset, BlockVersion } from '../models/index.js';

export type SnapshotBlockManifest = Pick<
  BlockManifest,
  'actions' | 'events' | 'files' | 'layout' | 'name' | 'version'
>;

export interface AppBuildManifest {
  version: 1;
  blockManifests: SnapshotBlockManifest[];
}

interface ResolveBlockManifestsParams {
  identifiableBlocks: IdentifiableBlock[];
  transaction?: Transaction;
}

interface PruneAppBuildSnapshotsParams {
  appId: number;
  AppSnapshotId: number;
  transaction?: Transaction;
}

export function getMissingBlockManifestIdentifiers(
  definition: AppDefinition,
  blockManifests: SnapshotBlockManifest[],
): string[] {
  const resolvedBlockIdentifiers = new Set(
    blockManifests.map(({ name, version }) => `${name}@${version}`),
  );

  return [
    ...new Set(
      getAppBlocks(definition)
        .map(({ type, version }) => `${normalizeBlockName(type)}@${version}`)
        .filter((identifier) => !resolvedBlockIdentifiers.has(identifier)),
    ),
  ].sort(compareStrings);
}

export async function resolveBlockManifests({
  identifiableBlocks,
  transaction,
}: ResolveBlockManifestsParams): Promise<SnapshotBlockManifest[]> {
  const blockQueries = identifiableBlocks.flatMap(({ type, version }) => {
    const parsedBlockName = parseBlockName(type);

    if (!parsedBlockName) {
      return [];
    }

    const [OrganizationId, name] = parsedBlockName;

    return [{ name, OrganizationId, version }];
  });

  if (!blockQueries.length) {
    return [];
  }

  const blockVersions = await BlockVersion.findAll({
    attributes: ['name', 'OrganizationId', 'version', 'layout', 'actions', 'events'],
    include: [
      {
        attributes: ['filename'],
        model: BlockAsset,
        where: {
          BlockVersionId: { [Op.col]: 'BlockVersion.id' },
        },
      },
    ],
    order: [
      ['OrganizationId', 'ASC'],
      ['name', 'ASC'],
      ['version', 'ASC'],
    ],
    transaction,
    where: {
      [Op.or]: blockQueries,
    },
  });

  return blockVersions
    .map(({ BlockAssets, OrganizationId, actions, events, layout, name, version }) => ({
      name: `@${OrganizationId}/${name}`,
      version,
      layout,
      actions,
      events,
      files: (BlockAssets ?? [])
        .map(({ filename }) => filename)
        .filter((filename) => !filename.endsWith('.map'))
        .sort(compareStrings),
    }))
    .sort((a, b) => compareStrings(`${a.name}@${a.version}`, `${b.name}@${b.version}`));
}

export async function createAppBuildManifest(
  definition: AppDefinition,
  transaction?: Transaction,
): Promise<AppBuildManifest> {
  return {
    version: 1,
    blockManifests: await resolveBlockManifests({
      identifiableBlocks: getAppBlocks(definition),
      transaction,
    }),
  };
}

export async function pruneAppBuildSnapshots({
  appId,
  AppSnapshotId,
  transaction,
}: PruneAppBuildSnapshotsParams): Promise<number> {
  const snapshots = await AppSnapshot.findAll({
    attributes: ['id'],
    transaction,
    where: { AppId: appId, id: { [Op.lt]: AppSnapshotId } },
  });
  const staleSnapshotIds = snapshots.map(({ id }) => id);

  if (!staleSnapshotIds.length) {
    return 0;
  }

  return AppBuildSnapshot.destroy({
    transaction,
    where: { AppSnapshotId: staleSnapshotIds },
  });
}
