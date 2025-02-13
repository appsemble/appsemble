import { controller } from '@appsemble/sdk';

controller(({ events }) => ({
  calculate(data: { a: number; b: number; operation: 'addition' | 'multiplication' }): void {
    const { a, b, operation } = data;

    let result;
    switch (operation) {
      case 'addition':
        result = a + b;
        break;
      case 'multiplication':
        result = a * b;
        break;
      default:
        result = Number.NaN;
        break;
    }

    events.emit.data({ result });
  },
}));
