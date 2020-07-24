import type { BaseAction } from '@appsemble/sdk';
import type { EmailActionDefinition } from '@appsemble/types';
import axios from 'axios';

import type { MakeActionParameters } from '../../types';
import settings from '../settings';

export default function email({
  prefix,
}: MakeActionParameters<EmailActionDefinition>): BaseAction<'email'> {
  return {
    type: 'email',

    async dispatch(data: any) {
      const url = `${settings.apiUrl}/api/apps/${settings.id}/action/${prefix}`;
      await axios.post(url, data || {});

      return data;
    },
  };
}
