import { Loader, useLocationString } from '@appsemble/react-components';
import React, { ReactElement, ReactNode, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { useHistory, useParams } from 'react-router-dom';

import nl from '../../translations/nl.json';

interface IntlMessagesProviderProps {
  children: ReactNode;
}

const providedMessages: { [language: string]: { [messageId: string]: string } } = {
  nl,
};

const languages = new Set(['nl', 'en-us']);

export function StudioMessagesProvider({ children }: IntlMessagesProviderProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const history = useHistory();
  const redirect = useLocationString();

  useEffect(() => {
    const defaultLanguage = 'en-us';
    if (lang !== defaultLanguage && !languages.has(lang)) {
      const preferredLanguage = localStorage.getItem('preferredLanguage');
      const detected =
        (languages.has(preferredLanguage) && preferredLanguage) ||
        languages.has(navigator.language && navigator.language) ||
        defaultLanguage;

      if (!languages.has(lang)) {
        // Someone got linked to a page without a language tag. Redirect them to the same page, but
        // with language set. This is especially important for the OAuth2 callback URL.
        history.replace(`/${detected}${redirect}`);
      }
    }
  }, [history, lang, redirect]);

  if (!languages.has(lang)) {
    return <Loader />;
  }

  return (
    <IntlProvider defaultLocale="en-US" locale={lang} messages={providedMessages[lang]}>
      {children}
    </IntlProvider>
  );
}
