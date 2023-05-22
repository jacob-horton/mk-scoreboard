import { useState } from "react";
import Dropdown from "./Dropdown";

export type NumberGames = number | "All";

interface NumberGamesProps {
  onGamesChange: (n: NumberGames) => void;
  align: "items-end" | "items-start";
}

const NumberGamesSelector: React.FC<NumberGamesProps> = ({
  align,
  onGamesChange,
}) => {
  const [numberGames, setNumberGames] = useState<NumberGames>(10);
  const numberGamesOptions: NumberGames[] = [1, 5, 10, 25, 50, "All"];

  return (
    <div className={`flex flex-col ${align}`}>
      <p className="text-gray-800">Number of Games</p>
      <Dropdown
        name="Number of games"
        value={numberGames}
        options={numberGamesOptions.map((x) => ({
          id: x,
          value: x.toString(),
        }))}
        onChange={(val) => {
          const asNumber = Number(val);
          if (!isNaN(asNumber)) {
            setNumberGames(asNumber);
            onGamesChange(asNumber);
          } else if (val === "All") {
            setNumberGames(val);
            onGamesChange(val);
          }
        }}
      />
    </div>
  );
};

export default NumberGamesSelector;
