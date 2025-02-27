import { useObjectURL, useSimpleForm } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';

interface PicturePreviewProps {
  /**
   * The URL to the current picture.
   */
  readonly pictureUrl: string;

  /**
   * The picture if set from the camera
   */
  readonly pictureCamera?: any;
}

export function PicturePreview({ pictureCamera, pictureUrl }: PicturePreviewProps): ReactNode {
  const { formatMessage } = useIntl();
  const { values } = useSimpleForm();

  const iconUrl = useObjectURL((values.picture ?? pictureCamera) || pictureUrl);

  return (
    <figure className="image is-128x128 mb-2">
      <img
        alt={formatMessage(messages.picture)}
        className={`${styles.picture} is-rounded`}
        src={iconUrl}
      />
    </figure>
  );
}
