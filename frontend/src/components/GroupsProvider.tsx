import { createContext, useEffect, useState } from "react";
import { Group } from "../data/types";
import { getGroups } from "../data/groups";

const GroupsContext = createContext<
  { groups: Group[], updateGroups: () => void }
>({ groups: [], updateGroups: () => { } });

const GroupsProvider = ({ children }: { children: React.ReactNode }) => {
  const [groups, setGroups] = useState<Group[]>([]);

  async function updateGroups() {
    setGroups(await getGroups());
  }

  // Load groups on first load
  useEffect(() => {
    updateGroups();
  }, []);

  return (
    <GroupsContext.Provider value={{ groups, updateGroups }}>
      {children}
    </GroupsContext.Provider>
  );
};

export { GroupsProvider, GroupsContext };
