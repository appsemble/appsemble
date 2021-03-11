import { useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';

import { MemberTable } from '../MemberTable';

export function OrganizationMembersPage(): ReactElement {
  useMeta('Members');
  return <MemberTable />;
}
