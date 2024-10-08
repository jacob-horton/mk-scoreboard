import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Scoreboard, { loader as groupLoader } from "./routes/scoreboard.tsx";
import AddGame from "./routes/addGame.tsx";
import { loader as gameLoader } from "./routes/functions/addGame.tsx";
import Graph, { loader as graphLoader } from "./routes/graph.tsx";
import ItemGenerator from "./routes/itemGenerator.tsx";
import HeadToHead from "./routes/headToHead.tsx";
import Settings from "./routes/settings.tsx";
import { GroupsProvider } from "./components/GroupsProvider.tsx";
import { AuthProvider } from "./components/AuthProvider.tsx";
import ModifyPlayers from "./routes/modifyPlayers.tsx";
import HomePage from "./routes/homePage.tsx";

const router = createBrowserRouter([
  {
    path: "/*",
    element: <Outlet />,
    errorElement: <p>404 Page Not Found</p>,
    children: [
      {
        path: "",
        element: <HomePage />,
      },
      {
        path: "groups/:groupId/scoreboard",
        element: <Scoreboard />,
        loader: groupLoader,
      },
      {
        path: "groups/:groupId/add-game",
        element: <AddGame />,
        loader: gameLoader,
      },
      {
        path: "groups/:groupId/graphs/:playerId",
        element: <Graph />,
        loader: graphLoader,
      },
      {
        path: "groups/:groupId/head_to_head",
        element: <HeadToHead />,
        loader: gameLoader,
      },
      {
        path: "groups/:groupId/add_player",
        element: <ModifyPlayers />,
        loader: gameLoader,
      },
      {
        path: "randomiser",
        element: <ItemGenerator />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GroupsProvider>
      <AuthProvider>
        <div className="h-full">
          <RouterProvider router={router} />
        </div>
      </AuthProvider>
    </GroupsProvider>
  </React.StrictMode>
);
