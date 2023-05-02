import { useMeta } from '@appsemble/react-components';
import { type ReactElement } from 'react';

import { MemberTable } from '../MemberTable/index.js';

export function MembersPage(): ReactElement {
  useMeta('Members');
  return <MemberTable />;
}
