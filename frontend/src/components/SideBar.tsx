import React from "react";
import { Group } from "../data/types";
import SideBarButton from "./SideBarButton";
import store from "store2";

const Title: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const buttonClasses = "w-8 h-8 rounded-lg transition";
  return (
    <div className="flex m-4 items-center justify-between space-x-8">
      <h1 className="text-4xl font-light">Groups</h1>
      <div className="space-x-2">
        <button
          className={`bg-blue-500 hover:bg-blue-400 text-white ${buttonClasses}`}
          onClick={() => {
            const val = store.get("graphTension");
            store.set("graphTension", val === 0 ? 0.3 : 0);
          }}
        >
          +
        </button>
        <button
          className={`bg-gray-200 hover:bg-gray-300 md:hidden ${buttonClasses}`}
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
      className={`bg-gray-100
        w-64 z-10 shrink-0
        md:static fixed
        bottom-0 top-0
        border-r
        flex flex-col
        transition-all
        ${className}`}
    >
      <Title onClose={onClose} />
      <nav className="px-3 py-4 grow flex">
        <ul className="space-y-2 font-medium flex flex-col grow">
          <li key="active-header">Active</li>
          <hr />
          {groups.filter((group) => !group.archived).map((group) => (
            <li key={group.id}>
              <SideBarButton
                page={`/groups/${group.id}/scoreboard`}
                onClick={onClose}
                name={group.name}
              />
            </li>
          ))}
          <li key="archived-header" className="pt-8">Archived</li>
          <hr />
          {groups.filter((group) => group.archived).map((group) => (
            <li key={group.id}>
              <SideBarButton
                page={`/groups/${group.id}/scoreboard`}
                onClick={onClose}
                name={group.name}
              />
            </li>
          ))}
          <li key="space" className="grow flex h-12" />
          <li key={"Random"}>
            <SideBarButton
              page="/randomiser"
              name="Item Randomiser"
              onClick={onClose}
            />
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default SideBar;
