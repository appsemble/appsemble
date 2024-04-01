import { MetaSwitch, useMeta } from '@appsemble/react-components';
import { defaultLocale } from '@appsemble/utils';
import { type MDXContent } from 'mdx/types.js';
import { type ReactNode } from 'react';
import { Route } from 'react-router-dom';

import ResourcesActionDocs from './00-resources.mdx';
import StorageActionDocs from './01-storage.mdx';
import UserActionDocs from './02-users.mdx';
import TeamActionDocs from './03-teams.mdx';
import FlowActionDocs from './04-flow.mdx';
import LinkActionDocs from './05-link.mdx';
import MiscellaneousActionDocs from './06-miscellaneous.mdx';
import IndexPage from './index.mdx';
import { messages } from './messages.js';

interface DocModule {
  default: MDXContent;
  searchIndex: [];
  title: string;
}
export function importDocs(): DocModule[] {
  const mdxFiles = require.context('.', false, /\.mdx$/);
  const keys = mdxFiles.keys();

  return keys.map((key) => mdxFiles(key));
}

export function ActionRoutes(): ReactNode {
  useMeta(messages.title, messages.description);
  return (
    <main lang={defaultLocale}>
      <MetaSwitch>
        <Route element={<IndexPage />} path="/" />
        <Route element={<ResourcesActionDocs />} path="/resources" />
        <Route element={<StorageActionDocs />} path="/storage" />
        <Route element={<UserActionDocs />} path="/user" />
        <Route element={<TeamActionDocs />} path="/team" />
        <Route element={<FlowActionDocs />} path="/flow" />
        <Route element={<LinkActionDocs />} path="/link" />
        <Route element={<MiscellaneousActionDocs />} path="/miscellaneous" />
      </MetaSwitch>
    </main>
  );
}
