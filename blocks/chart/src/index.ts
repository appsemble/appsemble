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

interface DataSet {
  type?: 'bar' | 'line';

  label?: string;

  data: number[];

  labels?: string[];
}

bootstrap(
  ({
    events,
    parameters: { backgroundColors, labels, type = 'line', yAxis },
    shadowRoot,
    theme,
    utils: { remap },
  }) => {
    const canvas = document.createElement('canvas');
    shadowRoot.append(canvas);
    const ctx = canvas.getContext('2d');
    const yAxisID = 'a';
    const chart = new Chart(ctx, {
      type,
      data: {
        labels: labels?.map((label) => remap(label, {})),
        datasets: [],
      },
      options: {
        responsive: true,
        scales: { [yAxisID]: yAxis },
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
      for (let i = 0; i < chart.data.labels.length && i < dataset.data.length; i += 1) {
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
        backgroundColor,
        data: dataset.data,
        yAxisID,
      });
    }

    function addDatasets(dataset: DataSet | DataSet[]): void {
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
