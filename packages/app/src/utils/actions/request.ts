import { RequestAction, RequestLikeAction, RequestLikeActionTypes } from '@appsemble/sdk';
import { RequestLikeActionDefinition } from '@appsemble/types';
import { formatRequestAction } from '@appsemble/utils';
import axios, { Method } from 'axios';

import { MakeActionParameters } from '../../types';
import { serializeResource } from '../serializers';
import { apiUrl, appId } from '../settings';
import { xmlToJson } from '../xmlToJson';

export function requestLikeAction<T extends RequestLikeActionTypes>({
  definition,
  prefix,
  remap,
}: MakeActionParameters<RequestLikeActionDefinition<T>>): RequestLikeAction<'request'> {
  const { method = 'GET', proxy = true, schema, url } = definition;

  return {
    type: 'request',
    async dispatch(data) {
      const methodUpper = method.toUpperCase() as Method;
      const req = proxy
        ? {
            method: methodUpper,
            url: `${apiUrl}/api/apps/${appId}/action/${prefix}`,
          }
        : formatRequestAction(definition, data, remap);

      if (methodUpper === 'PUT' || methodUpper === 'POST' || methodUpper === 'PATCH') {
        req.data = serializeResource(data);
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
    method,
    url,
  };
}

export function request(
  args: MakeActionParameters<RequestLikeActionDefinition<'request'>>,
): RequestAction {
  return requestLikeAction(args);
}
