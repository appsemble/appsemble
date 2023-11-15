import { useMeta } from '@appsemble/react-components';
import { type ReactNode } from 'react';

import { CollectionsPage as ActualCollectionsPage } from '../../../collections/CollectionsPage/index.js';
import { messages } from '../../../collections/messages.js';

type CollectionsPageProps = Parameters<typeof ActualCollectionsPage>[0];

export function CollectionsPage(props: CollectionsPageProps): ReactNode {
  useMeta(messages.title, messages.description);
  return <ActualCollectionsPage {...props} />;
}
