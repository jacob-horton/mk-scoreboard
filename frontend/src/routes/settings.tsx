import { useContext, useState } from "react";
import Page from "../components/Page";
import { Form } from "react-router-dom";
import getApiAddr from "../data/ip";
import IntTextBox from "../components/IntTextBox";
import store from "store2";
import { GroupsContext } from "../components/GroupsProvider";
import { AuthContext } from "../components/AuthProvider";

const Settings = () => {
  const apiAddr = getApiAddr();
  const { isAuthenticated, authenticate, logout, jwt } = useContext(AuthContext);

  // Add player
  const [playerName, setPlayerName] = useState<string>("");

  const handleCreatePlayer = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const body = { name: playerName }

    const url = new URL(`${apiAddr}/player`);
    const resp = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}` },
    });

    if (!resp.ok) {
      alert(await resp.text())
      return;
    }

    setPlayerName("");
  }

  // Add group
  const [groupName, setGroupName] = useState<string>("");
  const [maxScore, setMaxScore] = useState<number | null>(null);
  const { updateGroups } = useContext(GroupsContext);

  const handleCreateGroup = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const body = {
      name: groupName,
      maxScore,
    }

    const url = new URL(`${apiAddr}/group`);
    const resp = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", "Authentication": `Bearer: ${jwt}` },
    });

    if (!resp.ok) {
      alert(await resp.text())
      return;
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
              ? <button onClick={logout}>Logout</button>
              : <form onSubmit={handleLogin}>
                <div>
                  <label>Name</label>
                  <input
                    name="name"
                    className="bg-gray-300 p-2 rounded-lg"
                    placeholder="e.g. John Smith"
                    required={true}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />

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
