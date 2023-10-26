import { Button, Icon } from '@appsemble/react-components';
import { type ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';

export interface TrainingCardProps {
  readonly title: string;
  readonly linkToDocumentation: string;
  readonly linkToVideo: string;
  readonly exampleCode: string;
  readonly externalResource: string;
}

export function TrainingCard({
  exampleCode,
  externalResource,
  linkToDocumentation,
  linkToVideo,
  title,
}: TrainingCardProps): ReactElement {
  const copyToClipboard = useCallback(async (value: string) => {
    await navigator.clipboard.writeText(value);
  }, []);
  return (
    <div className={`card ${styles.block} mb-3`}>
      <div className="card-content">
        <div className="title is-size-5">{title}</div>
        <div className="list">
          <ul>
            {linkToDocumentation ? (
              <div className="list-item">
                <li>
                  <Link to={linkToDocumentation}>
                    <span className="icon-text is-size-5">
                      <Icon className="mr-2" color="primary" icon="chevron-right" />
                      <FormattedMessage {...messages.linkToDocumentation} />
                    </span>
                  </Link>
                </li>
              </div>
            ) : null}
            {linkToVideo ? (
              <div className="list-item">
                <li>
                  <Link to={linkToVideo}>
                    <span className="icon-text is-size-5">
                      <Icon className="mr-2" color="primary" icon="circle-play" />
                      <FormattedMessage {...messages.video} />
                    </span>
                  </Link>
                </li>
              </div>
            ) : null}
            {exampleCode ? (
              <div className="list-item">
                <li>
                  <div>
                    <Button
                      className="is-ghost"
                      onClick={() => {
                        copyToClipboard(exampleCode);
                      }}
                    >
                      <span className="icon-text is-size-5">
                        <Icon className="mr-2" color="primary" icon="clipboard" />
                        <FormattedMessage {...messages.exampleCode} />
                      </span>
                    </Button>
                  </div>
                </li>
              </div>
            ) : null}
            {externalResource ? (
              <div className="list-item">
                <li>
                  <Link to={linkToDocumentation}>
                    <span className="icon-text is-size-5">
                      <Icon className="mr-2" color="primary" icon="chevron-right" />
                      <FormattedMessage {...messages.externalResource} />
                    </span>
                  </Link>
                </li>
              </div>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
