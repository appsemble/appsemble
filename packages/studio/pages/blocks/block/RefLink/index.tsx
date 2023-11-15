import { type ReactNode } from 'react';

import { type RenderRefProps } from '../../../../components/Schema/index.js';

export function RefLink({ isArray, jsonRef }: RenderRefProps): ReactNode {
  const name = jsonRef.split('/').pop();

  return (
    <a href={`#${name}`}>
      {name}
      {isArray ? '[]' : null}
    </a>
  );
}
