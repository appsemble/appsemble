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

import { Routes } from '../../pages';
import { Breadcrumbs } from '../Breadcrumbs';
import { ErrorFallback } from '../ErrorFallback';
import { MDXAnchor, MDXPre, MDXWrapper } from '../MDX';
import { SideMenuBase } from '../SideMenuBase';
import { SideMenuBottom } from '../SideMenuBottom';
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
              wrapper: MDXWrapper,
            }}
          >
            <UserProvider>
              <ErrorHandler fallback={ErrorFallback}>
                <Confirmation>
                  <MessagesProvider>
                    <MetaProvider description={messages.description} title="Appsemble">
                      <SideMenuProvider base={<SideMenuBase />} bottom={<SideMenuBottom />}>
                        <Toolbar />
                        <div className="px-3 py-3">
                          <Breadcrumbs />
                          <Routes />
                        </div>
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
