import { useMeta } from '@appsemble/react-components';
import { type ReactElement } from 'react';

import { CollectionsPage as ActualCollectionsPage } from '../../../collections/CollectionsPage/index.js';
import { messages } from '../../../collections/messages.js';

type CollectionsPageProps = Parameters<typeof ActualCollectionsPage>[0];

export function CollectionsPage(props: CollectionsPageProps): ReactElement {
  useMeta(messages.title, messages.description);
  return <ActualCollectionsPage {...props} />;
}
