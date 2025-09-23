import { bootstrap } from '@appsemble/sdk';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
);

function formatLabel(str: string, maxWidth: number): string[] {
  const sections = [];
  const words = str.split(' ');
  let temp = '';

  for (const [index, item] of words.entries()) {
    if (temp.length > 0) {
      const concat = `${temp} ${item}`;

      if (concat.length > maxWidth) {
        sections.push(temp);
        temp = '';
      } else {
        if (index === words.length - 1) {
          sections.push(concat);
          continue;
        } else {
          temp = concat;
          continue;
        }
      }
    }

    if (index === words.length - 1) {
      sections.push(item);
      continue;
    }

    if (item.length < maxWidth) {
      temp = item;
    } else {
      sections.push(item);
    }
  }

  return sections;
}

interface DataSet {
  type?: 'bar' | 'line';

  label?: string;

  data: number[];

  labels?: string[];

  color: string;
}

bootstrap(
  ({
    actions,
    events,
    parameters: { backgroundColors, labelOptions, labels, type = 'line', yAxis },
    shadowRoot,
    theme,
    utils: { remap },
  }) => {
    const loader = document.createElement('progress');
    loader.classList.add('progress', 'is-small', 'is-primary');
    shadowRoot.append(loader);
    let loaded = false;

    const canvas = document.createElement('canvas');
    shadowRoot.append(canvas);
    const ctx = canvas.getContext('2d');
    const yAxisID = 'y';
    // @ts-expect-error strictNullChecks null is not assignable to type
    const chart = new Chart(ctx, {
      type,
      data: {
        labels: labels?.map((label) => remap(label, {})),
        datasets: [],
      },
      options: {
        responsive: true,
        onClick(e, element) {
          if (!element || element.length === 0) {
            actions.onClick?.({});
            return;
          }
          // $context isn't a property in the ActiveElement interface, but it is there at runtime
          if ('$context' in element[0].element) {
            const { x, y }: { x: number; y: number } = (element as any)[0].element.$context.parsed;
            actions.onClick?.({ label: chart.data.labels?.[x], value: y });
          }
        },
        scales: {
          x: {
            ticks: {
              font: labelOptions?.font,
              callback(tickValue) {
                const value = tickValue as number;

                return labelOptions?.maxWidth
                  ? formatLabel(this.getLabelForValue(value), labelOptions?.maxWidth as number)
                  : this.getLabelForValue(value);
              },
            },
          },
          [yAxisID]: {
            min: yAxis.min,
            max: yAxis.max,
            ticks: {
              stepSize: yAxis.step,
            },
            grid: {
              color: yAxis.colors || ['#ededed'],
            },
          },
        },
      },
    });

    function addDataset(dataset: DataSet): void {
      if (typeof dataset !== 'object') {
        return;
      }
      if (!dataset) {
        return;
      }
      let datasetType = dataset.type;
      if (datasetType == null) {
        datasetType = type;
      }
      if (datasetType !== 'line' && datasetType !== 'bar') {
        return;
      }
      if (!Array.isArray(dataset.data)) {
        return;
      }
      const backgroundColor: string[] = [];
      if (Array.isArray(dataset.labels)) {
        chart.data.labels = dataset.labels;
      }
      for (let i = 0; i < (chart.data.labels?.length ?? 0) && i < dataset.data.length; i += 1) {
        if (backgroundColors) {
          const remapper = backgroundColors[i % backgroundColors.length];
          const color = remap(remapper, { data: dataset.data[i] });
          backgroundColor.push(typeof color === 'string' ? color : theme.primaryColor);
        } else {
          backgroundColor.push(theme.primaryColor);
        }
      }
      chart.data.datasets.push({
        type: datasetType as 'bar',
        label: dataset.label ?? '',
        backgroundColor: dataset.color ?? backgroundColor,
        data: dataset.data,
        yAxisID,
      });
    }

    function addDatasets(dataset: DataSet | DataSet[]): void {
      if (!loaded) {
        loaded = true;
        loader.remove();
      }

      if (Array.isArray(dataset)) {
        for (const entry of dataset) {
          addDataset(entry);
        }
      } else {
        addDataset(dataset);
      }
      chart.update();
    }

    events.on.add(addDatasets);

    events.on.replace((data) => {
      chart.data.datasets.length = 0;
      addDatasets(data as DataSet);
    });
  },
);
