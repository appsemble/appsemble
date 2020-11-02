import { useLocationString } from '@appsemble/react-components';
import { detectLocale } from '@appsemble/utils';
import React, { ReactElement, ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { Redirect, useParams } from 'react-router-dom';

import nl from '../../../translations/nl.json';

interface IntlMessagesProviderProps {
  children: ReactNode;
}

const providedMessages: Record<string, Record<string, string>> = {
  nl,
};

const defaultLanguage = 'en-us';
const languages = new Set(['nl', 'en-us']);

export function StudioMessagesProvider({ children }: IntlMessagesProviderProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const redirect = useLocationString();

  if (languages.has(lang)) {
    return (
      <IntlProvider defaultLocale="en-US" locale={lang} messages={providedMessages[lang]}>
        {children}
      </IntlProvider>
    );
  }

  const preferredLanguage = localStorage.getItem('preferredLanguage');
  const detected =
    (languages.has(preferredLanguage)
      ? preferredLanguage
      : detectLocale([...languages], navigator.languages)) || defaultLanguage;

  return <Redirect to={`/${detected}${redirect}`} />;
}
