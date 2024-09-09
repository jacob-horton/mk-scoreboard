import ax from "./fetch";
import { Group } from "./types";

export async function getGroups(): Promise<Group[]> {
  return ax.get("/groups").then(async (resp) => {
    if (resp.status >= 400) {
      throw new Error(resp.statusText);
    }

    return resp.data as Group[];
  });
}
