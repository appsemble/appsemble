import { RequestLikeActionDefinition } from '@appsemble/types';
import { formatRequestAction, remap } from '@appsemble/utils';
import axios from 'axios';

import { ServerActionParameters } from '.';
import { getRemapperContext } from '../app';

export async function request({
  action,
  app,
  data,
  user,
}: ServerActionParameters<RequestLikeActionDefinition>): Promise<any> {
  let method: 'PUT' | 'GET' | 'POST' | 'DELETE';

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

  const context = await getRemapperContext(
    app,
    app.definition.defaultLanguage || 'en-us',
    user && {
      sub: user.id,
      name: user.name,
      email: user.primaryEmail,
      email_verified: user.EmailAuthorizations[0].verified,
    },
  );
  const axiosConfig = formatRequestAction({ ...action, method }, data, (remapper, d) =>
    remap(remapper, d, context),
  );
  const response = await axios(axiosConfig);

  return response.data;
}
