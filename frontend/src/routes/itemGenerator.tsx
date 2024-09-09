import { useState } from "react";
import Page from "../components/Page";

const ItemGenerator = () => {
  const numItems = 22;

  const numRolls = 10;
  const rollTime = 2000;
  const unadjustedTime =
    (1 / 3) * Math.pow(numRolls, 3) + Math.pow(numRolls, 2) + numRolls;
  const multiplier = rollTime / unadjustedTime;

  const selected = "bg-indigo-600";
  const unselected = "bg-gray-200 grayscale-[50%]";

  const [selection, setSelection] = useState<number[]>([]);
  const [isRandomising, setIsRandomising] = useState<boolean>(false);

  const randomise = () => {
    const length = Math.ceil(Math.random() * (numItems / 2));
    setSelection(
      Array.from({ length }, () => Math.floor(Math.random() * numItems))
    );
  };

  return (
    <Page titleBar={<h1 className="text-4xl font-light">Randomiser</h1>}>
      <div className="space-y-4 px-4 sm:px-0">
        <div className="grid grid-cols-6 gap-1 sm:gap-4 w-max">
          {[...Array(numItems)].map((_, i) => (
            <img
              key={i}
              src={`items/${i}.png`}
              className={`w-14 sm:w-24 rounded-lg p-1 sm:p-2 duration-75 transition ${selection.includes(i) ? selected : unselected
                }`}
            />
          ))}
        </div>
        <div className="space-x-3">
          <button
            className="bg-blue-500 text-white px-4 py-2 w-min rounded-lg disabled:bg-gray-400 disabled:text-gray-800"
            disabled={isRandomising}
            onClick={async () => {
              setIsRandomising(true);
              for (let i = 0; i < numRolls; i++) {
                randomise();
                await new Promise((r) =>
                  setTimeout(r, multiplier * Math.pow(i + 1, 2))
                );
              }
              setIsRandomising(false);
            }}
          >
            Randomise
          </button>
          <button
            className="bg-gray-200 px-4 py-2 w-min rounded-lg disabled:bg-gray-400"
            disabled={isRandomising}
            onClick={() => setSelection([])}
          >
            Reset
          </button>
        </div>
      </div>
    </Page>
  );
};

export default ItemGenerator;
