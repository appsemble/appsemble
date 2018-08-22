import idb from 'idb';


export default function getDB(app) {
  return idb.open(`appsemble-${app.id}`, 1, (upgrade) => {
    /* eslint-disable default-case */
    switch (upgrade.oldVersion) {
      case 0:
        upgrade.createObjectStore('auth');
    }
    /* eslint-enable default-case */
  });
}
