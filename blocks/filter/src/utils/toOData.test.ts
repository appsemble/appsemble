import { describe, expect, it } from 'vitest';

import { toOData } from './toOData.js';
import { type Field, type FilterValues } from '../../block.js';

interface TestCase {
  input: Field[];
  filter: FilterValues;
  expected: string;
}

describe('toOData', () => {
  const testCases: Record<string, TestCase> = {
    'return oData query for boolean field': {
      input: [{ defaultValue: true, name: 'test', type: 'boolean' }],
      filter: { test: false },
      expected: "test eq 'false'",
    },
    'return oData query for date field': {
      input: [{ name: 'test', type: 'date', defaultValue: '' }],
      filter: { test: 'date test' },
      expected: "test eq 'date test'",
    },
    'return oData query for date-range field': {
      input: [{ name: 'test', type: 'date-range', defaultValue: ['', ''] }],
      filter: { test: ['test start', 'test end'] },
      expected: "test ge 'test start' and test le 'test end'",
    },
    'return oData query for enum field': {
      input: [
        {
          name: 'test',
          type: 'enum',
          defaultValue: 'value 1',
          enum: [{ value: 'value 1' }, { value: 'value 2' }, { value: 'value 3' }],
        },
      ],
      filter: { test: 'value 3' },
      expected: "test eq 'value 3'",
    },
    'return appropriate oData query if the input is separated by ", "': {
      input: [
        {
          name: 'test',
          type: 'enum',
          defaultValue: 'value 1',
          enum: [
            { value: 'value 1' },
            { value: 'value 2' },
            { value: 'value 3, value 4, value 5' },
          ],
        },
      ],
      filter: { test: 'value 3, value 4, value 5' },
      expected: "test eq 'value 3' or test eq 'value 4' or test eq 'value 5'",
    },
    'return oData query for list field': {
      input: [
        {
          name: 'test',
          type: 'list',
          defaultValue: 'value 1',
          list: [
            { value: 'value 1' },
            { value: 'value 2' },
            { value: 'value 3' },
            { value: 'value 4' },
            { value: 'value 5' },
          ],
        },
      ],
      filter: { test: 'value 2, value 5' },
      expected: "contains(test, 'value 2') or contains(test, 'value 5')",
    },
    'return oData query for range': {
      input: [
        {
          name: 'test',
          type: 'range',
          defaultValue: [5, 8],
          from: 5,
          to: 10,
        },
      ],
      filter: { test: [6, 9] },
      expected: 'test ge 6 and le 9',
    },
    'return oData query for string type': {
      input: [
        {
          name: 'test',
          type: 'string',
          defaultValue: '',
        },
      ],
      filter: { test: 'search' },
      expected: "contains(tolower(test),'search')",
    },
    'process multiple queries': {
      input: [
        {
          name: 'test 1',
          type: 'string',
          defaultValue: '',
        },
        {
          name: 'test 2',
          type: 'boolean',
          defaultValue: false,
        },
      ],
      filter: {
        'test 1': 'search',
        'test 2': true,
      },
      expected: "(contains(tolower(test 1),'search')) and (test 2 eq 'true')",
    },
  };

  it.each(Object.entries(testCases))('should %s', (d, { expected, filter, input }) => {
    const query = toOData(input, filter);
    expect(query).toBe(expected);
  });
});
