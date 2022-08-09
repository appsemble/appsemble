import { camelToHyphen } from '@appsemble/utils';
import { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { RenderRefProps } from '../../../../../components/Schema/index.js';

export function Ref({ isArray, jsonRef }: RenderRefProps): ReactElement {
  const name = jsonRef.split('/').pop();

  return (
    <>
      <Link
        to={
          name === 'ActionDefinition'
            ? './action'
            : name === 'RemapperDefinition'
            ? './remapper'
            : `#${camelToHyphen(name)}`
        }
      >
        {name}
      </Link>
      {isArray ? '[]' : null}
    </>
  );
}
