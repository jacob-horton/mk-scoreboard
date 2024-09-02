import getApiAddr from "./ip";
import { Group } from "./types";

export async function getGroups(): Promise<Group[]> {
  const apiAddr = getApiAddr();
  return fetch(`${apiAddr}/groups`).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return response.json().then((data) => data as Group[]);
  });
}
