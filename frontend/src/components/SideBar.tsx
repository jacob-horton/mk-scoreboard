import React from "react";
import { Link } from "react-router-dom";

interface SideBarButtonProps {
  selected: boolean;
  name: string;
  page: string;
}

const SideBarButton: React.FC<SideBarButtonProps> = ({
  selected,
  name,
  page,
}) => {
  const colour = selected
    ? "bg-blue-200 text-blue-500 hover:bg-blue-100"
    : "hover:bg-gray-200 text-gray-800";

  return (
    <Link
      to={page}
      className={`flex w-full items-center py-2 px-4 rounded-lg transition ${colour}`}
    >
      {name}
    </Link>
  );
};

interface SideBarProps {
  groups: string[];
  selected: number;
  onButtonPress: (index: number) => void;
}

const SideBar: React.FC<SideBarProps> = ({ groups }) => {
  return (
    <div className="bg-gray-100 w-64 h-screen border-r">
      <div className="flex m-4 items-center justify-between">
        <h1 className="text-4xl font-light pr-4">Groups</h1>
        <button className="w-8 h-8 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition">
          +
        </button>
      </div>
      <nav className="px-3 py-4">
        <ul className="space-y-2 font-medium">
          {groups.map((group, index) => (
            <li key={group}>
              <SideBarButton
                selected={true}
                page={`/groups/${group}/scoreboard`}
                name={group}
              />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default SideBar;
