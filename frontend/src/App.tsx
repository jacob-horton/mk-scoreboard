import { useState } from "react";
import SideBar from "./components/SideBar";
import { Outlet, useLoaderData } from "react-router-dom";
import { getGroups } from "./data/groups";

export async function loader() {
  const groups = await getGroups();
  return { groups };
}

const App = () => {
  const [selected, setSelected] = useState(0);
  const { groups } = useLoaderData();

  return (
    <div className="h-screen flex bg-gray-50">
      <SideBar
        groups={groups}
        selected={selected}
        onButtonPress={(index) => setSelected(index)}
      />
      <Outlet />
    </div>
  );
};

export default App;
