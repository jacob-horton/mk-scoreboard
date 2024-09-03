import React, { useContext, useMemo } from "react";
import SideBarButton from "./SideBarButton";
import { GroupsContext } from "./GroupsProvider";

const Title: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const buttonClasses = "w-8 h-8 rounded-lg transition";
  return (
    <div className="flex m-4 items-center justify-between space-x-8">
      <h1 className="text-4xl font-light">Groups</h1>
      <button
        className={`bg-gray-200 hover:bg-gray-300 md:hidden ${buttonClasses}`}
        onClick={onClose}
      >
        {"<"}
      </button>
    </div>
  );
};

interface SideBarProps {
  className?: string;

  onCloseClick?: () => void;
}

const SideBar: React.FC<SideBarProps> = ({
  className,
  onCloseClick: onClose,
}) => {
  const { groups } = useContext(GroupsContext);

  const { active, archived } = useMemo(() => {
    const active = [];
    const archived = [];

    for (const group of groups) {
      if (group.archived) {
        archived.push(group);
      } else {
        active.push(group);
      }
    }

    return { active, archived };
  }, [groups]);

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
      <nav className="px-3 py-4 grow flex overflow-y-scroll">
        <ul className="space-y-2 font-medium flex flex-col grow">
          {
            active.length > 0 ?
              <>
                <li key="active-header">Active</li>
                <hr />
              </> : null
          }
          {active.map((group) => (
            <li key={group.id}>
              <SideBarButton
                page={`/groups/${group.id}/scoreboard`}
                onClick={onClose}
                name={group.name}
              />
            </li>
          ))}
          {
            archived.length > 0 ?
              <>
                <li key="archived-header" className="pt-8">Archived</li>
                <hr />
              </> : null
          }
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

          <li key="random">
            <SideBarButton
              page="/randomiser"
              name="Item Randomiser"
              onClick={onClose}
            />
          </li>

          <li key="settings">
            <SideBarButton
              page="/settings"
              name="Settings"
              onClick={onClose}
            />
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default SideBar;
