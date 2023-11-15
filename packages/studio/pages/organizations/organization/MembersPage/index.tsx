import { useMeta } from '@appsemble/react-components';
import { type ReactNode } from 'react';

import { MemberTable } from '../MemberTable/index.js';

export function MembersPage(): ReactNode {
  useMeta('Members');
  return <MemberTable />;
}
