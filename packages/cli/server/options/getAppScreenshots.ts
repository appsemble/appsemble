import { readFile } from 'node:fs/promises';

import {
  AppScreenshot as AppScreenShotInterface,
  GetAppSubEntityParams,
} from 'packages/node-utils/server/types';
import { lookup } from 'mime-types';
import sharp from 'sharp';

export const getAppScreenshots = ({
  app,
}: GetAppSubEntityParams): Promise<AppScreenShotInterface[]> => {
  const appScreenshotsPromises = app.screenshotUrls.map(async (screenshotUrl, index) => {
    const screenshot = await readFile(`${app.path}/screenshots/${screenshotUrl}`);
    const img = sharp(screenshot);
    const { format, height, width } = await img.metadata();
    const mime = lookup(format);

    return {
      id: index,
      width,
      height,
      mime,
      screenshot,
    } as AppScreenShotInterface;
  });

  return Promise.all(appScreenshotsPromises);
};
