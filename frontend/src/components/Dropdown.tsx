import React from "react";
import { Player } from "../data/types";

interface ButtonProps {
  options: Player[];
  label: string;
  disabled: number[];

  onPlayerChange: (playerId: number) => void;
  onScoreChange: (score: number) => void;
}

const Dropdown: React.FC<ButtonProps> = ({
  options,
  label,
  disabled,
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
        className="w-32 p-2 rounded-lg"
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
      <input
        className="w-14 bg-gray-300 ml-4 p-2 rounded-lg"
        defaultValue={0}
        onChange={(e) => onScoreChange(parseInt(e.target.value))}
      />
    </div>
  );
};

export default Dropdown;
