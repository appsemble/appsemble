import { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { RenderRefProps } from '../../../../components/Schema';

export function RefLink({ isArray, jsonRef }: RenderRefProps): ReactElement {
  const name = jsonRef.split('/').pop();

  return (
    <Link to={`#${name}`}>
      {name}
      {isArray ? '[]' : null}
    </Link>
  );
}
