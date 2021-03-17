import { useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';

import { MemberTable } from '../MemberTable';

export function MembersPage(): ReactElement {
  useMeta('Members');
  return <MemberTable />;
}
