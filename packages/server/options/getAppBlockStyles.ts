import {
  type AppBlockStyle as AppBlockStyleInterface,
  type GetAppBlockStylesParams,
} from '@appsemble/node-utils';

import { getAppDB } from '../models/index.js';

export async function getAppBlockStyles({
  app,
  name,
}: GetAppBlockStylesParams): Promise<AppBlockStyleInterface[]> {
  const { AppBlockStyle } = await getAppDB(app.id!);
  const appBlockStyles = await AppBlockStyle.findAll({
    attributes: ['style'],
    where: { block: name },
  });

  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return appBlockStyles.map((appBlockStyle) => ({
    style: appBlockStyle.style,
  }));
}
