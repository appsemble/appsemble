import { type ReactElement } from 'react';

import { type RenderRefProps } from '../../../../components/Schema/index.js';

export function Ref({ isArray, jsonRef }: RenderRefProps): ReactElement {
  const name = jsonRef.split('/').pop();

  return (
    <>
      {name === 'RemapperDefinition' ? 'RemapperDefinition' : 'XXX Unknown link type'}
      {isArray ? '[]' : null}
    </>
  );
}
