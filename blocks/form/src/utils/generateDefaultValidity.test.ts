import { remap } from '@appsemble/lang-sdk';
import { type BlockUtils } from '@appsemble/sdk';
import { describe, expect, it } from 'vitest';

import { generateDefaultValidity } from './generateDefaultValidity.js';
import { type Field, type Values } from '../../block.js';

describe('generate default validity', () => {
  it('should return an empty error map', () => {
    let fields: Field[];
    const data: Values = {};
    const defaultError = 'the value is invalid';
    const defaultValues: Values = {};

    const errors = generateDefaultValidity(
      fields,
      data,
      { remap } as unknown as BlockUtils,
      defaultError,
      defaultValues,
    );
    expect(errors).toStrictEqual({});
  });

  it('should see field as pristine', () => {
    const fields = [
      {
        type: 'string',
        name: 'a',
      },
    ] as Field[];
    const data: Values = {
      a: '',
    };
    const defaultError = 'the value is invalid';
    const defaultValues: Values = {
      a: '',
    };

    const errors = generateDefaultValidity(
      fields,
      data,
      { remap } as unknown as BlockUtils,
      defaultError,
      defaultValues,
    );
    expect(errors).toStrictEqual({});
  });

  it('should see field value as invalid', () => {
    const fields = [
      {
        type: 'string',
        name: 'a',
        requirements: [{ required: true }],
      },
    ] as Field[];
    const data: Values = {
      a: '',
    };
    const defaultError = 'the value is invalid';
    const defaultValues: Values = {
      a: '',
    };

    const errors = generateDefaultValidity(
      fields,
      data,
      { remap } as unknown as BlockUtils,
      defaultError,
      defaultValues,
    );
    expect(errors).toStrictEqual({ a: 'the value is invalid' });
  });

  it('should validate child fields in fieldset', () => {
    const fields = [
      {
        type: 'fieldset',
        name: 'a',
        fields: [
          {
            type: 'string',
            name: 'b',
          },
          {
            type: 'string',
            name: 'c',
            requirements: [{ required: true }],
          },
          {
            type: 'fieldset',
            name: 'd',
            fields: [
              {
                type: 'string',
                name: 'e',
              },
              {
                type: 'string',
                name: 'f',
                requirements: [{ required: true }],
              },
              {
                type: 'string',
                name: 'g',
                requirements: [{ required: true }],
              },
            ],
          },
        ],
      },
    ] as Field[];
    const data: Values = {
      a: {
        b: '',
        c: '',
        d: {
          e: '',
          f: '',
          g: 'value',
        },
      },
    };
    const defaultError = 'the value is invalid';
    const defaultValues: Values = {
      a: {
        b: '',
        c: '',
        d: {
          e: '',
          f: '',
        },
      },
    };

    const errors = generateDefaultValidity(
      fields,
      data,
      { remap } as unknown as BlockUtils,
      defaultError,
      defaultValues,
    );
    expect(errors).toStrictEqual({
      a: { c: 'the value is invalid', d: { f: 'the value is invalid' } },
    });
  });

  it('should validate child fields in repeated fieldset', () => {
    const fields = [
      {
        type: 'fieldset',
        name: 'a',
        repeated: true,
        fields: [
          {
            type: 'string',
            name: 'b',
          },
          {
            type: 'string',
            name: 'c',
            requirements: [{ required: true }],
          },
          {
            type: 'fieldset',
            name: 'd',
            repeated: true,
            fields: [
              {
                type: 'string',
                name: 'e',
              },
              {
                type: 'string',
                name: 'f',
                requirements: [{ required: true }],
              },
              {
                type: 'string',
                name: 'g',
                requirements: [{ required: true }],
              },
            ],
          },
        ],
      },
    ] as Field[];
    const data: Values = {
      a: [
        {
          b: '',
          c: '',
          d: [{ e: '', f: '', g: 'value' }],
        },
      ],
    };
    const defaultError = 'the value is invalid';
    const defaultValues: Values = {
      a: [],
    };

    const errors = generateDefaultValidity(
      fields,
      data,
      { remap } as unknown as BlockUtils,
      defaultError,
      defaultValues,
    );
    expect(errors).toStrictEqual({
      a: [
        {
          c: 'the value is invalid',
          d: [{ f: 'the value is invalid' }],
        },
      ],
    });
  });

  it('should validate fields after fieldset', () => {
    const fields = [
      {
        type: 'fieldset',
        name: 'a',
        fields: [
          {
            type: 'string',
            name: 'b',
            requirements: [{ required: true }],
          },
          {
            type: 'string',
            name: 'c',
            requirements: [{ required: true }],
          },
        ],
      },
      {
        type: 'string',
        name: 'd',
        requirements: [{ required: true }],
      },
    ] as Field[];
    const data: Values = {
      a: {
        b: 'b',
        c: 'c',
      },
      d: '',
    };
    const defaultError = 'the value is invalid';
    const defaultValues: Values = { string: '' };

    const errors = generateDefaultValidity(
      fields,
      data,
      { remap } as unknown as BlockUtils,
      defaultError,
      defaultValues,
    );

    expect(errors).toStrictEqual({ a: {}, d: 'the value is invalid' });
  });
});
