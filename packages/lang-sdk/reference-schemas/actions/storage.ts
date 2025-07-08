import { type OpenAPIV3 } from 'openapi-types';

import { StorageAppendActionDefinition } from '../../schemas/actions/StorageAppendActionDefinition.js';
import { StorageDeleteActionDefinition } from '../../schemas/actions/StorageDeleteActionDefinition.js';
import { StorageReadActionDefinition } from '../../schemas/actions/StorageReadActionDefinition.js';
import { StorageSubtractActionDefinition } from '../../schemas/actions/StorageSubtractActionDefinition.js';
import { StorageUpdateActionDefinition } from '../../schemas/actions/StorageUpdateActionDefinition.js';
import { StorageWriteActionDefinition } from '../../schemas/actions/StorageWriteActionDefinition.js';

export const storageActions: Record<string, OpenAPIV3.SchemaObject> = {
  'storage.read': StorageReadActionDefinition,
  'storage.write': StorageWriteActionDefinition,
  'storage.append': StorageAppendActionDefinition,
  'storage.subtract': StorageSubtractActionDefinition,
  'storage.update': StorageUpdateActionDefinition,
  'storage.delete': StorageDeleteActionDefinition,
};
