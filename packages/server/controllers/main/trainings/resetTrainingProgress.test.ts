import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { setArgv } from '../../../index.js';
import { Training, TrainingCompleted, type User } from '../../../models/index.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

describe('resetTrainingProgress', () => {
  let user: User;
  let training: Training;

  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
    training = await Training.create({ id: 'test-training-0' });
  });

  it('should delete all "completed" entries', async () => {
    authorizeStudio();
    await TrainingCompleted.create({ TrainingId: training.id, UserId: user.id });

    const response = await request.delete('/api/trainings/completed');

    expect(response.status).toBe(204);
    const completedTrainings = await TrainingCompleted.count({ where: { UserId: user.id } });
    expect(completedTrainings).toBe(0);
  });
});
