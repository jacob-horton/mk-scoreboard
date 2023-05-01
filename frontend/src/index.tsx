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
    path: "/",
    element: <App />,
    loader: appLoader,
    children: [
      {
        path: "groups/:groupName/scoreboard",
        element: <Scoreboard />,
        loader: groupLoader,
      },
      {
        path: "groups/:groupName/add-game",
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
