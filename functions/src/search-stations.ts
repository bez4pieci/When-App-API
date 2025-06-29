import { Environment } from "./types.js";
import { Location, Station, Stop } from "hafas-client";

export async function search(environment: Environment, query: string): Promise<readonly (Station | Stop | Location)[]> {
  const results = await environment.hafasClient.locations(query, {
    stops: true,
    addresses: false,
    poi: false,
    results: 4,
    fuzzy: true,
  });

  return results;
}
