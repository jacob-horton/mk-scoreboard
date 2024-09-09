import ax from "./fetch";
import { Group } from "./types";

export async function getGroups(): Promise<Group[]> {
  return ax.get("/groups").then(async (resp) => {
    return resp.data as Group[];
  });
}
