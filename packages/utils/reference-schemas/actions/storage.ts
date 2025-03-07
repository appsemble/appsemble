import { type OpenAPIV3 } from 'openapi-types';

import { StorageAppendActionDefinition } from '../../api/components/schemas/StorageAppendActionDefinition.js';
import { StorageDeleteActionDefinition } from '../../api/components/schemas/StorageDeleteActionDefinition.js';
import { StorageReadActionDefinition } from '../../api/components/schemas/StorageReadActionDefinition.js';
import { StorageSubtractActionDefinition } from '../../api/components/schemas/StorageSubtractActionDefinition.js';
import { StorageUpdateActionDefinition } from '../../api/components/schemas/StorageUpdateActionDefinition.js';
import { StorageWriteActionDefinition } from '../../api/components/schemas/StorageWriteActionDefinition.js';

export const storageActions: Record<string, OpenAPIV3.SchemaObject> = {
  'storage.read': StorageReadActionDefinition,
  'storage.write': StorageWriteActionDefinition,
  'storage.append': StorageAppendActionDefinition,
  'storage.subtract': StorageSubtractActionDefinition,
  'storage.update': StorageUpdateActionDefinition,
  'storage.delete': StorageDeleteActionDefinition,
};
