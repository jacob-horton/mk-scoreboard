import { useState } from "react";
import Page from "../components/Page";
import { Form } from "react-router-dom";
import getApiAddr from "../data/ip";
import IntTextBox from "../components/IntTextBox";
import store from "store2";

const Settings = () => {
  const [playerName, setPlayerName] = useState<string>("");
  const [birthday, setBirthday] = useState<string>("");

  const handleCreatePlayer = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const body = {
      name: playerName,
      birthday: birthday.trim() === "" ? null : birthday,
    }

    const apiAddr = getApiAddr();
    const url = new URL(`${apiAddr}/player`);
    const resp = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    if (!resp.ok) {
      alert(await resp.text())
      return;
    }

    setPlayerName("");
    setBirthday("");
  }

  const [groupName, setGroupName] = useState<string>("");
  const [maxScore, setMaxScore] = useState<number | null>(null);

  const handleCreateGroup = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const body = {
      name: groupName,
      maxScore,
    }

    const apiAddr = getApiAddr();
    const url = new URL(`${apiAddr}/group`);
    const resp = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    if (!resp.ok) {
      alert(await resp.text())
      return;
    }

    setGroupName("");
    setMaxScore(null);
    // TODO: refresh side bar
  }

  const [graphTension, _setGraphTension] = useState<number>(store.get("graphTension"));
  const setGraphTension = (tension: number) => {
    store.set("graphTension", tension);
    _setGraphTension(tension);
  }

  return (
    <Page titleBar={<h1 className="text-4xl font-light">Settings</h1>}>
      <div className="max-w-72 px-4 sm:px-0 space-y-16">
        <Form onSubmit={handleCreatePlayer} className="space-y-4">
          <h2 className="text-xl text-gray-800">Create Player</h2>
          <div className="flex flex-col">
            <label>Name</label>
            <input
              className="bg-gray-300 p-2 rounded-lg"
              placeholder="Name"
              required={true}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label>Birthday</label>
            <input
              className="bg-gray-300 p-2 rounded-lg"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          <button
            className="px-4 py-2 rounded-lg transition bg-blue-500 text-white hover:bg-blue-400"
            type="submit"
          >
            Submit
          </button>
        </Form>

        <Form onSubmit={handleCreateGroup} className="space-y-4">
          <h2 className="text-xl text-gray-800">Create Group</h2>
          <div className="flex flex-col">
            <label>Name</label>
            <input
              className="bg-gray-300 p-2 rounded-lg"
              placeholder="Name"
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
        </Form>


        <div>
          <h2 className="text-xl text-gray-800">Other Settings</h2>
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
    </Page>
  );
};

export default Settings;
