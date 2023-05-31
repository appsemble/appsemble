import { type VNode } from 'preact';

interface MultipleOptionsProps {
  array: string[];
  onChange: any;
  value: string;
}

export function MultipleOptions({ array, onChange, value }: MultipleOptionsProps): VNode {
  return (
    <div>
      <select onChange={onChange} value={value}>
        {array.map((element: string) => (
          <option key={element} value={element}>
            {element}
          </option>
        ))}
      </select>
    </div>
  );
}
