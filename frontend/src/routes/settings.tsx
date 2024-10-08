import { useContext, useState } from "react";
import Page from "../components/Page";
import { Form } from "react-router-dom";
import IntTextBox from "../components/IntTextBox";
import store from "store2";
import { GroupsContext } from "../components/GroupsProvider";
import { AuthContext } from "../components/AuthProvider";
import ax from "../data/fetch";
import axios from "axios";

const Settings = () => {
  const { isAuthenticated, authenticate, logout, username } = useContext(AuthContext);

  // Add player
  const [playerName, setPlayerName] = useState<string>("");

  const handleCreatePlayer = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    try {
      await ax.post("/player", { name: playerName });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data)
        return;
      } else {
        throw error;
      }
    }

    setPlayerName("");
  }

  // Add group
  const [groupName, setGroupName] = useState<string>("");
  const [maxScore, setMaxScore] = useState<number | null>(null);
  const { updateGroups } = useContext(GroupsContext);

  const handleCreateGroup = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    try {
      await ax.post("/group", { name: groupName, maxScore });
    } catch (error) {
      if (axios.isAxiosError(error)) {

        alert(error.response?.data)
        return;
      } else {
        throw error;
      }
    }

    setGroupName("");
    setMaxScore(null);
    updateGroups();
  }

  // Login
  const [userName, setUserName] = useState<string>("");
  const [userPassword, setUserPassword] = useState<string>("");

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const success = await authenticate(userName, userPassword);
    if (!success) {
      alert("Failed to authenticate");
      return;
    }

    setUserName("");
    setUserPassword("");
  }

  // Graph tension
  const [graphTension, _setGraphTension] = useState<number>(store.get("graphTension"));
  const setGraphTension = (tension: number) => {
    store.set("graphTension", tension);
    _setGraphTension(tension);
  }

  return (
    <Page titleBar={<h1 className="text-4xl font-light">Settings</h1>}>
      <div className="max-w-72 px-4 sm:px-0 space-y-16">
        {isAuthenticated && <Form onSubmit={handleCreatePlayer} className="space-y-4">
          <h2 className="text-xl text-gray-800">Create Player</h2>
          <div className="flex flex-col">
            <label>Name</label>
            <input
              className="bg-gray-300 p-2 rounded-lg"
              placeholder="e.g. John Smith"
              required={true}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>

          <button
            className="px-4 py-2 rounded-lg transition bg-blue-500 text-white hover:bg-blue-400"
            type="submit"
          >
            Submit
          </button>
        </Form>}

        {isAuthenticated && <Form onSubmit={handleCreateGroup} className="space-y-4">
          <h2 className="text-xl text-gray-800">Create Group</h2>
          <div className="flex flex-col">
            <label>Name</label>
            <input
              className="bg-gray-300 p-2 rounded-lg"
              placeholder="e.g. Switch"
              required={true}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label>Max Points</label>
            <IntTextBox onChange={(score) => setMaxScore(score)} required={false} />
          </div>

          <button
            className="px-4 py-2 rounded-lg transition bg-blue-500 text-white hover:bg-blue-400"
            type="submit"
          >
            Submit
          </button>
        </Form>}

        <div className="space-y-2">
          <h2 className="text-xl text-gray-800">Account</h2>
          {
            isAuthenticated
              ? <div className="space-y-2">
                <p>Logged in as {username}</p>
                <button
                  className="px-4 py-2 rounded-lg transition bg-blue-500 text-white hover:bg-blue-400"
                  onClick={logout}
                >Logout</button>
              </div>
              : <form onSubmit={handleLogin} className="space-y-2">
                <div className="flex flex-col">
                  <label>Name</label>
                  <input
                    name="name"
                    className="bg-gray-300 p-2 rounded-lg"
                    placeholder="e.g. John Smith"
                    required={true}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col">
                  <label>Password</label>
                  <input
                    name="password"
                    className="bg-gray-300 p-2 rounded-lg"
                    placeholder="********"
                    required={true}
                    value={userPassword}
                    type="password"
                    onChange={(e) => setUserPassword(e.target.value)}
                  />
                </div>

                <button
                  className="px-4 py-2 rounded-lg transition bg-blue-500 text-white hover:bg-blue-400"
                  type="submit"
                >
                  Login
                </button>
              </form>
          }
        </div>

        <div className="space-y-2">
          <h2 className="text-xl text-gray-800">Other Settings</h2>
          <div>
            <input type="checkbox" checked={graphTension !== 0} onChange={(e) => {
              if (e.target.checked) {
                setGraphTension(0.3);
              } else {
                setGraphTension(0);
              }
            }} />
            <label className="pl-2">Stylise graph</label>
          </div>
        </div>

        <div id="spacer" />
      </div>
    </Page >
  );
};

export default Settings;
