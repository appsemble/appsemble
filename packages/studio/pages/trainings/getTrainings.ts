import {
  type Training,
  type TrainingChapter,
  type TrainingChapterProperties,
} from '@appsemble/types';
import axios from 'axios';

import { getChapterCompletionState } from './utils/index.js';

const order = [
  'introduction',
  'how-to-create-an-app',
  'data-flow',
  'storing-data',
  'data-transformation',
  'styling-apps',
  'basic-app',
];

function bumpByOrder(a: string, b: string): number {
  return order.indexOf(a.split('/')[1]) - order.indexOf(b.split('/')[1]);
}

export async function getTrainings(isLoggedIn: boolean): Promise<TrainingChapter[]> {
  const context = require.context('../../../../trainings', true, /\.mdx?$|\.json$/);
  const validTrainingIds = (await axios.get<string[]>('/api/trainings')).data;
  const completedTrainings = isLoggedIn
    ? (await axios.get<string[]>('/api/trainings/completed')).data
    : [];

  const chapters: TrainingChapter[] = [];
  const properties = context
    .keys()
    .filter((path) => path.endsWith('properties.json'))
    .sort(bumpByOrder);

  for (const path of properties) {
    const { blockedBy, title, trainingOrder }: TrainingChapterProperties = context(path);
    const chapterName = path.split('/')[1];

    // Adds trainings to the chapter based on the trainingOrder.
    // Filters for validated ones from the database.
    const trainings = trainingOrder.map((documentPath: string) => {
      if (!validTrainingIds.includes(documentPath)) {
        return;
      }
      const absolutePath = `./${chapterName}/${documentPath}/index.md`;
      const { default: Component, title: trainingTitle } = context(
        absolutePath,
      ) as typeof import('*.md');

      const training: Training = {
        content: Component,
        status: completedTrainings.includes(documentPath) ? 'completed' : 'available',
        path: `${chapterName}/${documentPath}`,
        id: documentPath,
        title: trainingTitle,
      };
      return training;
    });

    const trainingChapter: TrainingChapter = {
      blockedBy,
      title,
      id: chapterName,
      trainings,
      status: isLoggedIn ? getChapterCompletionState(trainings) : 'available',
    };

    chapters.push(trainingChapter);
    continue;
  }

  return chapters;
}
