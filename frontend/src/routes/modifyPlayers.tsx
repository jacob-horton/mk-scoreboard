import { useLoaderData } from "react-router-dom";
import Page from "../components/Page";
import { loader } from "./functions/addGame";
import { useEffect, useMemo, useState } from "react";
import { Player } from "../data/types";
import ax from "../data/fetch";

async function getAllPlayers() {
  const resp = await ax.get("/players");
  return (await resp.data) as Player[];
}

async function addPlayerToGroup(groupId: number, playerId: number) {
  ax.post(`/group/${groupId}/player/${playerId}`);
}

async function removePlayerFromGroup(groupId: number, playerId: number) {
  await ax.delete(`/group/${groupId}/player/${playerId}`);
}

const AddPlayerToGroup = () => {
  const { group, players: initialPlayersInGroup } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const [playersInGroup, setPlayersInGroup] = useState<Player[]>(initialPlayersInGroup);

  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  useEffect(() => {
    getAllPlayers().then((players) => setAllPlayers(players));
  }, []);

  const playersNotInGroup = useMemo(() => {
    return allPlayers.filter((p1) => !playersInGroup.some((p2) => p1.id === p2.id));
  }, [playersInGroup, allPlayers])

  const handleAddPlayerToGroup = (p: Player) => {
    setPlayersInGroup((players) => players.filter((player) => player.id !== p.id))
    removePlayerFromGroup(group.id, p.id);
  }

  const handleRemovePlayerFromGroup = (p: Player) => {
    setPlayersInGroup((players) => [...players, p]);
    addPlayerToGroup(group.id, p.id);
  }

  return (
    <Page titleBar={<h1 className="text-4xl font-light">Modify Players</h1>}>
      <div className="flex p-4 sm:p-0">
        <div className="w-1/2 flex flex-col space-y-2">
          <p>In Group</p>
          {playersInGroup.map((p) => (
            <button
              key={p.id}
              className="px-4 py-2 w-min rounded-lg transition bg-gray-200 hover:bg-gray-300 whitespace-nowrap"
              onClick={() => handleAddPlayerToGroup(p)}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="w-1/2 flex flex-col space-y-2">
          <p>Not In Group</p>
          {playersNotInGroup.map((p) => (
            <button
              key={p.id}
              className="px-4 py-2 w-min rounded-lg transition bg-gray-200 hover:bg-gray-300 whitespace-nowrap"
              onClick={() => handleRemovePlayerFromGroup(p)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </Page>
  );
};

export default AddPlayerToGroup;
