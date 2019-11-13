import { LinkAction } from '@appsemble/sdk';
import { LinkActionDefinition } from '@appsemble/types';
import { compileFilters, normalize, partialNormalized, remapData } from '@appsemble/utils';

import { MakeActionParameters } from '../../types';
import mapValues from '../mapValues';

const URLRegex = new RegExp(`^${partialNormalized.source}:`);

export default function link({
  definition: { to, parameters = {}, remap = '' },
  app: { pages },
  history,
}: MakeActionParameters<LinkActionDefinition>): LinkAction {
  const [toBase, toSub] = [].concat(to);

  const toPage = pages.find(({ name }) => name === toBase);
  const subPage = toSub ? toPage.subPages.find(({ name }) => name === toSub) : null;

  if (toPage == null || (toSub && subPage === null)) {
    throw new Error(`Invalid link reference ${[].concat(to).join('/')}`);
  }

  const mappers = mapValues(parameters || {}, compileFilters);

  function href(data: any = {}): string {
    if (URLRegex.test(data)) {
      return data;
    }

    return `/${[
      normalize(toPage.name),
      ...(toPage.parameters || []).map(name =>
        Object.hasOwnProperty.call(mappers, name) ? mappers[name](data) : data[name],
      ),
      ...(subPage ? [normalize(subPage.name)] : []),
    ].join('/')}`;
  }

  return {
    type: 'link',
    async dispatch(data = {}) {
      const target = href(data);

      if (URLRegex.test(target)) {
        window.open(data, '_blank', 'noreferrer');
        return;
      }

      history.push(href(data), data);
    },
    href(args: any = {}) {
      return href(remapData(remap, args));
    },
  };
}
