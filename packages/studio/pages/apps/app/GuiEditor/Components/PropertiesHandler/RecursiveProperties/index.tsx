import { type Schema } from 'jsonschema';
import { type ReactNode, useContext } from 'react';
import { type JsonObject } from 'type-fest';

import { SchemaDefinitionsContext } from '../index.js';
import AnyOfProperty from '../Inputs/AnyOfProperty/index.js';
import ArrayProperty from '../Inputs/ArrayProperty/index.js';
import BooleanProperty from '../Inputs/BooleanProperty/index.js';
import EnumProperty from '../Inputs/EnumProperty/index.js';
import NumberProperty from '../Inputs/NumberProperty/index.js';
import ObjectProperty from '../Inputs/ObjectProperty/index.js';
import RemapperProperty from '../Inputs/RemapperProperty/index.js';
import StringProperty from '../Inputs/StringProperty/index.js';

interface RecursivePropertiesProps {
  readonly value: any;
  readonly schema: Schema;
  readonly property: string;
  readonly onChange: (property: string, value: JsonObject) => void;
}

export function RecursiveProperties({
  onChange,
  property,
  schema,
  value,
}: RecursivePropertiesProps): ReactNode {
  const definitions = useContext(SchemaDefinitionsContext) as Record<string, Schema>;

  if (schema.enum) {
    return <EnumProperty onChange={onChange} property={property} schema={schema} value={value} />;
  }

  if (schema?.anyOf) {
    return <AnyOfProperty onChange={onChange} property={property} schema={schema} value={value} />;
  }

  if (schema?.$ref) {
    const ref = decodeURIComponent(schema.$ref.replace('#/definitions/', ''));
    const refSchema: Schema = definitions[ref];
    return (
      <RecursiveProperties
        onChange={onChange}
        property={property}
        schema={refSchema}
        value={value}
      />
    );
  }
  if (schema?.format === 'remapper') {
    return (
      <RemapperProperty onChange={onChange} property={property} schema={schema} value={value} />
    );
  }

  switch (schema.type) {
    case 'array':
      return (
        <ArrayProperty onChange={onChange} property={property} schema={schema} value={value} />
      );
    case 'object':
      return (
        <ObjectProperty onChange={onChange} property={property} schema={schema} value={value} />
      );
    case 'string':
      return (
        <StringProperty onChange={onChange} property={property} schema={schema} value={value} />
      );
    case 'number':
      return (
        <NumberProperty onChange={onChange} property={property} schema={schema} value={value} />
      );
    case 'boolean':
      return (
        <BooleanProperty onChange={onChange} property={property} schema={schema} value={value} />
      );
    default:
      return <div>Missing Type!</div>;
  }
}

export default RecursiveProperties;
