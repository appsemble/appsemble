This block can render bar and line charts. The chart always starts empty. Data can be added using
events.

To add data, an event may emit either a single data object, or an array of data objects. The data is
expected to adhere to a certain interface.

- `type`: This is should be a string containing either `bar` or `line`. If this is unspecified, the
  `type` defined by the block parameters is used.
- `label`: This should be a textual description of the dataset.
- `data`: The data should be an object of the following format:
  - `data`: array of numbers.
- - `labels`: array of strings representing each data entry.

If a value is null, it’s skipped from the chart.
