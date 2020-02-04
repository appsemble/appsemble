import { normalizeBlockName } from './blockUtils';

describe('normalizeBlockName', () => {
  it('should prepend @appsemble if no organization is prepended', () => {
    const blockName = 'form';
    const result = normalizeBlockName(blockName);

    expect(result).toBe(`@appsemble/${blockName}`);
  });

  it('should leave block name intact if organization is prepended', () => {
    const blockName = '@example/test';
    const result = normalizeBlockName(blockName);

    expect(result).toBe(blockName);
  });
});
