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
import { createHeader } from '../MDX/MDXHeader';
import { SideMenuBase } from '../SideMenuBase';
import { SideMenuBottom } from '../SideMenuBottom';
import { StudioMessagesProvider } from '../StudioMessagesProvider';
import { Toolbar } from '../Toolbar';
import { UserProvider } from '../UserProvider';
import { VerifyBanner } from '../VerifyBanner';
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
              h1: createHeader('h1'),
              h2: createHeader('h2'),
              h3: createHeader('h3'),
              h4: createHeader('h4'),
              h5: createHeader('h5'),
              h6: createHeader('h6'),
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
                          <VerifyBanner />
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
