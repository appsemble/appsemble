import { Button, Icon, useMessages } from '@appsemble/react-components';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';

interface ShareOption {
  name: string;
  icon: ReactNode;
  link: string;
}

interface ShareComponentProps {
  readonly url: string;
  readonly appName: string;
  readonly className?: string;
}

export function AppShare({ appName, className, url }: ShareComponentProps): ReactNode {
  const push = useMessages();
  const { formatMessage } = useIntl();
  const copyToClipboard = useCallback(
    async (value: string) => {
      await navigator.clipboard.writeText(value);
      push({ body: formatMessage(messages.shareSuccess), color: 'success' });
    },
    [formatMessage, push],
  );
  const shareOptions: ShareOption[] = [
    {
      name: 'Facebook',
      icon: <Icon icon="facebook" />,
      link: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    },
    {
      name: 'Twitter',
      icon: <Icon icon="twitter" />,
      link: `https://twitter.com/intent/tweet?url=${url}`,
    },
    {
      name: 'LinkedIn',
      icon: <Icon icon="linkedin" />,
      link: `https://www.linkedin.com/shareArticle?mini=true&url=${url}`,
    },
    {
      name: 'Email',
      icon: <Icon icon="envelope" />,
      link: `mailto:?subject=Check this out&body=${url}`,
    },
  ];

  return (
    <div className={`box ${className}`}>
      <h2 className="title is-4">Share {appName}</h2>
      <ul>
        {shareOptions.map((option) => (
          <div className="dropdown-item" key={option.name}>
            <li className="mb-1">
              <a
                className="button is-link is-light"
                href={option.link}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="icon">{option.icon}</span>
                <span>{option.name}</span>
              </a>
            </li>
          </div>
        ))}
        <div className="dropdown-item">
          <li className="mb-1">
            <Button
              className="is-link is-light"
              color="primary"
              icon="clipboard"
              onClick={() => copyToClipboard(url)}
            >
              <FormattedMessage {...messages.copyToClipboard} />
            </Button>
          </li>
        </div>
      </ul>
    </div>
  );
}
