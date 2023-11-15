import { type ReactNode } from 'react';

import { type RenderRefProps } from '../../../../components/Schema/index.js';

export function Ref({ isArray, jsonRef }: RenderRefProps): ReactNode {
  const name = jsonRef.split('/').pop();

  return (
    <>
      {name === 'RemapperDefinition' ? 'RemapperDefinition' : 'XXX Unknown link type'}
      {isArray ? '[]' : null}
    </>
  );
}
