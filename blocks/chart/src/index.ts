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

import './index.css';

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
    parameters: { backgroundColors, description, labelOptions, labels, type = 'line', yAxis },
    shadowRoot,
    theme,
    utils: { formatMessage, remap },
  }) => {
    const loader = document.createElement('progress');
    loader.classList.add('progress', 'is-small', 'is-primary');
    shadowRoot.append(loader);
    let loaded = false;

    const name = (remap(description, {}) as string) || formatMessage('chart');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', name);
    const table = document.createElement('table');
    table.className = 'table data';
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

    // The table gives screen reader users the data, and keyboard users the click action.
    function renderTable(): void {
      table.replaceChildren();
      table.createCaption().textContent = name;
      const head = table.createTHead().insertRow();
      head.append(document.createElement('td'));
      for (const dataset of chart.data.datasets) {
        const header = document.createElement('th');
        header.scope = 'col';
        header.textContent = dataset.label ?? '';
        head.append(header);
      }
      const body = table.createTBody();
      for (const [index, label] of (chart.data.labels ?? []).entries()) {
        const row = body.insertRow();
        const header = document.createElement('th');
        header.scope = 'row';
        header.textContent = String(label);
        row.append(header);
        for (const dataset of chart.data.datasets) {
          const cell = row.insertCell();
          const value = dataset.data[index] as number | undefined;
          if (value == null) {
            continue;
          }
          if (!actions.onClick || actions.onClick.type === 'noop') {
            cell.textContent = String(value);
            continue;
          }
          const button = document.createElement('button');
          button.className = 'button is-small';
          button.type = 'button';
          button.textContent = String(value);
          button.addEventListener('click', () => actions.onClick?.({ label, value }));
          cell.append(button);
        }
      }
    }

    function addDatasets(dataset: DataSet | DataSet[]): void {
      if (!loaded) {
        loaded = true;
        loader.remove();
        shadowRoot.append(table);
      }

      if (Array.isArray(dataset)) {
        for (const entry of dataset) {
          addDataset(entry);
        }
      } else {
        addDataset(dataset);
      }
      chart.update();
      renderTable();
    }

    events.on.add(addDatasets);

    events.on.replace((data) => {
      chart.data.datasets.length = 0;
      addDatasets(data as DataSet);
    });
  },
);
