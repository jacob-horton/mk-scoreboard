import SideBar from "./components/SideBar";
import { Outlet, useLoaderData } from "react-router-dom";
import { getGroups } from "./data/groups";
import { useState } from "react";

export async function loader() {
  const groups = await getGroups();
  return { groups };
}

const App = () => {
  const { groups } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const hidden = sideBarOpen ? "" : "hidden";

  return (
    <div className="h-screen flex bg-gray-50">
      <SideBar
        groups={groups}
        closeable={true}
        onClose={() => setSideBarOpen(() => false)}
        className={`md:hidden fixed z-10 h-screen ${hidden}`}
      />
      <SideBar
        groups={groups}
        closeable={false}
        className={`hidden md:block ${hidden}`}
      />
      <button
        className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg ml-4 mt-5 block md:hidden shrink-0"
        onClick={() => setSideBarOpen((prev) => !prev)}
      >
        =
      </button>
      <div className="flex-grow" onClick={() => setSideBarOpen(() => false)}>
        <Outlet />
      </div>
    </div>
  );
};

export default App;
