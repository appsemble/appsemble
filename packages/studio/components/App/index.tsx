import {
  Confirmation,
  ErrorHandler,
  MessagesProvider,
  MetaProvider,
  SideMenuProvider,
} from '@appsemble/react-components';
import { MDXProvider } from '@mdx-js/react';
import { createBrowserHistory } from 'history';
import { ReactElement } from 'react';
import { unstable_HistoryRouter as HistoryRouter, Route, Routes } from 'react-router-dom';

import { TopLevelRoutes } from '../../pages/index.js';
import { Breadcrumbs } from '../Breadcrumbs/index.js';
import { CodeBlock } from '../CodeBlock/index.js';
import { ErrorFallback } from '../ErrorFallback/index.js';
import { HighlightedCode } from '../HighlightedCode/index.js';
import { MDXAnchor, MDXWrapper } from '../MDX/index.js';
import { createHeader } from '../MDX/MDXHeader/index.js';
import { SideMenuBase } from '../SideMenuBase/index.js';
import { SideMenuBottom } from '../SideMenuBottom/index.js';
import { StudioMessagesProvider } from '../StudioMessagesProvider/index.js';
import { Toolbar } from '../Toolbar/index.js';
import { UserProvider } from '../UserProvider/index.js';
import { VerifyBanner } from '../VerifyBanner/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

const studioContent = (
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
                  <div className={`px-3 py-3 is-flex is-flex-direction-column ${styles.content}`}>
                    <VerifyBanner />
                    <Breadcrumbs />
                    <TopLevelRoutes />
                  </div>
                </SideMenuProvider>
              </MessagesProvider>
            </Confirmation>
          </ErrorHandler>
        </MetaProvider>
      </UserProvider>
    </MDXProvider>
  </StudioMessagesProvider>
);

export function App(): ReactElement {
  return (
    /* By using unstable_HistoryRouter the block function on navigator in the Prompt component works again. This should be considered a temporary solution, see: https://github.com/remix-run/react-router/issues/8139#issuecomment-1247080906 */
    <HistoryRouter history={createBrowserHistory({ window })}>
      <Routes>
        {/* Simple way to get optional paramaters back */}
        <Route element={studioContent} path="/:lang/*" />
        <Route element={studioContent} path="/*" />
      </Routes>
    </HistoryRouter>
  );
}
