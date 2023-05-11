import React from "react";
import { Group } from "../data/types";
import SideBarButton from "./SideBarButton";

const Title: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  return (
    <div className="flex m-4 items-center justify-between space-x-8">
      <h1 className="text-4xl font-light">Groups</h1>
      <div className="space-x-2">
        <button className="w-8 h-8 bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition">
          +
        </button>
        <button
          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg transition md:hidden"
          onClick={onClose}
        >
          {"<"}
        </button>
      </div>
    </div>
  );
};

interface SideBarProps {
  groups: Group[];
  className?: string;

  onCloseClick?: () => void;
}

const SideBar: React.FC<SideBarProps> = ({
  groups,
  className,
  onCloseClick: onClose,
}) => {
  return (
    <div
      className={`bg-gray-100 w-64 border-r shrink-0 md:static fixed flex flex-col z-10 h-screen transition-all ${className}`}
    >
      <Title onClose={onClose} />
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
