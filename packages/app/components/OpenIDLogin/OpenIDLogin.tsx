import { useQuery } from '@appsemble/react-components';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import redirectOAuth2 from '../../utils/redirectOAuth2';
import messages from './messages';

export default function OpenIDLogin(): React.ReactElement {
  const qs = useQuery();
  const redirect = qs.get('redirect');

  React.useEffect(() => {
    redirectOAuth2(redirect);
  }, [redirect]);

  return <FormattedMessage {...messages.redirecting} />;
}
