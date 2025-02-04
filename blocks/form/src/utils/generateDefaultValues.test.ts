import { ISODateTimePattern } from '@appsemble/utils';
import { describe, expect, it } from 'vitest';

import { generateDefaultValues } from './generateDefaultValues.js';
import { type Field } from '../../block.js';

describe('generateDefaultValues', () => {
  it('should generate default value for each type', () => {
    const fields: Field[] = [
      { type: 'boolean', name: 'booleanField' },
      { type: 'date', name: 'dateField' },
      { type: 'number', display: 'slider', name: 'numberWithSlider', requirements: [{ min: 5 }] },
      { type: 'number', name: 'numberWithoutSlider' },
      { type: 'string', name: 'stringField' },
      { type: 'file', name: 'fileFieldRepeated', repeated: true },
      { type: 'file', name: 'fileField' },
      { type: 'geocoordinates', name: 'geocoordinatesField' },
      { type: 'tags', name: 'tagsField' },
      { type: 'selection', name: 'selectionField', selection: [{ id: 'select1' }] },
      { type: 'fieldset', name: 'fieldsetField', fields: [{ name: 'nested', type: 'boolean' }] },
    ];
    const generatedValues = generateDefaultValues(fields);
    expect(generatedValues).toMatchObject({
      booleanField: false,
      dateField: expect.stringMatching(ISODateTimePattern),
      numberWithSlider: 5,
      numberWithoutSlider: undefined,
      stringField: '',
      fileFieldRepeated: [],
      fileField: null,
      geocoordinatesField: {},
      tagsField: [],
      selectionField: [],
      fieldsetField: {
        nested: false,
      },
    });
  });
});
