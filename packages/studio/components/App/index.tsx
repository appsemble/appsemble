import {
  Confirmation,
  ErrorHandler,
  MessagesProvider,
  MetaProvider,
  SideMenuProvider,
} from '@appsemble/react-components';
import { MDXProvider } from '@mdx-js/react';
import { type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { CollectionRoutes } from '../../pages/collections/collection/index.js';
import { TopLevelRoutes } from '../../pages/index.js';
import { customDomainAppCollection } from '../../utils/settings.js';
import { Breadcrumbs } from '../Breadcrumbs/index.js';
import { BreadCrumbsDecorationProvider } from '../BreadCrumbsDecoration/index.js';
import { CodeBlock } from '../CodeBlock/index.js';
import { EmailQuotaBanners } from '../EmailQuotaBanners/index.js';
import { ErrorFallback } from '../ErrorFallback/index.js';
import { FullscreenProvider, useFullscreenContext } from '../FullscreenProvider/index.js';
import { HighlightedCode } from '../HighlightedCode/index.js';
import { MDXAnchor, MDXWrapper } from '../MDX/index.js';
import { createHeader } from '../MDX/MDXHeader/index.js';
import { PageHeaderProvider } from '../PageHeader/index.js';
import { SideMenuBase } from '../SideMenuBase/index.js';
import { SideMenuBottom } from '../SideMenuBottom/index.js';
import { StudioMessagesProvider } from '../StudioMessagesProvider/index.js';
import { Toolbar } from '../Toolbar/index.js';
import { UserProvider } from '../UserProvider/index.js';
import { VerifyBanner } from '../VerifyBanner/index.js';

function StudioContent(): ReactNode {
  const { fullscreenRef } = useFullscreenContext();

  return (
    <SideMenuProvider base={<SideMenuBase />} bottom={<SideMenuBottom />}>
      <Toolbar />
      <div
        className={`px-3 py-3 is-flex is-flex-direction-column ${styles.content}`}
        ref={fullscreenRef}
      >
        <VerifyBanner />
        <EmailQuotaBanners />
        <BreadCrumbsDecorationProvider>
          <PageHeaderProvider>
            <Breadcrumbs />
            <TopLevelRoutes />
          </PageHeaderProvider>
        </BreadCrumbsDecorationProvider>
      </div>
    </SideMenuProvider>
  );
}

function Providers({ content }: { readonly content: ReactNode }): ReactNode {
  return (
    <FullscreenProvider>
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
                  <MessagesProvider>{content}</MessagesProvider>
                </Confirmation>
              </ErrorHandler>
            </MetaProvider>
          </UserProvider>
        </MDXProvider>
      </StudioMessagesProvider>
    </FullscreenProvider>
  );
}

function TopLevelCollection({ id }: { readonly id: number }): ReactNode {
  return (
    <>
      <Toolbar />
      <PageHeaderProvider>
        <div className="p-3">
          <CollectionRoutes fallbackCollectionId={id} />
        </div>
      </PageHeaderProvider>
    </>
  );
}

export function App(): ReactNode {
  const content: ReactNode = customDomainAppCollection ? (
    <TopLevelCollection id={customDomainAppCollection.id} />
  ) : (
    <StudioContent />
  );
  return (
    <Routes>
      <Route element={<Providers content={content} />} path="/:lang/*" />
      <Route element={<Providers content={content} />} path="/*" />
    </Routes>
  );
}
