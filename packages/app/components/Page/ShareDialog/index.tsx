import { Button, ModalCard } from '@appsemble/react-components';
import { type Dispatch, type ReactNode, type SetStateAction, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { type ShowShareDialogParams } from '../../../types.js';

export interface ShareDialogParams {
  readonly shareDialogParams: ShareDialogState;
  readonly setShareDialogParams: Dispatch<SetStateAction<ShareDialogState>>;
}

export interface ShareDialogState {
  params: ShowShareDialogParams;
  resolve: () => void;
  reject: (error: string) => void;
}

function createUrl(origin: string, params: Record<string, string>): string {
  const url = new URL(origin);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return String(url);
}

export function ShareDialog({
  setShareDialogParams,
  shareDialogParams,
}: ShareDialogParams): ReactNode {
  const rejectShareDialog = useCallback(() => {
    setShareDialogParams((old) => {
      old?.reject('Closed share dialog');
      return null;
    });
  }, [setShareDialogParams]);

  const resolveShareDialog = useCallback(() => {
    // Defer immediately setting the params to null
    // to allow for the default <a> click handler to resolve the url properly.
    setTimeout(() => {
      setShareDialogParams((old) => {
        old?.resolve();
        return null;
      });
    }, 0);
  }, [setShareDialogParams]);

  const title = shareDialogParams?.params.title;
  const text = shareDialogParams?.params.text;
  const url = shareDialogParams?.params.url;

  return (
    <ModalCard
      cardClassName={styles.container}
      isActive={Boolean(shareDialogParams)}
      onClose={rejectShareDialog}
      title={<FormattedMessage {...messages.share} />}
    >
      <div className="buttons is-fullwidth is-justify-content-start">
        <Button
          className="is-fullwidth is-justify-content-start"
          component="a"
          href={createUrl('mailto:', {
            subject: title,
            body: text && url ? `${text}\n${url}` : text || url,
          }).replaceAll('+', '%20')}
          icon="envelope"
          onClick={resolveShareDialog}
        >
          <FormattedMessage {...messages.email} />
        </Button>
        <Button
          className={`${styles.twitter} ${styles.light} is-fullwidth is-justify-content-start`}
          component="a"
          href={createUrl('https://twitter.com/intent/tweet', {
            text: title && text ? `${title}\n${text}` : title || text,
            url,
          })}
          icon="twitter"
          onClick={resolveShareDialog}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FormattedMessage {...messages.shareOn} values={{ name: 'Twitter' }} />
        </Button>
        <Button
          className={`${styles.whatsapp} ${styles.light} is-fullwidth is-justify-content-start`}
          component="a"
          href={createUrl('https://wa.me', { text: [title, text, url].filter(Boolean).join('\n') })}
          icon="whatsapp"
          onClick={resolveShareDialog}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FormattedMessage {...messages.shareOn} values={{ name: 'WhatsApp' }} />
        </Button>
        <Button
          className={`${styles.telegram} ${styles.light} is-fullwidth is-justify-content-start`}
          component="a"
          href={createUrl('https://t.me/share', {
            url,
            text: [title, text].filter(Boolean).join('\n'),
          })}
          icon="telegram-plane"
          onClick={resolveShareDialog}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FormattedMessage {...messages.shareOn} values={{ name: 'Telegram' }} />
        </Button>
        {url ? (
          <>
            <Button
              className={`${styles.linkedin} ${styles.light} is-fullwidth is-justify-content-start`}
              component="a"
              href={createUrl('https://www.linkedin.com/shareArticle', {
                summary: text,
                url,
                title,
              })}
              icon="linkedin"
              onClick={resolveShareDialog}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FormattedMessage {...messages.shareOn} values={{ name: 'LinkedIn' }} />
            </Button>
            <Button
              className={`${styles.facebook} ${styles.light} is-fullwidth is-justify-content-start`}
              component="a"
              href={createUrl('https://www.facebook.com/sharer/sharer.php', { u: url })}
              icon="facebook-f"
              onClick={resolveShareDialog}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FormattedMessage {...messages.shareOn} values={{ name: 'Facebook' }} />
            </Button>
          </>
        ) : null}
      </div>
    </ModalCard>
  );
}
