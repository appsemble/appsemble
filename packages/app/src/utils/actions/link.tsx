import type { LinkAction } from '@appsemble/sdk';
import type { LinkActionDefinition } from '@appsemble/types';
import {
  compileFilters,
  mapValues,
  normalize,
  partialNormalized,
  remapData,
} from '@appsemble/utils';

import type { MakeActionParameters } from '../../types';

const urlRegex = new RegExp(`^${partialNormalized.source}:`);

export function link({
  definition: { to, parameters = {}, remap = '' },
  app: { pages },
  history,
  route,
}: MakeActionParameters<LinkActionDefinition>): LinkAction {
  let href: (data: any) => string;

  if (urlRegex.test(to)) {
    href = () => to;
  } else {
    const [toBase, toSub] = [].concat(to);

    const toPage = pages.find(({ name }) => name === toBase);
    const subPage =
      toPage.type !== 'page' && toSub ? toPage.subPages.find(({ name }) => name === toSub) : null;

    if (toPage == null || (toSub && subPage == null)) {
      throw new Error(`Invalid link reference ${[].concat(to).join('/')}`);
    }

    const mappers = mapValues(parameters || {}, compileFilters);

    href = (data = {}) => {
      if (urlRegex.test(data)) {
        return data;
      }

      return [
        '',
        normalize(toPage.name),
        ...(toPage.parameters || []).map((name) =>
          Object.hasOwnProperty.call(mappers, name) ? mappers[name](data) : data[name],
        ),
        ...(subPage ? [normalize(subPage.name)] : []),
      ].join('/');
    };
  }

  return {
    type: 'link',
    // eslint-disable-next-line require-await
    async dispatch(data = {}) {
      const target = href(data);

      if (urlRegex.test(target)) {
        window.open(target, '_blank', 'noopener,noreferrer');
      } else {
        history.push(`/${route.params.lang}${target}`, data);
      }

      return data;
    },
    href(args: any = {}) {
      return href(remapData(remap, args));
    },
  };
}
