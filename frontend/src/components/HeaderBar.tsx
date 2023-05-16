import { useState } from "react";
import { PlayerStats } from "../data/playerStats";

export type SortFunc = (a: PlayerStats, b: PlayerStats) => number;

export function getSort(sort: Sort): SortFunc {
  return (a, b) => {
    const left = sort.reversed ? 1 : -1;
    const right = left * -1;

    if (a[sort.prop] === b[sort.prop]) {
      return a.id < b.id ? left : right;
    } else {
      return a[sort.prop] < b[sort.prop] ? left : right;
    }
  };
}

interface Header {
  sort: Sort | null;
  text: string;
  className: string;
}

export interface Sort {
  prop: keyof PlayerStats;
  reversed: boolean;
}

interface HeaderBarProps {
  onSortChange: (newSort: Sort) => void;
}

function getNewSort(prevSort: Sort, newSort: Sort) {
  // Reverse sort if already on this property
  if (prevSort.prop === newSort.prop)
    return { ...newSort, reversed: !prevSort.reversed };

  return newSort;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ onSortChange }) => {
  const [_, setSort] = useState<Sort>({
    prop: "pointsPerGame",
    reversed: true,
  });

  const headers: Header[] = [
    { text: "No.", sort: null, className: "w-11 sm:w-14" },
    {
      text: "Name",
      sort: { prop: "name", reversed: false },
      className: "grow pr-4",
    },
    {
      text: "Games",
      sort: { prop: "games", reversed: true },
      className: "w-20 hidden xl:block",
    },
    {
      text: "Wins",
      sort: { prop: "wins", reversed: true },
      className: "w-20 hidden sm:block",
    },
    {
      text: "Win Percentage",
      sort: { prop: "winPercentage", reversed: true },
      className: "w-36 hidden sm:block",
    },
    {
      text: "Win %",
      sort: { prop: "winPercentage", reversed: true },
      className: "w-16 block sm:hidden",
    },
    {
      text: "Points",
      sort: { prop: "points", reversed: true },
      className: "w-20 hidden sm:block",
    },
    {
      text: "Points Per Game",
      sort: { prop: "pointsPerGame", reversed: true },
      className: "w-32 hidden sm:block",
    },
    {
      text: "Points/Game",
      sort: { prop: "pointsPerGame", reversed: true },
      className: "w-20 block sm:hidden",
    },
  ];

  return (
    <div className="text-gray-400 flex md:px-6 px-4 text-sm sm:text-base">
      {headers.map((h) => (
        <button
          key={h.text}
          className={h.className + " text-left"}
          onClick={() => {
            if (h.sort !== null) {
              // This line stops TS complaining h.sort might be null
              const sort: Sort = h.sort;

              setSort((prevSort) => {
                const newSort = getNewSort(prevSort, sort);
                onSortChange(newSort);

                return newSort;
              });
            }
          }}
        >
          {h.text}
        </button>
      ))}
    </div>
  );
};

export default HeaderBar;
