import { useEffect } from "react";
import Page from "../components/Page.tsx";
import store from "store2";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const lastGroup = store.get('lastGroup');

    if (lastGroup) {
      navigate(`/groups/${lastGroup}/scoreboard`);
    }
  }, [])

  return (
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
  );
}

export default HomePage;
