import { Button, ModalCard } from '@appsemble/react-components';
import { Dispatch, ReactElement, SetStateAction, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { ShowShareDialogParams } from '../../../types';
import styles from './index.module.css';
import { messages } from './messages';

export interface ShareDialogParams {
  shareDialogParams: ShareDialogState;
  setShareDialogParams: Dispatch<SetStateAction<ShareDialogState>>;
}

export interface ShareDialogState {
  params: ShowShareDialogParams;
  resolve: () => void;
  reject: (error: string) => void;
}

export function ShareDialog({
  setShareDialogParams,
  shareDialogParams,
}: ShareDialogParams): ReactElement {
  const rejectShareDialog = useCallback(() => {
    setShareDialogParams((old) => {
      old?.reject('Closed share dialog');
      return null;
    });
  }, [setShareDialogParams]);
  const resolveShareDialog = useCallback(() => {
    setShareDialogParams((old) => {
      old?.resolve();
      return null;
    });
  }, [setShareDialogParams]);

  return (
    <ModalCard
      isActive={Boolean(shareDialogParams)}
      onClose={rejectShareDialog}
      title={<FormattedMessage {...messages.share} />}
    >
      <div className="buttons is-justify-content-center">
        <Button
          component="a"
          href="mailto:?subject=Test Subject&body=Body!"
          icon="envelope"
          onClick={resolveShareDialog}
        >
          <FormattedMessage {...messages.email} />
        </Button>
        <Button
          className={styles.twitter}
          component="a"
          href={`https://twitter.com/intent/tweet?text=Hello world&url=${window.origin}`}
          icon="twitter"
          onClick={resolveShareDialog}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FormattedMessage {...messages.shareOn} values={{ name: 'Twitter' }} />
        </Button>
        <Button
          className={styles.facebook}
          component="a"
          href={`https://www.facebook.com/sharer/sharer.php?u=${window.origin}&t=ExampleTitle`}
          icon="facebook-f"
          onClick={resolveShareDialog}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FormattedMessage {...messages.shareOn} values={{ name: 'Facebook' }} />
        </Button>
      </div>
    </ModalCard>
  );
}
