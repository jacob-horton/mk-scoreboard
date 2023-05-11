import React from "react";
import { Player } from "../data/types";
import IntTextBox from "./IntTextBox";
import Dropdown from "./Dropdown";

interface PlayerScoreInputProps {
  players: Player[];
  disabled: number[];
  label: string;
  value: number | undefined;

  onPlayerChange: (playerId: number) => void;
  onScoreChange: (score: number) => void;
}

const PlayerScoreInput: React.FC<PlayerScoreInputProps> = ({
  players,
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
      <Dropdown
        options={players.map((p) => ({ id: p.id, value: p.name }))}
        disabled={disabled}
        value={value}
        name={label}
        onChange={(id) => onPlayerChange(parseInt(id))}
      />
      <IntTextBox onChange={onScoreChange} />
    </div>
  );
};

export default PlayerScoreInput;
