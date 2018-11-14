import normalize from '@appsemble/utils/normalize';
import { compileFilters } from '@appsemble/utils/remap';

import mapValues from '../mapValues';

export default function link({ to, parameters = {} }, { pages }, block, history) {
  const toPage = pages.find(({ name }) => name === to);
  if (toPage == null) {
    throw new Error(`Invalid link reference ${to}`);
  }

  const mappers = mapValues(parameters || {}, compileFilters);

  function href(data = {}) {
    return `/${[
      normalize(to),
      ...(toPage.parameters || []).map(name =>
        Object.hasOwnProperty.call(mappers, name) ? mappers[name](data) : data[name],
      ),
    ].join('/')}`;
  }

  return {
    dispatch(data) {
      history.push(href(data), data);
    },
    href,
  };
}
