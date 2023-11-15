import { camelToHyphen } from '@appsemble/utils';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { type RenderRefProps } from '../../../../../components/Schema/index.js';

export function Ref({ isArray, jsonRef }: RenderRefProps): ReactNode {
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
