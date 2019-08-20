import { compileFilters, normalize } from '@appsemble/utils';

import mapValues from '../mapValues';

export default function link({ definition: { to, parameters = {} }, app: { pages }, history }) {
  const [toBase, toSub] = [].concat(to);

  const toPage = pages.find(({ name }) => name === toBase);
  const subPage = toSub ? toPage.subPages.find(({ name }) => name === toSub) : null;

  if (toPage == null || (toSub && subPage === null)) {
    throw new Error(`Invalid link reference ${[].concat(to).join('/')}`);
  }

  const mappers = mapValues(parameters || {}, compileFilters);

  function href(data = {}) {
    return `/${[
      normalize(toPage.name),
      ...(toPage.parameters || []).map(name =>
        Object.hasOwnProperty.call(mappers, name) ? mappers[name](data) : data[name],
      ),
      ...(subPage ? [normalize(subPage.name)] : []),
    ].join('/')}`;
  }

  return {
    async dispatch(data) {
      history.push(href(data), data);
    },
    href,
  };
}
