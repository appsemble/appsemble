import { type OpenAPIV3 } from 'openapi-types';

import { StorageAppendActionDefinition } from '../../schemas/StorageAppendActionDefinition.js';
import { StorageDeleteActionDefinition } from '../../schemas/StorageDeleteActionDefinition.js';
import { StorageReadActionDefinition } from '../../schemas/StorageReadActionDefinition.js';
import { StorageSubtractActionDefinition } from '../../schemas/StorageSubtractActionDefinition.js';
import { StorageUpdateActionDefinition } from '../../schemas/StorageUpdateActionDefinition.js';
import { StorageWriteActionDefinition } from '../../schemas/StorageWriteActionDefinition.js';

export const storageActions: Record<string, OpenAPIV3.SchemaObject> = {
  'storage.read': StorageReadActionDefinition,
  'storage.write': StorageWriteActionDefinition,
  'storage.append': StorageAppendActionDefinition,
  'storage.subtract': StorageSubtractActionDefinition,
  'storage.update': StorageUpdateActionDefinition,
  'storage.delete': StorageDeleteActionDefinition,
};
