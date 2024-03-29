import { MenuItem } from '@appsemble/react-components';
import { camelToHyphen } from '@appsemble/utils';
import { type MDXContent } from 'mdx/types.js';
import { type ReactNode } from 'react';

interface DocModule {
  default: MDXContent;
  searchIndex: [];
  title: string;
}

export function importDocs(): DocModule[] {
  const mdxFiles = require.context('../docs', false, /\.mdx$/);
  const keys = mdxFiles.keys();

  return keys.map((key) => mdxFiles(key));
}

const remapperDocs = importDocs();

export function RemapperMenuItems(url: string): ReactNode {
  return (
    <div>
      {remapperDocs.map((section) => {
        const id = camelToHyphen(section.title);
        const path = section.title.toLowerCase();
        return (
          <MenuItem end key={id} to={`${url}/remapper/${path}`}>
            {section.title}
          </MenuItem>
        );
      })}
    </div>
  );
}
