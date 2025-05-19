import { type PageDefinition } from './types/index.js';

export function findPageByName(pages: PageDefinition[], name: string): PageDefinition | undefined {
  for (const page of pages) {
    if (page.name === name) {
      return page;
    }

    if (page.type === 'container' && page.pages) {
      const found = findPageByName(page.pages, name);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}
