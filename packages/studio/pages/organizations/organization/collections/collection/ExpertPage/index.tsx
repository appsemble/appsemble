import { useMeta } from '@appsemble/react-components';
import { type AppCollection } from '@appsemble/types';
import { type ReactElement } from 'react';

import styles from './index.module.css';
import { MarkdownContent } from '../../../../../../components/MarkdownContent/index.js';
import { usePageHeader } from '../../../../../../components/PageHeader/index.js';
import { ExpertCard } from '../ExpertCard/index.js';
import { messages } from '../messages.js';

interface ExpertPageProps {
  readonly collection: AppCollection;
}

export function ExpertPage({ collection }: ExpertPageProps): ReactElement {
  usePageHeader(
    <header>
      <ExpertCard expert={collection.$expert} />
    </header>,
  );
  useMeta(messages.expert);
  return (
    <section className="m-3">
      <h1 className="is-size-5 has-text-primary">{collection.$expert.name}</h1>
      <MarkdownContent
        className={styles.expertDescription}
        content={collection.$expert.description}
      />
    </section>
  );
}
