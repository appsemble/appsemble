import {
  Confirmation,
  ErrorHandler,
  MessagesProvider,
  MetaProvider,
  SideMenuProvider,
} from '@appsemble/react-components';
import { ReactElement } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';

import { Routes } from '../../pages';
import { Breadcrumbs } from '../Breadcrumbs';
import { ErrorFallback } from '../ErrorFallback';
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
        </StudioMessagesProvider>
      </Route>
    </BrowserRouter>
  );
}
