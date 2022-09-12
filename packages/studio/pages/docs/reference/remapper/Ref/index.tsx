import { ReactElement } from 'react';

import { RenderRefProps } from '../../../../../components/Schema/index.js';

export function Ref({ isArray, jsonRef }: RenderRefProps): ReactElement {
  const name = jsonRef.split('/').pop();

  return (
    <>
      {name === 'RemapperDefinition' ? 'RemapperDefinition' : 'XXX Unknown link type'}
      {isArray ? '[]' : null}
    </>
  );
}
