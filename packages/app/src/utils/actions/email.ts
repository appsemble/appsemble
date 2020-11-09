import { BaseAction } from '@appsemble/sdk';
import { EmailActionDefinition } from '@appsemble/types';
import axios from 'axios';

import { MakeActionParameters } from '../../types';
import { apiUrl, appId } from '../settings';

export function email({
  prefix,
}: MakeActionParameters<EmailActionDefinition>): BaseAction<'email'> {
  return {
    type: 'email',

    async dispatch(data: any) {
      const url = `${apiUrl}/api/apps/${appId}/action/${prefix}`;
      await axios.post(url, data || {});

      return data;
    },
  };
}
