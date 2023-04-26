import React from "react";
import { Player } from "../App";

interface ButtonProps {
  options: Player[];
  label: string;

  onPlayerChange: (playerId: number) => void;
  onScoreChange: (score: number) => void;
}

const Dropdown: React.FC<ButtonProps> = ({
  options,
  label,
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
        className="w-32"
        onChange={(e) => onPlayerChange(parseInt(e.target.value))}
      >
        <option value="" disabled={true} selected={true}>
          Select
        </option>
        {options.map((val) => {
          return (
            <option key={val.id} value={val.id}>
              {val.name}
            </option>
          );
        })}
      </select>
      <input
        className="w-12 bg-gray-300"
        defaultValue={0}
        onChange={(e) => onScoreChange(parseInt(e.target.value))}
      />
    </div>
  );
};

export default Dropdown;
