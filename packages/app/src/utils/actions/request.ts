import { formatRequestAction } from '@appsemble/utils';
import axios, { Method } from 'axios';

import { ActionCreator } from '.';
import { serializeResource } from '../serializers';
import { apiUrl, appId } from '../settings';
import { xmlToJson } from '../xmlToJson';

export const request: ActionCreator<'request'> = ({ definition, prefix, remap }) => {
  const { body, method = 'GET', proxy = true, schema, url } = definition;

  return [
    async (data) => {
      const methodUpper = method.toUpperCase() as Method;
      const req = proxy
        ? {
            method: methodUpper,
            url: `${apiUrl}/api/apps/${appId}/action/${prefix}`,
          }
        : formatRequestAction(definition, data, remap);

      if (methodUpper === 'PUT' || methodUpper === 'POST' || methodUpper === 'PATCH') {
        req.data = serializeResource(body ? remap(body, data) : data);
      } else if (proxy) {
        req.params = { data: JSON.stringify(data) };
      }

      const response = await axios(req);
      let responseBody = response.data;
      if (/^(application|text)\/(.+\+)?xml;/.test(response.headers['content-type'])) {
        responseBody = xmlToJson(responseBody, schema);
      }

      return responseBody;
    },
    {
      method,
      url,
    },
  ];
};
