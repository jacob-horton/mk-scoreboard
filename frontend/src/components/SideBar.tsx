import React from "react";
import { NavLink } from "react-router-dom";
import { Group } from "../data/types";

interface SideBarButtonProps {
  name: string;
  page: string;
  onClick?: () => void;
}

const SideBarButton: React.FC<SideBarButtonProps> = ({
  name,
  page,
  onClick,
}) => {
  return (
    <NavLink
      to={page}
      onClick={onClick}
      className={({ isActive }) => {
        const colour = isActive
          ? "bg-blue-200 text-blue-500 hover:bg-blue-100"
          : "hover:bg-gray-200 text-gray-800";
        return `flex w-full items-center py-2 px-4 rounded-lg transition ${colour}`;
      }}
    >
      {name}
    </NavLink>
  );
};

interface SideBarProps {
  groups: Group[];
  onCloseClick?: () => void;
  className?: string;
}

const SideBar: React.FC<SideBarProps> = ({
  groups,
  className,
  onCloseClick: onClose,
}) => {
  return (
    <div
      className={`bg-gray-100 w-64 border-r shrink-0 md:static fixed flex flex-col ${className}`}
    >
      <div className="flex m-4 items-center justify-between space-x-8">
        <h1 className="text-4xl font-light">Groups</h1>
        <div className="space-x-2">
          <button className="w-8 h-8 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition">
            +
          </button>

          <button
            className={`w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 transition md:hidden`}
            onClick={onClose}
          >
            {"<"}
          </button>
        </div>
      </div>
      <nav className="px-3 py-4 grow flex">
        <ul className="space-y-2 font-medium flex flex-col grow">
          {groups.map((group) => (
            <li key={group.id}>
              <SideBarButton
                page={`/groups/${group.id}/scoreboard`}
                onClick={onClose}
                name={group.name}
              />
            </li>
          ))}
          <li key="space" className="grow flex h-12" />
          <li key={"Old Scores"}>
            <SideBarButton
              page={`/groups/old-scores`}
              name="Old Scores"
              onClick={onClose}
            />
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default SideBar;
