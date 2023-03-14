import {
  AppScreenshot as AppScreenShotInterface,
  GetAppSubEntityParams,
} from '@appsemble/node-utils/types';

import { AppScreenshot } from '../../../models/index.js';

export const getAppScreenshots = async ({
  app,
}: GetAppSubEntityParams): Promise<AppScreenShotInterface[]> => {
  const appScreenshots = await AppScreenshot.findAll({
    attributes: ['id', 'mime', 'screenshot', 'width', 'height'],
    where: { AppId: app.id },
  });

  return appScreenshots.map((appScreenshot) => ({
    id: appScreenshot.id,
    mime: appScreenshot.mime,
    screenshot: appScreenshot.screenshot,
    width: appScreenshot.width,
    height: appScreenshot.height,
  }));
};
