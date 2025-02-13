import { MetaSwitch } from '@appsemble/react-components';
import { type Training, type TrainingChapter } from '@appsemble/types';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { Route } from 'react-router-dom';

import { getTrainings } from './getTrainings.js';
import { messages } from './messages.js';
import { TrainingPage } from './training/index.js';
import { getChapterBlockedState, getChapterCompletionState } from './utils/index.js';
import { TrainingTree } from '../../components/TrainingTree/index.js';
import { useUser } from '../../components/UserProvider/index.js';

function updateChapterBlockedStates(chapters: TrainingChapter[]): TrainingChapter[] {
  const updatedChapters: TrainingChapter[] = [];
  for (const chapter of chapters) {
    const { trainings } = chapter;

    const updatedStatus = getChapterBlockedState(chapter, chapters);
    const updatedTrainings: Training[] =
      updatedStatus === 'blocked' || updatedStatus === 'available'
        ? trainings.map((tr) => ({ ...tr, status: updatedStatus }))
        : trainings;

    updatedChapters.push({ ...chapter, status: updatedStatus, trainings: updatedTrainings });
  }

  return updatedChapters;
}

export function TrainingRoutes(): ReactNode {
  const [chapters, setChapters] = useState<TrainingChapter[]>([]);
  const isLoggedIn = useUser().userInfo != null;

  // Initialization
  useMemo(async () => {
    let chapterList = await getTrainings(isLoggedIn);
    if (isLoggedIn) {
      chapterList = updateChapterBlockedStates(chapterList);
    }

    setChapters(chapterList);
  }, [isLoggedIn]);

  const handleTrainingCompletion = useCallback(
    (trainingId: string) => {
      setChapters((previousChapters) => {
        const chaptersWithUpdatedTrainings = previousChapters.map((chapter) => {
          const updatedTrainings: Training[] = chapter.trainings.map((training) => {
            if (training.id !== trainingId) {
              return training;
            }
            return { ...training, status: 'completed' };
          });

          // Status of the chapter should be updated as soon as a training is completed
          const updatedStatus = getChapterCompletionState(updatedTrainings);

          return {
            ...chapter,
            trainings: updatedTrainings,
            status: updatedStatus,
          };
        });

        const updatedChapters = isLoggedIn
          ? updateChapterBlockedStates(chaptersWithUpdatedTrainings)
          : chaptersWithUpdatedTrainings;

        return updatedChapters;
      });
    },
    [isLoggedIn],
  );

  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route element={<TrainingTree chapters={chapters} />} path="/" />
      {chapters.map((chapter) =>
        chapter.trainings.map(({ content, id, path, status }, index) => {
          const nextTraining = chapter.trainings[index + 1];
          return (
            <Route
              element={
                <TrainingPage
                  completed={status === 'completed'}
                  content={content}
                  id={id}
                  nextTraining={nextTraining}
                  setCompleted={handleTrainingCompletion}
                />
              }
              key={id}
              path={path}
            />
          );
        }),
      )}
    </MetaSwitch>
  );
}
