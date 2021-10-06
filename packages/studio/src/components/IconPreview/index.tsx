import { Organization } from '@appsemble/types';
import { ReactElement } from 'react';
import { Icon } from 'react-components/src/Icon';
import { useSimpleForm } from 'react-components/src/SimpleForm';
import { useObjectURL } from 'react-components/src/useObjectURL';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages';

interface IconPreviewProps {
  /**
   * The organization to render the icon preview for.
   */
  organization: Organization;
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
