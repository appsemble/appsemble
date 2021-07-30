import decamelize from 'decamelize';
import { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { RenderRefProps } from '../../../../../components/Schema';

export function Ref({ isArray, jsonRef }: RenderRefProps): ReactElement {
  const name = jsonRef.split('/').pop();

  return (
    <>
      {name === 'ActionDefinition' ? (
        'ActionDefinition'
      ) : (
        <Link to={`./app#${decamelize(name, { separator: '-' })}`}>{name}</Link>
      )}
      {isArray ? '[]' : null}
    </>
  );
}
