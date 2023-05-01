import getIP from "./ip";
import { Group } from "./types";

export async function getGroups(): Promise<Group[]> {
  const ip = getIP();
  return fetch(`http://${ip}:8080/groups/list`).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return response.json().then((data) => data as Group[]);
  });
}
