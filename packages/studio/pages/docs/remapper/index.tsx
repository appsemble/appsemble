import { MetaSwitch, useMeta } from '@appsemble/react-components';
import { defaultLocale } from '@appsemble/utils';
import { type ReactElement } from 'react';
import { Route } from 'react-router-dom';

import StringDocs from './docs/00-strings.mdx';
import ObjectDocs from './docs/01-objects.mdx';
import ArraysDocs from './docs/02-arrays.mdx';
import DataDocs from './docs/03-data.mdx';
import HistoryDocs from './docs/04-history.mdx';
import ConditionalDocs from './docs/05-conditionals.mdx';
import DateDocs from './docs/06-dates.mdx';
import RandomDocs from './docs/07-randoms.mdx';
import OtherDocs from './docs/other.mdx';
import Introduction from './introduction.mdx';
import { messages } from './messages.js';

export function RemapperRoutes(): ReactElement {
  // TODO: Incorporate translations into the remapper section files
  useMeta(messages.title, messages.description);

  return (
    <main lang={defaultLocale}>
      <MetaSwitch>
        <Route element={<Introduction />} path="/" />
        <Route element={<StringDocs />} path="/string-manipulation" />
        <Route element={<ObjectDocs />} path="/objects" />
        <Route element={<ArraysDocs />} path="/arrays" />
        <Route element={<ConditionalDocs />} path="/conditions" />
        <Route element={<DataDocs />} path="/data" />
        <Route element={<HistoryDocs />} path="/history" />
        <Route element={<DateDocs />} path="/date" />
        <Route element={<RandomDocs />} path="/randomness" />
        <Route element={<OtherDocs />} path="/other" />
      </MetaSwitch>
    </main>
  );
}
