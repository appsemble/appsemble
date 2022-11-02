import { SubPage } from '@appsemble/types';
import { isAppLink, normalize, partialNormalized } from '@appsemble/utils';

import { ActionCreator } from './index.js';

const urlRegex = new RegExp(`^${partialNormalized.source}:`);

export const link: ActionCreator<'link'> = ({
  app: { pages },
  definition: { to },
  navigate,
  params,
}) => {
  let href: (data: any) => string;

  if (typeof to === 'string' && urlRegex.test(to)) {
    href = () => to;
  } else if (isAppLink(to)) {
    href = () => `/${params.lang}${to}`;
  } else {
    const [toBase, toSub] = [].concat(to);

    const toPage = pages.find(({ name }) => name === toBase);
    let subPage: SubPage;

    if (toPage?.type === 'tabs') {
      subPage = toPage.tabs.find(({ name }) => name === toSub) ?? toPage.tabs[0];
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
        params.lang,
        normalize(toPage.name),
        ...(subPage ? [normalize(subPage.name)] : []),
        ...(toPage.parameters || []).map((name) => data[name] ?? ''),
      ].join('/');
    };
  }

  return [
    (data = {}) => {
      const target = href(data);

      if (urlRegex.test(target)) {
        window.open(target, '_blank', 'noopener,noreferrer');
      } else {
        navigate(target, data);
      }
    },
    { href },
  ];
};

export const back: ActionCreator<'link.back'> = ({ navigate }) => [
  (data) => {
    navigate(-1);
    return data;
  },
];

export const next: ActionCreator<'link.next'> = ({ navigate }) => [
  (data) => {
    navigate(+1);
    return data;
  },
];
