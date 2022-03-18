import { ReactElement } from 'react';

import { RenderRefProps } from '../../../../components/Schema';

export function RefLink({ isArray, jsonRef }: RenderRefProps): ReactElement {
  const name = jsonRef.split('/').pop();

  return (
    <a href={`#${name}`}>
      {name}
      {isArray ? '[]' : null}
    </a>
  );
}
