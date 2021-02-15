import { BaseAction, LinkAction } from '@appsemble/sdk';
import { BaseActionDefinition, LinkActionDefinition } from '@appsemble/types';
import { normalize, partialNormalized } from '@appsemble/utils';

import { MakeActionParameters } from '../../types';

const urlRegex = new RegExp(`^${partialNormalized.source}:`);

export function link({
  app: { pages },
  definition: { to },
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

    href = (data = {}) => {
      if (urlRegex.test(data)) {
        return data;
      }

      return [
        '',
        normalize(toPage.name),
        ...(toPage.parameters || []).map((name) => data[name] ?? ''),
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
      return href(args);
    },
  };
}

export function back({
  history,
}: MakeActionParameters<BaseActionDefinition<'link.back'>>): BaseAction<'link.back'> {
  return {
    type: 'link.back',
    dispatch(data) {
      history.goBack();
      return data;
    },
  };
}

export function next({
  history,
}: MakeActionParameters<BaseActionDefinition<'link.next'>>): BaseAction<'link.next'> {
  return {
    type: 'link.next',
    dispatch(data) {
      history.goForward();
      return data;
    },
  };
}
