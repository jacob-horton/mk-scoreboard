import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Scoreboard, { loader as groupLoader } from "./routes/scoreboard.tsx";
import AddGame from "./routes/addGame.tsx";
import { loader as addGameLoader } from "./routes/functions/addGame.tsx";
import Graph, { loader as graphLoader } from "./routes/graph.tsx";
import Page from "./components/Page.tsx";
import ItemGenerator from "./routes/itemGenerator.tsx";
import HeadToHead from "./routes/headToHead.tsx";
import Settings from "./routes/settings.tsx";

const router = createBrowserRouter([
  {
    path: "/*",
    element: <Outlet />,
    errorElement: <p>404 Page Not Found</p>,
    children: [
      {
        path: "",
        element: (
          <Page
            titleBar={
              <h1 className="grow text-center text-4xl font-light">
                Welcome to Mario Kart Scoreboards!
              </h1>
            }
          >
            <div className="flex grow pt-8 flex-col space-y-4">
              <p className="grow text-center">
                Please create or select a group to get started
              </p>
            </div>
          </Page>
        ),
      },
      {
        path: "groups/:groupId/scoreboard",
        element: <Scoreboard />,
        loader: groupLoader,
      },
      {
        path: "groups/:groupId/add-game",
        element: <AddGame />,
        loader: addGameLoader,
      },
      {
        path: "groups/:groupId/graphs/:playerId",
        element: <Graph />,
        loader: graphLoader,
      },
      {
        path: "groups/:groupId/head_to_head",
        element: <HeadToHead />,
        loader: addGameLoader,
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
    <div className="h-full">
      <RouterProvider router={router} />
    </div>
  </React.StrictMode>
);
