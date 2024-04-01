import { MetaSwitch, useMeta } from '@appsemble/react-components';
import { defaultLocale } from '@appsemble/utils';
import { type MDXContent } from 'mdx/types.js';
import { type ReactNode } from 'react';
import { Route } from 'react-router-dom';

import StringDocs from './00-strings.mdx';
import NumberDocs from './01-numbers.mdx';
import ObjectDocs from './02-objects.mdx';
import ArraysDocs from './03-arrays.mdx';
import DataDocs from './04-data.mdx';
import HistoryDocs from './05-history.mdx';
import ConditionalDocs from './06-conditionals.mdx';
import DateDocs from './07-dates.mdx';
import RandomDocs from './08-randoms.mdx';
import ConfigDocs from './09-config.mdx';
import IndexPage from './index.mdx';
import { messages } from './messages.js';
import OtherDocs from './other.mdx';

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

export function RemapperRoutes(): ReactNode {
  // TODO: Incorporate translations into the remapper section files
  useMeta(messages.title, messages.description);

  return (
    <main lang={defaultLocale}>
      <MetaSwitch>
        <Route element={<IndexPage />} path="/" />
        <Route element={<StringDocs />} path="/string-manipulation" />
        <Route element={<NumberDocs />} path="/numbers" />
        <Route element={<ObjectDocs />} path="/objects" />
        <Route element={<ArraysDocs />} path="/arrays" />
        <Route element={<ConditionalDocs />} path="/conditions" />
        <Route element={<DataDocs />} path="/data" />
        <Route element={<HistoryDocs />} path="/history" />
        <Route element={<DateDocs />} path="/date" />
        <Route element={<RandomDocs />} path="/randomness" />
        <Route element={<ConfigDocs />} path="/config" />
        <Route element={<OtherDocs />} path="/other" />
      </MetaSwitch>
    </main>
  );
}
