import {
  da as reactComponentsDA,
  nl as reactComponentsNL,
  useLocationString,
} from '@appsemble/react-components';
import { detectLocale, has } from '@appsemble/utils';
import React, { ReactElement, ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { Redirect, useParams } from 'react-router-dom';

import studioDA from '../../../translations/da.json';
import studioNL from '../../../translations/nl.json';
import { supportedLanguages } from '../../utils/constants';

interface IntlMessagesProviderProps {
  children: ReactNode;
}

const providedMessages: Record<string, Record<string, string>> = {
  da: { ...reactComponentsDA, ...studioDA },
  nl: { ...reactComponentsNL, ...studioNL },
};

const defaultLanguage = 'en-us';

export function StudioMessagesProvider({ children }: IntlMessagesProviderProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const redirect = useLocationString();

  if (has(supportedLanguages, lang)) {
    return (
      <IntlProvider defaultLocale="en-US" locale={lang} messages={providedMessages[lang]}>
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
