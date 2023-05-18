import React from "react";

interface DropdownProps {
  options: { id: number | string; value: string }[];
  disabled?: (number | string)[];
  name: string;
  value?: number | string;
  disableDefault?: boolean;
  className?: string;

  onChange: (id: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  disabled,
  disableDefault,
  name,
  value,
  className,
  onChange,
}) => {
  return (
    <select
      name={name}
      value={value}
      className={`py-2 px-3 rounded-lg ${className}`}
      defaultValue={value === undefined ? "" : undefined}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled={disableDefault ?? true}>
        Select
      </option>
      {options.map((x) => {
        return (
          <option key={x.id} value={x.id} disabled={disabled?.includes(x.id)}>
            {x.value}
          </option>
        );
      })}
    </select>
  );
};

export default Dropdown;
