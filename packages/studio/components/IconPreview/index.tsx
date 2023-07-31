import { Icon, useObjectURL, useSimpleForm } from '@appsemble/react-components';
import { type Organization } from '@appsemble/types';
import { type ReactElement } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';

interface IconPreviewProps {
  /**
   * The organization to render the icon preview for.
   */
  readonly organization: Organization;
}

export function IconPreview({ organization }: IconPreviewProps): ReactElement {
  const { formatMessage } = useIntl();
  const { values } = useSimpleForm();

  const iconUrl = useObjectURL(values.icon || organization.iconUrl);

  if (!iconUrl) {
    return (
      <figure className="image is-128x128 mb-2">
        <Icon className={styles.iconFallback} icon="building" />
      </figure>
    );
  }

  return (
    <figure className="image is-128x128 mb-2">
      <img alt={formatMessage(messages.logo)} className={styles.icon} src={iconUrl} />
    </figure>
  );
}
