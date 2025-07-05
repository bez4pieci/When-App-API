import { Environment, Product, SearchResult } from "./types.js";
import { getStationName } from "./utils.js";
import { Station, Stop } from "hafas-client";

export async function search(environment: Environment, query: string): Promise<SearchResult[]> {
  const results = (await environment.hafasClient.locations(query, {
    stops: true,
    addresses: false,
    poi: false,
    results: 4,
    fuzzy: true,
  })) as (Station | Stop)[];

  return results
    .filter((result): result is (Station | Stop) & { id: string; name: string } => !!result.id && !!result.name)
    .map(result => ({
      id: result.id,
      stationName: getStationName(result.name),
      latitude: result.location?.latitude,
      longitude: result.location?.longitude,
      products: Object.entries(result.products ?? {})
        .filter(([_, isEnabled]) => isEnabled)
        .map(([key]) => key as Product),
    }));
}
