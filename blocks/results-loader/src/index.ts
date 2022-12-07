import { bootstrap } from '@appsemble/sdk';

interface Answer {
  question: string;
  answer: 'happy' | 'neutral' | 'sad';
  comment: string;
}

interface Answers {
  surveyId: number;
  answers: Answer[];
  colors?: string[];
}

interface Dataset {
  label: 'happy' | 'neutral' | 'sad';
  data: number[];
  labels: string[];
  color?: string;
}

bootstrap(({ actions, events, utils }) => {
  async function init(data: unknown): Promise<void> {
    const result: Answers[] = await actions.onLoad(data);

    if (result.length > 0) {
      const questions = result[0].answers.map((o) => o.question);
      const answers = result.flatMap((e) => e.answers);

      const sad: Dataset = { label: 'sad', labels: questions, data: [] };
      const neutral: Dataset = { label: 'neutral', labels: questions, data: [] };
      const happy: Dataset = { label: 'happy', labels: questions, data: [] };

      const answerOptions = [sad, neutral, happy];

      for (const [index, option] of answerOptions.entries()) {
        option.color = result[0]?.colors?.[index];
      }

      for (const q of questions) {
        const answersPerQuestion = answers.filter((n) => n.question === q);
        sad.data.push(answersPerQuestion.filter((a) => a.answer === 'sad').length);
        neutral.data.push(answersPerQuestion.filter((a) => a.answer === 'neutral').length);
        happy.data.push(answersPerQuestion.filter((a) => a.answer === 'happy').length);
      }

      events.emit.data(answerOptions);
    }
  }

  events.on.data((d) => {
    init(d);
  });

  init(null).catch(() => {
    events.emit.data(null, 'Failed to load data');
    utils.showMessage(utils.formatMessage('loadErrorMessage'));
  });
});
