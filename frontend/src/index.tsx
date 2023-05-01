import React from "react";
import ReactDOM from "react-dom/client";
import App, { loader as appLoader } from "./App.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Scoreboard, { loader as groupLoader } from "./routes/scoreboard.tsx";
import AddGame, { loader as addGameLoader } from "./routes/addGame.tsx";
import SimpleScoreboard from "./routes/simpleScoreboard.tsx";

// TODO: use group ID
const router = createBrowserRouter([
  {
    path: "/*",
    element: <App />,
    loader: appLoader,
    errorElement: <p>404 Page Not Found</p>,
    children: [
      {
        path: "",
        element: (
          <div className="flex grow pt-8 flex-col space-y-4">
            <h1 className="grow text-center text-4xl font-light">
              Welcome to Mario Kart Scoreboards!
            </h1>
            <p className="grow text-center">
              Please create or select a group to get started
            </p>
          </div>
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
        path: "old-scores",
        element: <SimpleScoreboard />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
