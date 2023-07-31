import { Loader, useLocationString } from '@appsemble/react-components';
import { defaultLocale, detectLocale, has } from '@appsemble/utils';
import axios from 'axios';
import { type ReactElement, type ReactNode, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { Navigate, useParams } from 'react-router-dom';

import { supportedLanguages } from '../../utils/constants.js';

interface IntlMessagesProviderProps {
  readonly children: ReactNode;
}

interface Messages {
  language: string;
  messages: Record<string, string>;
}

export function StudioMessagesProvider({ children }: IntlMessagesProviderProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const redirect = useLocationString();
  const [messages, setMessages] = useState<Record<string, string>>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!has(supportedLanguages, lang)) {
      document.documentElement.lang = defaultLocale;
      return;
    }

    document.documentElement.lang = lang;
    axios.get<Messages>(`/api/messages/${lang}`).then((response) => {
      setMessages(response.data.messages);
      setLoading(false);
    });
  }, [lang]);

  if (has(supportedLanguages, lang)) {
    if (loading) {
      return <Loader />;
    }

    return (
      <IntlProvider
        defaultLocale={defaultLocale}
        locale={lang}
        messages={messages}
        onError={(err) => {
          // eslint-disable-next-line no-console
          console.info(err.message);
        }}
      >
        {children}
      </IntlProvider>
    );
  }

  const preferredLanguage = localStorage.getItem('preferredLanguage');
  const detected =
    (has(supportedLanguages, preferredLanguage)
      ? preferredLanguage
      : detectLocale(Object.keys(supportedLanguages), navigator.languages)) || defaultLocale;

  return <Navigate to={`/${detected}${redirect}`} />;
}
