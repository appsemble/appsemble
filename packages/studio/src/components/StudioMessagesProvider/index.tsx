import { useData, useLocationString } from '@appsemble/react-components';
import { detectLocale, has } from '@appsemble/utils';
import React, { ReactElement, ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { Redirect, useParams } from 'react-router-dom';

import { supportedLanguages } from '../../utils/constants';

interface IntlMessagesProviderProps {
  children: ReactNode;
}

interface Messages {
  language: string;
  messages: Record<string, string>;
}

const defaultLanguage = 'en-US';

export function StudioMessagesProvider({ children }: IntlMessagesProviderProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const redirect = useLocationString();
  const messages = useData<Messages>(`/api/messages/${lang}?context=studio`);

  if (has(supportedLanguages, lang)) {
    return (
      <IntlProvider defaultLocale="en-US" locale={lang} messages={messages?.data?.messages ?? {}}>
        {children}
      </IntlProvider>
    );
  }

  const preferredLanguage = localStorage.getItem('preferredLanguage');
  const detected =
    (has(supportedLanguages, preferredLanguage)
      ? preferredLanguage
      : detectLocale(Object.keys(supportedLanguages), navigator.languages)) || defaultLanguage;

  return <Redirect to={`/${detected}${redirect}`} />;
}
