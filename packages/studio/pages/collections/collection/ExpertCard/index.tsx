import { type AppCollection } from '@appsemble/types';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from '../messages.js';

interface ExpertCardProps {
  readonly expert: AppCollection['$expert'];
}

export function ExpertCard({ expert }: ExpertCardProps): ReactElement {
  return (
    <section className="has-background-primary p-5 is-flex is-flex-direction-column mx-auto">
      <figure className={`image is-clipped mx-auto mb-4 ${styles.expertFigure}`}>
        <img
          alt={expert.name}
          className={`is-rounded ${styles.expertImg}`}
          src={expert.profileImage}
        />
      </figure>
      <h1 className="title has-text-white has-text-centered is-size-5">
        <FormattedMessage {...messages.expert} />
      </h1>
      <h2 className="subtitle has-text-white has-text-centered is-size-6">{expert.name}</h2>
    </section>
  );
}
