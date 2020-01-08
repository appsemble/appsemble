import dns from './dns';

export default async function addDBHooks(db, argv) {
  if (!argv.appDomainStrategy) {
    return;
  }
  const dnsConfig = await dns(argv);
  if (!dnsConfig) {
    return;
  }
  db.models.App.afterSave('attachDomain', async app => {
    const oldDomain = app.previous('domain');
    const oldPath = app.previous('path');
    const newDomain = app.domain;
    const newPath = app.path;
    if (oldDomain === newDomain) {
      return;
    }
    if (newDomain) {
      if (oldDomain) {
        await dnsConfig.update(oldDomain, newDomain);
      } else {
        await dnsConfig.add(newDomain);
      }
    } else if (oldDomain) {
      await dnsConfig.remove(oldDomain);
    }
    if (oldPath) {
      await dnsConfig.update(oldPath, newPath);
    } else {
      await dnsConfig.add(newPath);
    }
  });
}
