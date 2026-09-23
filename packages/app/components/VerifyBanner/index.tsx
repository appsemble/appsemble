import { resendBannerGridArea } from '@appsemble/lang-sdk';
import { Message } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { usePlacedGridArea } from '../MenuProvider/index.js';
import { ResendVerificationButton } from '../ResendVerificationButton/index.js';

interface VerifyBannerProps {
  /**
   * Whether the banner sits in the `resend-banner` area of a page grid.
   *
   * Outside a grid the banner renders above the page, unless the grid of the page places it.
   */
  readonly inGrid?: boolean;
}

export function VerifyBanner({ inGrid }: VerifyBannerProps): ReactNode {
  const { appMemberInfo } = useAppMember();
  const placed = usePlacedGridArea(resendBannerGridArea);

  if (!appMemberInfo || appMemberInfo.email_verified || (placed && !inGrid)) {
    return null;
  }

  return (
    <Message className={inGrid ? styles.inGrid : undefined} color="warning">
      <div className="is-flex is-justify-content-space-between is-align-items-center">
        <span>
          <FormattedMessage values={{ email: appMemberInfo.email }} {...messages.verifyEmail} />
        </span>
        <ResendVerificationButton />
      </div>
    </Message>
  );
}
