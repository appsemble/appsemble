import { LinkAction } from '@appsemble/sdk';
import { LinkActionDefinition } from '@appsemble/types';
import { compileFilters, normalize, partialNormalized, remapData } from '@appsemble/utils';

import { MakeActionParameters } from '../../types';
import mapValues from '../mapValues';

const urlRegex = new RegExp(`^${partialNormalized.source}:`);

export default function link({
  definition: { to, parameters = {}, remap = '' },
  app: { pages },
  history,
}: MakeActionParameters<LinkActionDefinition>): LinkAction {
  let href: (data: any) => string;

  if (urlRegex.test(to)) {
    href = () => to;
  } else {
    const [toBase, toSub] = [].concat(to);

    const toPage = pages.find(({ name }) => name === toBase);
    const subPage = toSub ? toPage.subPages.find(({ name }) => name === toSub) : null;

    if (toPage == null || (toSub && subPage === null)) {
      throw new Error(`Invalid link reference ${[].concat(to).join('/')}`);
    }

    const mappers = mapValues(parameters || {}, compileFilters);

    href = (data = {}) => {
      if (urlRegex.test(data)) {
        return data;
      }

      return `/${[
        normalize(toPage.name),
        ...(toPage.parameters || []).map(name =>
          Object.hasOwnProperty.call(mappers, name) ? mappers[name](data) : data[name],
        ),
        ...(subPage ? [normalize(subPage.name)] : []),
      ].join('/')}`;
    };
  }

  return {
    type: 'link',
    async dispatch(data = {}) {
      const target = href(data);

      if (urlRegex.test(target)) {
        window.open(target, '_blank', 'noopener,noreferrer');
        return;
      }

      history.push(target, data);
    },
    href(args: any = {}) {
      return href(remapData(remap, args));
    },
  };
}
