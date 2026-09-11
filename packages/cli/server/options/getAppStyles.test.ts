import { type GetAppSubEntityParams } from '@appsemble/node-utils';
import { describe, expect, it } from 'vitest';

import { getAppStyles } from './getAppStyles.js';

function createParams(coreStyle: string, sharedStyle: string): GetAppSubEntityParams {
  return {
    context: {
      apiUrl: 'http://localhost:9191',
      appsembleApp: { id: 1, coreStyle, sharedStyle },
    },
  } as unknown as GetAppSubEntityParams;
}

describe('getAppStyles', () => {
  it('should resolve asset functions to app asset URLs on the development API', async () => {
    const styles = await getAppStyles(
      createParams(
        "@font-face{src:url(asset('brand.woff2'))}",
        "p{background:url(asset('paper'))}",
      ),
    );

    expect(styles).toStrictEqual({
      coreStyle: "@font-face{src:url('http://localhost:9191/api/apps/1/assets/brand.woff2')}",
      sharedStyle: "p{background:url('http://localhost:9191/api/apps/1/assets/paper')}",
    });
  });

  it('should leave styles without asset functions untouched', async () => {
    const styles = await getAppStyles(
      createParams('body{color:red}', "p{background:url('../assets/paper.png')}"),
    );

    expect(styles).toStrictEqual({
      coreStyle: 'body{color:red}',
      sharedStyle: "p{background:url('../assets/paper.png')}",
    });
  });
});
