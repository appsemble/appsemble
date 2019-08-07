import { compileFilters, normalize } from '@appsemble/utils';

import mapValues from '../mapValues';

export default function link({ definition: { to, parameters = {} }, app: { pages }, history }) {
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
    async dispatch(data) {
      history.push(href(data), data);
    },
    href,
  };
}
