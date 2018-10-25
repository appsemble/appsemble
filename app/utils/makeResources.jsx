import axios from 'axios';

function makeResource(blockDef, block, name) {
  const implementation = block.resources[name];

  return {
    query(data) {
      return axios.request({
        baseURL: implementation.url,
        method: implementation.query.method || 'get',
        url: implementation.query.url || '',
        params: data,
      });
    },
  };
}

export default function makeResources(blockDef, block) {
  if (blockDef.resources == null) {
    return null;
  }

  return Object.keys(blockDef.resources).reduce((acc, name) => {
    acc[name] = makeResource(blockDef, block, name);
    return acc;
  }, {});
}
