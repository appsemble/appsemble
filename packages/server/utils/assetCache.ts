import NodeCache from '@cacheable/node-cache';

export const assetsCache = new NodeCache({ stdTTL: 0 });
