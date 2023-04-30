import React from "react";
import { Player } from "../data/types";
import IntTextBox from "./IntTextBox";

interface ButtonProps {
  options: Player[];
  disabled: number[];
  label: string;
  value: number | undefined;

  onPlayerChange: (playerId: number) => void;
  onScoreChange: (score: number) => void;
}

const Dropdown: React.FC<ButtonProps> = ({
  options,
  disabled,
  label,
  value,
  onPlayerChange,
  onScoreChange,
}) => {
  return (
    <div>
      <div className="w-26">
        <label>{label}</label>
      </div>
      <select
        name={label}
        value={value}
        className="w-40 p-2 rounded-lg"
        defaultValue=""
        onChange={(e) => onPlayerChange(parseInt(e.target.value))}
      >
        <option value="" disabled={true}>
          Select
        </option>
        {options.map((val) => {
          return (
            <option
              key={val.id}
              value={val.id}
              disabled={disabled.includes(val.id)}
            >
              {val.name}
            </option>
          );
        })}
      </select>
      <IntTextBox onChange={onScoreChange} />
    </div>
  );
};

export default Dropdown;
