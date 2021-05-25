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
import { CodeBlock } from '../CodeBlock';
import { ErrorFallback } from '../ErrorFallback';
import { HighlightedCode } from '../HighlightedCode';
import { MDXAnchor, MDXWrapper } from '../MDX';
import { SideMenuBase } from '../SideMenuBase';
import { SideMenuBottom } from '../SideMenuBottom';
import { StudioMessagesProvider } from '../StudioMessagesProvider';
import { Toolbar } from '../Toolbar';
import { UserProvider } from '../UserProvider';
import styles from './index.module.css';
import { messages } from './messages';

export function App(): ReactElement {
  return (
    <BrowserRouter>
      <Route path="/:lang?">
        <StudioMessagesProvider>
          <MDXProvider
            components={{
              a: MDXAnchor,
              pre: CodeBlock,
              code: HighlightedCode,
              wrapper: MDXWrapper,
            }}
          >
            <UserProvider>
              <MetaProvider description={messages.description} title="Appsemble">
                <ErrorHandler fallback={ErrorFallback}>
                  <Confirmation>
                    <MessagesProvider>
                      <SideMenuProvider base={<SideMenuBase />} bottom={<SideMenuBottom />}>
                        <Toolbar />
                        <div
                          className={`px-3 py-3 is-flex is-flex-direction-column ${styles.content}`}
                        >
                          <Breadcrumbs />
                          <Routes />
                        </div>
                      </SideMenuProvider>
                    </MessagesProvider>
                  </Confirmation>
                </ErrorHandler>
              </MetaProvider>
            </UserProvider>
          </MDXProvider>
        </StudioMessagesProvider>
      </Route>
    </BrowserRouter>
  );
}
