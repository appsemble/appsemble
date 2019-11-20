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
    const newDomain = app.domain;
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
  });
}
