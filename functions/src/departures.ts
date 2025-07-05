import {
  DepartureInfo,
  Environment,
  LiveActivity,
  LiveActivityDepartureInfo,
  Product,
  StationDepartureInfo,
  StationName,
} from "./types.js";
import { getStationName } from "./utils.js";
import { Alternative, Departures } from "hafas-client";

export async function getDeparturesForActivity({
  environment,
  activity,
}: {
  environment: Environment;
  activity: LiveActivity;
}): Promise<LiveActivityDepartureInfo[]> {
  return await queryDepartures({
    environment,
    stationId: activity.stationId,
    products: activity.enabledProducts,
    showCancelledDepartures: activity.showCancelledDepartures,
    maxResults: 4,
    mapDeparture: (dep: Alternative, plannedTime: number, predictedTime: number | null): LiveActivityDepartureInfo => ({
      plannedTime,
      predictedTime,
      lineLabel: dep.line?.name || "?",
      destination: getDestination(dep),
      isCancelled: dep.cancelled || false,
    }),
  });
}

export async function getDeparturesForStation(params: {
  environment: Environment;
  stationId: string;
  products: Product[];
  showCancelledDepartures: boolean;
}): Promise<StationDepartureInfo[]> {
  return await queryDepartures({
    ...params,
    maxResults: 40,
    mapDeparture: (dep: Alternative, plannedTime: number, predictedTime: number | null): StationDepartureInfo => ({
      plannedTime,
      predictedTime,
      id: dep.tripId,
      line: {
        name: dep.line?.name,
        productName: dep.line?.productName,
        product: dep.line?.product as Product,
      },
      destination: getDestination(dep),
      isCancelled: dep.cancelled || false,
    }),
  });
}

function getDestination(dep: Alternative): StationName {
  const name = dep.destination?.name || dep.direction || "Unknown";
  return getStationName(name);
}

async function queryDepartures<T extends DepartureInfo>({
  environment,
  stationId,
  products,
  showCancelledDepartures,
  maxResults = 10,
  mapDeparture,
}: {
  environment: Environment;
  stationId: string;
  products: Product[];
  showCancelledDepartures: boolean;
  maxResults?: number;
  mapDeparture: (dep: Alternative, plannedTime: number, predictedTime: number | null) => T;
}): Promise<T[]> {
  const departures: Departures = await environment.hafasClient.departures(stationId, {
    // We need maxResults departures, but there is no filter for cancelled departures, so we need to fetch more and filter later
    results: showCancelledDepartures ? maxResults : Math.floor(maxResults * 1.4),

    // Look ahead 8 hours, so that we catch departures in the morning, if queried in the evening
    duration: 60 * 8,

    // Products have to be explicitly false to be excluded. Hence, add all keys from Product enum,
    // and set the value to true if the product is in the products parameter, otherwise false.
    products:
      products.length === 0
        ? undefined // Include all products
        : Object.fromEntries(Object.keys(Product).map(product => [product, products.includes(product as Product)])),
  });

  return departures.departures
    .filter((dep: Alternative) => showCancelledDepartures || !dep.cancelled)
    .map((dep: Alternative) => {
      const plannedTime = dep.plannedWhen ? new Date(dep.plannedWhen).getTime() / 1000 : 0;
      const predictedTime = dep.when && dep.when !== dep.plannedWhen ? new Date(dep.when).getTime() / 1000 : null;

      return mapDeparture(dep, plannedTime, predictedTime);
    })
    .sort((a, b) => {
      // Use predictedTime if available, otherwise use plannedTime as the actual time
      const timeA = a.predictedTime ?? a.plannedTime;
      const timeB = b.predictedTime ?? b.plannedTime;
      return timeA - timeB;
    });
}
