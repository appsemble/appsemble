import {
  Confirmation,
  ErrorHandler,
  MessagesProvider,
  MetaProvider,
  SideMenuProvider,
} from '@appsemble/react-components';
import { MDXProvider } from '@mdx-js/react';
import { ReactElement } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';

import { Breadcrumbs } from '../Breadcrumbs';
import { ErrorFallback } from '../ErrorFallback';
import { MDXAnchor, MDXCode, MDXPre } from '../MDX';
import { Routes } from '../Routes';
import { SideMenuBase } from '../SideMenuBase';
import { StudioMessagesProvider } from '../StudioMessagesProvider';
import { Toolbar } from '../Toolbar';
import { UserProvider } from '../UserProvider';
import { messages } from './messages';

export function App(): ReactElement {
  return (
    <BrowserRouter>
      <Route path="/:lang?">
        <StudioMessagesProvider>
          <MDXProvider
            components={{
              a: MDXAnchor,
              pre: MDXPre,
              code: MDXCode,
            }}
          >
            <UserProvider>
              <ErrorHandler fallback={ErrorFallback}>
                <Confirmation>
                  <MessagesProvider>
                    <MetaProvider description={messages.description} title="Appsemble">
                      <SideMenuProvider base={<SideMenuBase />}>
                        <Toolbar />
                        <Breadcrumbs />
                        <Routes />
                      </SideMenuProvider>
                    </MetaProvider>
                  </MessagesProvider>
                </Confirmation>
              </ErrorHandler>
            </UserProvider>
          </MDXProvider>
        </StudioMessagesProvider>
      </Route>
    </BrowserRouter>
  );
}
