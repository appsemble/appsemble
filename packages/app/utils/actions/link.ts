import { SubPage } from '@appsemble/types';
import { isAppLink, normalize, partialNormalized } from '@appsemble/utils';

import { ActionCreator } from './index.js';

const urlRegex = new RegExp(`^${partialNormalized.source}:`);

export const link: ActionCreator<'link'> = ({
  app: { pages },
  definition: { to },
  history,
  route,
}) => {
  let href: (data: any) => string;

  if (typeof to === 'string' && urlRegex.test(to)) {
    href = () => to;
  } else if (isAppLink(to)) {
    href = () => `/${route.params.lang}${to}`;
  } else {
    const [toBase, toSub] = [].concat(to);

    const toPage = pages.find(({ name }) => name === toBase);
    let subPage: SubPage;

    if (toPage.type === 'tabs') {
      subPage = toPage.tabs.find(({ name }) => name === toSub);
    }

    if (toPage == null || (toSub && subPage == null)) {
      throw new Error(`Invalid link reference ${[].concat(to).join('/')}`);
    }

    href = (data = {}) => {
      if (typeof data === 'string' && urlRegex.test(data)) {
        return data;
      }

      return [
        '',
        route.params.lang,
        normalize(toPage.name),
        ...(toPage.parameters || []).map((name) => data[name] ?? ''),
        ...(subPage ? [normalize(subPage.name)] : []),
      ].join('/');
    };
  }

  return [
    (data = {}) => {
      const target = href(data);

      if (urlRegex.test(target)) {
        window.open(target, '_blank', 'noopener,noreferrer');
      } else {
        history.push(target, data);
      }
    },
    { href },
  ];
};

export const back: ActionCreator<'link.back'> = ({ history }) => [
  (data) => {
    history.goBack();
    return data;
  },
];

export const next: ActionCreator<'link.next'> = ({ history }) => [
  (data) => {
    history.goForward();
    return data;
  },
];
