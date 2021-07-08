import { Button, ModalCard } from '@appsemble/react-components';
import { Dispatch, ReactElement, SetStateAction, useCallback, useMemo } from 'react';
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

  const title = shareDialogParams?.params.title;
  const text = shareDialogParams?.params.text;
  const url = shareDialogParams?.params.url;

  const emailParams = useMemo(() => {
    const result = new URLSearchParams();
    if (title) {
      result.set('subject', title);
    }
    if (text || url) {
      result.set('body', text && url ? `${text}\n${url}` : text || url);
    }

    return result;
  }, [text, title, url]);

  const twitterParams = useMemo(() => {
    const result = new URLSearchParams();
    if (title || text) {
      result.set('text', title && text ? `${title}\n${text}` : title || text);
    }
    if (url) {
      result.set('url', url);
    }

    return result;
  }, [text, title, url]);

  const whatsappParams = useMemo(
    () => new URLSearchParams({ text: [title, text, url].filter(Boolean).join('\n') }),
    [text, title, url],
  );

  const linkedinParams = useMemo(() => {
    const result = new URLSearchParams({ mini: 'true' });

    if (text) {
      result.set('summary', text);
    }
    if (url) {
      result.set('url', url);
    }

    if (title) {
      result.set('title', title);
    }

    return result;
  }, [text, title, url]);

  return (
    <ModalCard
      isActive={Boolean(shareDialogParams)}
      onClose={rejectShareDialog}
      title={<FormattedMessage {...messages.share} />}
    >
      <div className="buttons is-justify-content-center">
        <Button
          component="a"
          href={`mailto:?${emailParams}`}
          icon="envelope"
          onClick={resolveShareDialog}
        >
          <FormattedMessage {...messages.email} />
        </Button>
        <Button
          className={`${styles.twitter} ${styles.light}`}
          component="a"
          href={`https://twitter.com/intent/tweet?${twitterParams}`}
          icon="twitter"
          onClick={resolveShareDialog}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FormattedMessage {...messages.shareOn} values={{ name: 'Twitter' }} />
        </Button>
        <Button
          className={`${styles.whatsapp} ${styles.light}`}
          component="a"
          href={`whatsapp://send?${whatsappParams}`}
          icon="whatsapp"
          onClick={resolveShareDialog}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FormattedMessage {...messages.shareOn} values={{ name: 'WhatsApp' }} />
        </Button>
        <Button
          className={`${styles.linkedin} ${styles.light}`}
          component="a"
          href={`https://www.linkedin.com/shareArticle?${linkedinParams}`}
          icon="linkedin"
          onClick={resolveShareDialog}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FormattedMessage {...messages.shareOn} values={{ name: 'LinkedIn' }} />
        </Button>
        {url && (
          <Button
            className={`${styles.facebook} ${styles.light}`}
            component="a"
            href={`https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: url })}`}
            icon="facebook-f"
            onClick={resolveShareDialog}
            rel="noopener noreferrer"
            target="_blank"
          >
            <FormattedMessage {...messages.shareOn} values={{ name: 'Facebook' }} />
          </Button>
        )}
      </div>
    </ModalCard>
  );
}
