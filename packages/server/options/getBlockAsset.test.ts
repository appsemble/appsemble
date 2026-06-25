import { afterEach, describe, expect, it, vi } from 'vitest';

import { getBlockAsset } from './getBlockAsset.js';
import { BlockAsset, BlockVersion } from '../models/index.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getBlockAsset', () => {
  it('should fetch the block version first and then fetch the asset by BlockVersionId', async () => {
    const blockVersion = { id: 'version-id' };
    const blockAsset = { mime: 'application/javascript', content: Buffer.from('console.log(1)') };

    const findVersion = vi
      .spyOn(BlockVersion, 'findOne')
      .mockResolvedValueOnce(blockVersion as never);
    const findAsset = vi.spyOn(BlockAsset, 'findOne').mockResolvedValueOnce(blockAsset as never);

    const result = await getBlockAsset({
      context: {} as never,
      filename: 'form.js.map',
      name: '@appsemble/form',
      version: '1.0.0',
    });

    expect(findVersion).toHaveBeenCalledWith({
      attributes: ['id'],
      where: { OrganizationId: 'appsemble', name: 'form', version: '1.0.0' },
    });
    expect(findAsset).toHaveBeenCalledWith({
      attributes: ['mime', 'content'],
      where: { filename: 'form.js.map', BlockVersionId: 'version-id' },
    });
    expect(result).toBe(blockAsset);
  });

  it('should return null if the block version does not exist', async () => {
    const findVersion = vi.spyOn(BlockVersion, 'findOne').mockResolvedValueOnce(null);
    const findAsset = vi.spyOn(BlockAsset, 'findOne').mockResolvedValueOnce({} as never);

    const result = await getBlockAsset({
      context: {} as never,
      filename: 'form.js.map',
      name: '@appsemble/form',
      version: '1.0.0',
    });

    expect(findVersion).toHaveBeenCalledTimes(1);
    expect(findAsset).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
