import { type Remapper, type SubPage } from '@appsemble/types';
import { isAppLink, normalize, partialNormalized } from '@appsemble/utils';

import { type ActionCreator } from './index.js';

const urlRegex = new RegExp(`^${partialNormalized.source}:`);

export const link: ActionCreator<'link'> = ({
  app: { pages },
  definition: { to },
  getAppMessage,
  navigate,
  params,
  remap,
}) => {
  let href: (data: any) => string;

  if (typeof to === 'string' && urlRegex.test(to)) {
    href = () => to;
  } else if (isAppLink(to)) {
    href = () => `/${params.lang}${to}`;
  } else {
    href = (data = {}) => {
      const isRemappedLink =
        typeof to === 'object' &&
        (!Array.isArray(to) ||
          (Array.isArray(to) && to.every((entry) => typeof entry === 'object')));

      let [toBase, toSub]: [string, string] = [undefined, undefined];
      if (isRemappedLink) {
        const remappedLink = remap(to as Remapper, data);
        if (urlRegex.test(remappedLink)) {
          return remappedLink;
        }
        [toBase, toSub] = [].concat(remappedLink ?? pages[0].name);
      } else {
        [toBase, toSub] = [].concat(to);
      }

      const toPage = pages.find(({ name }) => name === toBase);
      let subPage: SubPage;
      let index: number;

      if (toPage?.type === 'tabs' && toPage?.tabs) {
        subPage = toPage?.tabs?.find(({ name }) => name === toSub) ?? toPage.tabs[0];
        index = toPage.tabs.findIndex(({ name }) => name === subPage.name);
      }

      if (toPage == null || (toSub && subPage == null)) {
        throw new Error(`Invalid link reference ${[].concat(to).join('/')}`);
      }

      const normalizedPageName = normalize(toPage.name);
      const translatedPageName = normalize(
        getAppMessage({
          id: `pages.${normalizedPageName}`,
          defaultMessage: normalizedPageName,
        }).format() as string,
      );

      if (typeof data === 'string' && urlRegex.test(data)) {
        return data;
      }

      return [
        '',
        params.lang,
        translatedPageName,
        ...(subPage
          ? [
              normalize(
                getAppMessage({
                  id: `pages.${normalizedPageName}.tabs.${index}`,
                  defaultMessage: normalize(
                    typeof subPage.name === 'string' ? subPage.name : remap(subPage.name, data),
                  ),
                }).format() as string,
              ),
            ]
          : []),
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
        navigate(target, data ?? {});
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
