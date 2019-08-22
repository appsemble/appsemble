import { LinkAction } from '@appsemble/sdk';
import { compileFilters, normalize } from '@appsemble/utils';

import { ActionDefinition, MakeActionParameters } from '../../types';
import mapValues from '../mapValues';

interface LinkActionDefinition extends ActionDefinition<'link'> {
  to: string;
  parameters?: Record<string, any>;
}

export default function link({
  definition: { to, parameters = {} },
  app: { pages },
  history,
}: MakeActionParameters<LinkActionDefinition>): LinkAction {
  const toPage = pages.find(({ name }) => name === to);
  if (toPage == null) {
    throw new Error(`Invalid link reference ${to}`);
  }

  const mappers = mapValues(parameters || {}, compileFilters);

  function href(data: any = {}): string {
    return `/${[
      normalize(to),
      ...(toPage.parameters || []).map(name =>
        Object.hasOwnProperty.call(mappers, name) ? mappers[name](data) : data[name],
      ),
    ].join('/')}`;
  }

  return {
    type: 'link',
    async dispatch(data) {
      history.push(href(data), data);
    },
    href,
  };
}
