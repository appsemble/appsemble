import {
  AppScreenshot as AppScreenShotInterface,
  GetAppSubEntityParams,
} from '@appsemble/node-utils/types';

import { AppScreenshot } from '../../../mocks/db/models/AppScreenshot.js';

export const getAppScreenshots = async ({
  app,
}: GetAppSubEntityParams): Promise<AppScreenShotInterface[]> => {
  const appScreenshots = await AppScreenshot.findAll({
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
