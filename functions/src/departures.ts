import { DepartureInfo, Environment, LiveActivity, ProductInApp } from "./types.js";
import { Alternative } from "hafas-client";
import { Departures } from "hafas-client";

const productMapping: Record<ProductInApp, string> = {
  [ProductInApp.suburbanTrain]: "suburban",
  [ProductInApp.subway]: "subway",
  [ProductInApp.tram]: "tram",
  [ProductInApp.bus]: "bus",
  [ProductInApp.regionalTrain]: "regional",
  [ProductInApp.ferry]: "ferry",
  [ProductInApp.highSpeedTrain]: "express",
  [ProductInApp.onDemand]: "onDemand", // TODO: Verify name
  [ProductInApp.cablecar]: "cablecar", // TODO: Verify name
};

export async function getDeparturesForActivity(
  environment: Environment,
  activity: LiveActivity
): Promise<DepartureInfo[]> {
  return await getDepartures(
    environment,
    activity.stationId,
    activity.enabledProducts,
    activity.showCancelledDepartures
  );
}

export async function getDeparturesForStation(
  environment: Environment,
  stationId: string,
  products: ProductInApp[],
  showCancelledDepartures: boolean
): Promise<DepartureInfo[]> {
  return await getDepartures(environment, stationId, products, showCancelledDepartures);
}

async function getDepartures(
  environment: Environment,
  stationId: string,
  products: ProductInApp[],
  showCancelledDepartures: boolean
): Promise<DepartureInfo[]> {
  const departures: Departures = await environment.hafasClient.departures(stationId, {
    // We need 4 departures, but there is no filter for cancelled departures, so we need to fetch more and filter later
    results: showCancelledDepartures ? 4 : 10,

    // Look ahead 8 hours, so that we catch departures in the morning, if queried in the evening
    duration: 60 * 8,

    products: Object.fromEntries(
      Object.entries(productMapping).map<[string, boolean]>(([key, value]) => [
        value,
        products.includes(key as ProductInApp),
      ])
    ),
  });

  return departures.departures
    .filter((dep: Alternative) => showCancelledDepartures || !dep.cancelled)
    .map((dep: Alternative) => {
      const plannedTime = dep.plannedWhen ? new Date(dep.plannedWhen).getTime() / 1000 : 0;
      const predictedTime = dep.when && dep.when !== dep.plannedWhen ? new Date(dep.when).getTime() / 1000 : null;

      return {
        lineLabel: dep.line?.name || "?",
        destination: dep.direction || dep.destination?.name || "Unknown",
        plannedTime,
        predictedTime,
        isCancelled: dep.cancelled || false,
      };
    })
    .sort((a, b) => {
      // Use predictedTime if available, otherwise use plannedTime as the actual time
      const timeA = a.predictedTime ?? a.plannedTime;
      const timeB = b.predictedTime ?? b.plannedTime;
      return timeA - timeB;
    });
}
