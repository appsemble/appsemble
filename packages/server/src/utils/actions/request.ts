import { HTTPMethods } from '@appsemble/sdk';
import { RequestLikeActionDefinition } from '@appsemble/types';
import { formatRequestAction } from '@appsemble/utils';
import axios from 'axios';

import { ServerActionParameters } from '.';

export async function request({
  action,
  data,
}: ServerActionParameters<RequestLikeActionDefinition>): Promise<any> {
  let method: HTTPMethods;

  if (!action.method) {
    switch (action.type) {
      case 'resource.update':
        method = 'PUT';
        break;
      case 'resource.delete':
        method = 'DELETE';
        break;
      case 'resource.create':
        method = 'POST';
        break;
      default:
        method = 'GET';
    }
  }
  const axiosConfig = formatRequestAction({ ...action, method }, data);
  const response = await axios(axiosConfig);

  return response.data;
}
