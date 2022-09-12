import { useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';

import { MemberTable } from '../MemberTable/index.js';

export function MembersPage(): ReactElement {
  useMeta('Members');
  return <MemberTable />;
}
