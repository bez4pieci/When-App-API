import { DepartureInfo, LiveActivity, ProductInApp } from "./types.js";
import { Alternative } from "hafas-client";
import { Departures } from "hafas-client";
import { createClient } from "hafas-client";
import { profile as bvgProfile } from "hafas-client/p/bvg/index.js";

const hafasClient = createClient(bvgProfile, "departures-api");

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

export async function getDepartures(activity: LiveActivity): Promise<DepartureInfo[]> {
  const departures: Departures = await hafasClient.departures(activity.stationId, {
    results: 4,
    duration: 60 * 8, // Look ahead 8 hours, so that we catch departures in the morning, if queried in the evening
    products: Object.fromEntries(
      Object.entries(productMapping).map<[string, boolean]>(([key, value]) => [
        value,
        activity.enabledProducts.includes(key as ProductInApp),
      ])
    ),
  });

  return departures.departures
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
