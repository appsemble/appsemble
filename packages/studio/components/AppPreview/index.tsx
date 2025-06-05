import { Loader } from '@appsemble/react-components';
import { type App } from '@appsemble/types';
import { type ReactNode, type Ref } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { getAppUrl } from '../../utils/getAppUrl.js';
import { useSSLStatus } from '../useSSLStatus.js';

interface AppPreviewProps {
  /**
   * The app to render.
   */
  readonly app: App;

  /**
   * A ref to the iframe. This allows to update the app.
   */
  readonly iframeRef: Ref<HTMLIFrameElement>;

  /**
   * Event handler for when the iframe has completed loading.
   */
  readonly onIframeLoad?: () => void;
}

/**
 * These properties are passed to the allow attribute of the app preview. For a full list, see
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy#directives
 */
const allow = [
  'autoplay',
  'camera',
  'geolocation',
  'microphone',
  'midi',
  'payment',
  'picture-in-picture',
  'sync-xhr',
  'usb',
];

/**
 * Render a preview of an app using an iframe.
 */
export function AppPreview({ app, iframeRef, onIframeLoad }: AppPreviewProps): ReactNode {
  const { formatMessage } = useIntl();

  const appDomain = app.domain || `${app.path}.${app.OrganizationId}.${window.location.hostname}`;
  const sslStatus = useSSLStatus(appDomain);

  const src = getAppUrl(app.OrganizationId, app.path);

  return (
    <div className={styles.root}>
      {window.location.protocol === 'http:' || sslStatus?.[appDomain] === 'ready' ? (
        /* eslint-disable-next-line react/iframe-missing-sandbox, jsx-a11y/no-noninteractive-element-interactions */
        <iframe
          allow={allow.map((feature) => `${feature} ${src}`).join('; ')}
          className={styles.appFrame}
          onLoad={onIframeLoad}
          ref={iframeRef}
          src={src}
          title={formatMessage(messages.iframeTitle)}
        />
      ) : (
        <div className="has-background-white is-flex is-flex-direction-column is-flex-grow-1 is-flex-shrink-1 is-align-items-center is-justify-content-center">
          <Loader className={styles.sslLoader} />
          <p className="pt-6">
            <FormattedMessage {...messages.sslGenerating} />
          </p>
          <p>
            <FormattedMessage {...messages.sslInfo} />
          </p>
        </div>
      )}
    </div>
  );
}
