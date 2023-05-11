import SideBar from "./SideBar";
import { getGroups } from "../data/groups";
import React, { ReactNode, useEffect, useState } from "react";
import { Group } from "../data/types";

export async function loader() {
  const groups = await getGroups();
  return { groups };
}

export interface PageProps {
  children: ReactNode;
  titleBar?: ReactNode;
}

const Page: React.FC<PageProps> = ({ titleBar, children }) => {
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
  const hiddenClasses = sideBarOpen ? "left-0" : "-left-64";

  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    async function getGrps() {
      setGroups(await getGroups());
    }
    getGrps();
  }, []);

  return (
    <div className="h-screen flex bg-gray-50">
      <SideBar
        groups={groups}
        onCloseClick={() => setSideBarOpen(false)}
        className={hiddenClasses}
      />
      <div className="flex-grow" onClick={() => setSideBarOpen(() => false)}>
        <div className="sm:px-4 pt-4 grow flex-col flex h-screen">
          <div className="flex items-center flex-row h-20 pb-4">
            <button
              className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg mx-4 block md:hidden shrink-0"
              onClick={(e) => {
                setSideBarOpen(true);
                e.stopPropagation();
              }}
            >
              =
            </button>
            {titleBar}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Page;
