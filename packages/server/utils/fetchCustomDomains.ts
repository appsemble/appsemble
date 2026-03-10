import { Op } from 'sequelize';

import { App } from '../models/main/App.js';

export async function fetchCustomAppDomains(): Promise<string[]> {
  const apps = await App.findAll({
    attributes: ['domain', 'sslCertificate'],
    where: {
      domain: {
        [Op.ne]: null,
      },
    },
  });
  const domains = Array.from(apps.map((app) => app.domain!));
  return domains;
}
